# CURSOR_PLAN.md — Personalization Layer (Cursor / Opus 4.8 agent)

> **You are one of two agents working on this repo in parallel.**
> A Claude Code agent is simultaneously overhauling the diagnostic engine
> (`backend/src/**`, `backend/tests/**`, `backend/eval/**`, `frontend/lib/audio/**`,
> and the internals of `/api/diagnose` + `/api/explain`). **Those paths are
> off-limits to you.** This file is your complete, self-contained brief.
> Read `CLAUDE.md`, `AGENTS.md`, and `PRODUCT.md` before writing any code or copy.

## Mission

Add real personalization to RevSense while keeping its privacy story intact:

1. A device-local **garage** (saved vehicles) and **scan history**, built behind a
   repository interface so a real database can be swapped in later without a UI rewrite.
2. **Vehicle-specific priors** from the free NHTSA recalls/complaints APIs, passed
   into the diagnosis request so the engine can weight causes for *this exact
   make/model/year* — plus recall notices surfaced in the UI.
3. Personalized UX: one-tap vehicle prefill, recurrence detection across scans,
   and history-aware AI explanations.

Nothing here may make diagnosis slower or more fragile: every personalization
input is optional, non-blocking, and fails silently to today's behavior.

---

## The shared contract (do not define these yourself — import them)

The Claude Code agent is adding these to `backend/src/schemas.ts` (exported from
`@revsense/backend`) in a commit landing right after this file. **If the types
aren't there yet, start with B1/B4/B5 (no backend dependency) and pick up B2/B3
once they appear.** Treat everything in `@revsense/backend` as read-only imports.

```typescript
export interface VehiclePriors {
  // Relative complaint density per category for this exact make/model/year,
  // derived from NHTSA complaint `components`. Values 0..1.
  categoryWeights: Partial<Record<IssueCategory, number>>;
  // Categories with at least one open recall — stronger prior + surfaced to user.
  recallCategories: IssueCategory[];
  source: "nhtsa";
  fetchedAt: string; // ISO timestamp
}

// DiagnoseRequest gains:   priors?: VehiclePriors | null
// DiagnosisResult gains:   personalization?: { priorsApplied: boolean; recallNotice: string | null } | null
// POST /api/explain body gains an optional top-level field:
//   ownerContext?: string | null   // ≤300 chars, e.g. "Second report of a similar
//                                  // noise on this vehicle; a scan 3 weeks ago
//                                  // ranked CV joint wear first."
```

The engine applies `categoryWeights`/`recallCategories` as a bounded base-rate
boost (it can break ties between causes, never manufacture a top cause, never
touch safety verdicts). You produce the priors; the engine consumes them.

## File ownership (hard boundary)

**You own (all new files):**
- `frontend/lib/storage/` — garage + history persistence
- `frontend/lib/priors/` — NHTSA → priors mapping
- `frontend/app/api/vehicle-history/route.ts` — new API route
- New UI components for garage, history, recall notices, recurrence banner
- Small wiring edits in existing wizard/results components (listed per phase below)

**You must not touch:**
- Anything under `backend/` (read-only imports only)
- `frontend/lib/audio/**`
- `frontend/app/api/diagnose/route.ts`, `frontend/app/api/explain/route.ts`,
  `frontend/app/api/demo/route.ts`, `frontend/app/api/status/route.ts`

If something you need seems to require editing an off-limits file, stop and
leave a note in your summary instead of editing it.

---

## Phase B1 — Storage layer (repository pattern, DB-ready)

**`frontend/lib/storage/types.ts`**

```typescript
export interface SavedVehicle {
  id: string;                 // crypto.randomUUID()
  make: string;
  model: string;
  year: number;
  mileage: number | null;
  engineType: EngineType;     // import from @revsense/backend
  nickname: string | null;    // "Dad's Civic"
  createdAt: string;          // ISO
  lastScanAt: string | null;
}

export interface ScanRecord {
  id: string;
  vehicleId: string | null;   // null if the vehicle wasn't saved
  createdAt: string;
  symptomText: string;
  contexts: SoundContext[];   // import from @revsense/backend
  topCauses: { id: string; title: string; category: string; confidence: number }[]; // top 3
  overall: { severity: string; urgency: string; safeToDrive: string; verdict: string };
  mode: "heuristic" | "ai-enhanced";
}
```

**`frontend/lib/storage/repository.ts`** — the interface every UI surface uses:

```typescript
export interface GarageRepository {
  listVehicles(): Promise<SavedVehicle[]>;
  saveVehicle(v: Omit<SavedVehicle, "id" | "createdAt">): Promise<SavedVehicle>;
  updateVehicle(id: string, patch: Partial<SavedVehicle>): Promise<void>;
  deleteVehicle(id: string): Promise<void>;        // also deletes its scans
  appendScan(s: Omit<ScanRecord, "id" | "createdAt">): Promise<ScanRecord>;
  listScans(vehicleId?: string): Promise<ScanRecord[]>; // newest first
  eraseAll(): Promise<void>;
  exportAll(): Promise<string>;                     // JSON blob for the user
}
```

**`frontend/lib/storage/localRepository.ts`** — localStorage implementation:
- Single versioned key: `revsense.garage.v1` → `{ version: 1, vehicles: [], scans: [] }`.
- Migration stub: on load, if `version < CURRENT`, run migrations (empty switch for now).
- Cap scans at 50, prune oldest on append. Guard every read with try/catch →
  corrupted JSON resets to empty (never crash the app over storage).
- SSR-safe: all access behind `typeof window !== "undefined"` checks; the
  repository is only used from client components.
- Export a singleton `getGarageRepository(): GarageRepository` factory — this is
  the one line to change when a DB implementation arrives.

**Privacy surface:** wherever garage/history UI appears, include the line
"Your saved vehicles and scan history stay on this device." and an
"Erase all saved data" control wired to `eraseAll()` (with a confirm step).

## Phase B2 — NHTSA vehicle-history route + priors mapping

**`frontend/app/api/vehicle-history/route.ts`** — `GET /api/vehicle-history?make=&model=&year=`

- Fetch **in parallel** with `Promise.allSettled` and a 3.5s `AbortSignal.timeout`:
  - `https://api.nhtsa.gov/complaints/complaintsByVehicle?make={make}&model={model}&modelYear={year}`
  - `https://api.nhtsa.gov/recalls/recallsByVehicle?make={make}&model={model}&modelYear={year}`
- Both are free, no auth. Mirror the existing NHTSA pattern in
  `frontend/app/api/models/route.ts` (timeout handling, graceful fallback,
  `Cache-Control: public, s-maxage=86400, stale-while-revalidate=604800`).
- Any failure → `200` with `{ priors: null, recalls: [] }`. Never a 5xx to the client.
- Response shape:

```typescript
{
  priors: VehiclePriors | null,   // null when both fetches fail or return nothing
  recalls: {                      // for UI display (top 3 by report date, newest first)
    component: string;            // human-readable, e.g. "Power train"
    summary: string;              // clipped to ~200 chars
    consequence: string;          // clipped to ~200 chars
  }[]
}
```

**`frontend/lib/priors/mapComponents.ts`**

- Map NHTSA `components` strings (complaints) / `Component` (recalls) to
  `IssueCategory`. NHTSA components are comma/colon-delimited uppercase paths
  (e.g. `"POWER TRAIN:AUTOMATIC TRANSMISSION"`, `"SERVICE BRAKES, HYDRAULIC"`).
  Match on the **first segment**, case-insensitive, substring-based:

  | NHTSA component contains | IssueCategory |
  |---|---|
  | `POWER TRAIN`, `DRIVELINE` | `drivetrain` |
  | `SERVICE BRAKES`, `PARKING BRAKE` | `brakes` |
  | `SUSPENSION` | `suspension` |
  | `STEERING` | `steering` |
  | `ENGINE COOLING` | `cooling` *(check before the generic ENGINE rule)* |
  | `ENGINE` | `engine` |
  | `ELECTRICAL SYSTEM`, `ELECTRONIC STABILITY` | `electrical` |
  | `TIRES`, `WHEELS` | `wheels_tires` |
  | `EXHAUST` | `exhaust` |
  | anything else (`AIR BAGS`, `SEAT BELTS`, `STRUCTURE`, …) | skip |

- **Build the mapping against the exported `ISSUE_CATEGORIES` from
  `@revsense/backend`** — only ever emit categories present in that array, so
  the mapping stays valid as the engine's category list grows (a `hvac` or
  `fuel_air` category may appear later; add mappings for `AIR CONDITIONER` →
  `hvac` and `FUEL SYSTEM` → `fuel_air` guarded by
  `ISSUE_CATEGORIES.includes(...)`).
- `categoryWeights`: count mapped complaints per category, then normalize by the
  max category count → values in 0..1. Drop categories below 0.1.
- `recallCategories`: unique mapped categories across open recalls.
- Keep this module pure (string in → category out) with unit-testable functions.

## Phase B3 — Wire priors into diagnosis

- **`frontend/components/diagnose/DiagnoseWizard.tsx`** (wiring only): when the
  vehicle step completes with a valid make/model/year, fire a non-blocking fetch
  to `/api/vehicle-history`, store `{ priors, recalls }` in wizard state. On
  submit, attach `priors` to the `DiagnoseRequest` body. **Diagnosis must never
  wait on this fetch** — if it hasn't resolved by submit time, send without it.
- **Results UI** (`frontend/components/results/`): render
  `result.personalization?.recallNotice` as a prominent but calm notice card
  (this is safety-adjacent info, not an alarm), and show a small
  "commonly reported for this vehicle" tag on cause cards whose `category` is in
  `recallCategories` or has `categoryWeights[category] >= 0.5`. Use the fetched
  `recalls` list for a collapsible "Open recalls for your vehicle" detail
  (component, what can happen, remedy is free at a dealer).

## Phase B4 — Garage + prefill UX

- After a completed diagnosis: a "Save this vehicle" affordance (skip if an
  identical make/model/year is already saved; then just update `lastScanAt`).
- A garage surface (either a small page at `frontend/app/garage/page.tsx` or a
  panel inside the wizard — your call, follow the existing design system):
  rename (nickname), update mileage, delete, erase-all.
- Wizard prefill: if the garage is non-empty, the vehicle step opens with saved
  vehicles as one-tap choices that fill make/model/year/mileage/engineType.
  When a saved vehicle is picked, nudge once: "Still about 82,000 miles?" with
  a quick-edit field; write the updated mileage back to the garage.

## Phase B5 — Scan history + recurrence

- After each completed diagnosis, `appendScan()` automatically (vehicleId when
  the vehicle is saved, else null).
- History view per vehicle: date, verdict chip, top cause + confidence; tapping
  an entry re-opens a read-only results view from the stored summary (store
  only the `ScanRecord` summary, not the full result object).
- **Recurrence detection (client-side, at diagnosis time):** if the current
  scan's vehicle has a prior scan within 90 days sharing a top-cause category
  (or ≥2 overlapping contexts), show a banner: *"You reported a similar noise
  on this vehicle N weeks ago. Recurring noises are worth a mechanic visit even
  if they come and go."*
- When recurrence is detected, include a one-sentence `ownerContext` in the
  **body of the existing background `/api/explain` call** (wiring in the results
  data-fetch layer, e.g. `frontend/lib/api.ts` — do not edit the route itself):
  e.g. `"Second report of a similar noise on this vehicle; a scan on June 12
  ranked CV joint wear first."` The backend threads it into the AI prose. If
  the backend hasn't shipped `ownerContext` support yet, sending the extra field
  is harmless (it's ignored) — send it anyway.

---

## Copy & voice rules (non-negotiable — see AGENTS.md for the full ban-list)

- RevSense reads as a **car diagnostic tool**. Never mention AI providers,
  models, "rule engine", pattern counts, or DSP jargon in user-facing copy.
- NHTSA attribution is allowed and encouraged for trust: phrase as
  "reported issues and open recalls for your vehicle (NHTSA data)".
- Privacy copy: "Your saved vehicles and scan history stay on this device."
- Recall notices are calm and practical, never alarmist. Always mention that
  recall repairs are free at a dealer.

## Verification checklist (run all before finishing)

1. `npm run typecheck && npm run lint && npm run build` from the repo root — all green.
2. `curl "http://localhost:3000/api/vehicle-history?make=honda&model=civic&year=2014"`
   → non-empty `categoryWeights`, recall entries present.
3. Same call with a nonsense make → `200` with `{ priors: null, recalls: [] }`.
4. Dev server: complete a diagnosis → save vehicle → reload → vehicle offered
   as one-tap prefill.
5. Run two similar scans on the same saved vehicle → recurrence banner appears,
   `/api/explain` request body contains `ownerContext` (check network tab).
6. "Erase all saved data" → localStorage key gone, garage empty after reload.
7. Block `api.nhtsa.gov` (devtools request blocking) → diagnosis still completes
   normally, no recall UI, no console errors surfaced to the user.
8. Demo flow `/diagnose?demo=1` still works unchanged.

## Out of scope for you

- Any change to scoring, knowledge base, schemas, AI prompts, or audio analysis
  (the other agent owns all of it).
- Accounts, auth, cloud sync (the repository interface is the future hook).
- Sending raw audio or symptom text to any new external service. NHTSA calls
  contain only make/model/year.
