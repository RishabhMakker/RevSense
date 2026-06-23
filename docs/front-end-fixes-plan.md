# RevSense — Front-End Fixes (Cursor / Opus Agent Brief)

> **This document is a complete, self-contained handoff for a Cursor agent that has NO prior
> context.** Read the whole "Critical context" section before touching code. Every fix below
> includes the file, the current state, and the target.

---

## Context — why this work exists

RevSense is a car-diagnostic web app. A user describes a noise their car is making (plus optional
audio, vehicle details, and "when it happens" contexts); a rule engine ranks the most likely
causes and produces an action plan + a script to give their mechanic. An optional AI layer only
refines wording — it never changes the verdict.

The app shipped an MVP, then a copy/declutter/visual revamp. The owner has since gone through the
live app and written a punch-list of issues (reproduced verbatim at the bottom). They fall into
three buckets: **(A) copy that still sounds engineer-written or "AI-y," (B) UI clutter / unclear
framing that erodes trust, and (C) two larger UX features — a properly styled Make/Model picker
and full mobile optimization.** This plan implements all of them, ordered cheapest-first.

The intended outcome: the app reads like a confident consumer product (not a dev narrating their
own architecture), the results screen is decluttered and its numbers are framed so they build
trust instead of undermining it, and the vehicle inputs feel polished on mobile.

---

## Critical context the agent MUST internalize

### Repo layout
- **Monorepo root (= git root):** `car-diagnostic-app/` (absolute: `/Users/Rishabh/Coding/RevSense/car-diagnostic-app/`). **All paths below are relative to this root.**
- **`frontend/`** — Next.js **16** (App Router, Turbopack), **React 19**, **Tailwind CSS v4**.
  - ⚠️ **No `tailwind.config.ts`.** Theme is defined inline via `@theme inline` in `frontend/app/globals.css`. Add design tokens there, not in a config file.
  - API route handlers live in `frontend/app/api/*/route.ts`.
- **`backend/`** — pure-TypeScript package `@revsense/backend` (the rule engine + knowledge base + zod schemas). It is `transpilePackages`-d into the frontend build; there is no separate server. Editing it is fine and ships with the frontend.
- npm **workspaces**; run commands from `car-diagnostic-app/` (root) unless noted.

### Branch + deploy workflow (follow exactly)
- Do all work on the **`frontend`** branch. Merge `frontend` → `main` to deploy (Vercel auto-deploys `main`). Do not commit straight to `main`.
- **Keep build, lint, and the test suite green** (there are ~30 backend tests). Run them before declaring done (see Verification).
- Prod URL: `https://rev5en5e.vercel.app/`. The AI key is already configured in Vercel — do not tell the user to add it.

### Read these repo files first (they hold the canonical rules)
- **`AGENTS.md`** — canonical "Voice" and "Visual system" rules. Authoritative.
- **`CLAUDE.md`** and **`PRODUCT.md`** — product principles, including the confidence-cap rationale.
Read them at the start; the essentials are inlined below so you don't get them wrong.

### Voice rules (consumer product, not a dev log) — **hard ban-list**
Positioning: RevSense is a **car diagnostic / analysis tool where a recording is one optional
input** — NOT a sound-recording product. User-facing copy must **never surface implementation
internals**:
- ❌ AI provider names (OpenRouter / Anthropic / OpenAI) → say "AI" or nothing.
- ❌ Engine internals: pattern counts ("29 known patterns"), "rule engine", "transparent rule-based engine".
- ❌ DSP jargon: FFT, spectral centroid, "acoustic clues".
- ❌ The literal phrase **"an online triage"** (it appears today — kill it).
- Privacy is one line: "We don't save your recordings or results."
- Voice = **Trustworthy · Clear · Practical.** Write like a knowledgeable friend, not a system.

### Visual system (so new UI matches)
- **Matte, solid dark surfaces.** `.glass` / `.glass-strong` are now FLAT solid fills (not frosted). The only intentional frosted element is `.glass-float` on the landing hero. New components should use the existing solid surfaces, not introduce new glassmorphism.
- **Solid amber accent** (no gradient text). Amber/orange tokens: `--color-accent-300..600` and `--color-ember-500` in `globals.css`.
- a11y already in place — preserve it: reduced-motion fallbacks (globals.css + `MotionProvider`), AA contrast (`zinc-400` body text & placeholders), `focus-visible` rings, `aria-live` on the safety verdict. Any new interactive element needs a focus ring, keyboard support, and a 44px tap target (see Phase 4).
- The shared input style string (reuse it):
  ```
  w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white
  placeholder:text-zinc-400 outline-none transition-colors focus:border-amber-400/50 focus:bg-white/[0.06]
  ```
  Defined as `inputClass` in `frontend/components/diagnose/VehicleStep.tsx`.
- Toggle/selected state pattern (reuse for dropdown highlight): `border-amber-400/60 bg-amber-500/15 text-amber-200`.

### 🔒 The single most important guardrail — confidence is capped ON PURPOSE
The per-cause `confidence` (the "% match" number) is computed in `backend/src/engine.ts`,
function `toConfidence` (~line 192):
```ts
// Saturating curve keeps confidence honest: never near 100%.
return Math.max(15, Math.min(88, Math.round((100 * score) / (score + 65))));
```
It is **deliberately clamped to 15–88%** per PRODUCT.md principle 2, *"triage honesty, not false
precision."* A low top-cause % is **by design, not a bug.** **DO NOT change this formula, the
clamp, or the `65` constant to make numbers bigger.** The owner's trust concern is fixed by
*presentation/framing only* (Fix 1.7), never by inflating the math.

### Data shapes you'll touch (from `backend/src/schemas.ts`)
- **Request** `diagnoseRequestSchema` → `vehicle` (`vehicleSchema`: `make` req, `model` req, `year` req 1960..currentYear+1, `mileage` **`.nullish()`** = optional, `engineType` enum default `"unknown"`), `symptomText` (10–2000 chars), `contexts` (1–12), `audio` nullish.
- **Result** `DiagnosisResult` → `overall` (`DiagnosisOverall`: `severity`, `urgency`, `urgencyLabel`, `safeToDrive`, `verdict`, `summary`), `causes: RankedCause[]` (each has `rank`, `title`, `confidence` 15–88, `severity`, `category`, `checksFirst`, etc.), `whatToCheckFirst: string[]`, `mechanicScript: string`, `redFlags`, `inputQuality`, `disclaimer`.
- Engine builds `whatToCheckFirst` (~engine.ts:401–416) by **interleaving the top-3 causes' `checksFirst` arrays and de-duping, up to 5 items.** It is **NOT** one-step-per-cause — important for Fix 1.6.

---

## PHASE 1 — Copy & declutter (cheap, do first)

### 1.1 — VehicleStep subtitle is engine-centric
- **File:** `frontend/components/diagnose/VehicleStep.tsx` (subtitle `<p>`, ~lines 55–57).
- **Current:** *"Age and mileage matter: a 12-year-old car with 130k miles wears differently than a 3-year-old one, and that changes what's likely."*
- **Why it's wrong:** talks about how cars wear (engineer framing) instead of what the user gets.
- **Target:** one short line, user-benefit framed. Suggested: *"A few details about your car help us narrow down what's most likely."* (You can fold the mileage-value message from 1.5 in here.) Keep it ≤ ~1 line.

### 1.2 — Review step audio label reads awkwardly
- **File:** `frontend/components/diagnose/ReviewStep.tsx` (Audio `Row`, ~lines 80–82).
- **Current:** *"No recording — text and context only"*.
- **Target:** natural phrasing, e.g. *"No recording added — we'll diagnose from your description."* Match the calm, plain tone of the other review rows.

### 1.3 — Mechanic script sounds AI-y + contains "an online triage"
- **File:** `backend/src/engine.ts`, function `buildMechanicScript` (~lines 313–346).
- **Current:** the `causePart` template literally says **"An online triage suggested checking, in order: …"** — violates the voice ban-list and sounds robotic. The script is first-person text the *user* reads aloud to their mechanic.
- **Target:** rewrite `causePart` and `askPart` to sound like a real person, no system/AI reference. Example direction (keep the dynamic data — vehicle, sounds, contexts, audio hints, the top-3 cause titles + their `%`):
  - causePart → *" From what I can tell, the most likely culprits are {cause list with %}."*
  - askPart → *" Could you start by checking the {category} area?"*
- Keep the existing first-person opening (`I'm hearing … from my {year} {make} {model}…`). Do not surface "AI," "engine," "triage," or pattern counts anywhere in the string.

### 1.4 — Three stacked pills at top of results feel redundant
- **File:** `frontend/components/results/ResultsView.tsx` (verdict banner, ~lines 106–120).
- **Current:** three pills in a row — **verdict** (`result.overall.verdict`, e.g. "Avoid driving until this is inspected"), **severity** ("Severity: High"), **urgency** (`result.overall.urgencyLabel`, e.g. "Address before driving again"). Severity and urgency say almost the same thing twice.
- **Target:** keep the **verdict pill prominent** (it's the action + carries the icon + `aria-live`). Collapse **severity + urgency into ONE muted secondary chip**, e.g. `High · address before driving again` (severity word + urgency label, separated by `·`). Preserve `aria-live` on the verdict, the `VERDICT_STYLES`/`SEVERITY_STYLES` color logic, and reduced-motion behavior. Net result: 2 elements (one bold action, one muted detail) instead of 3.

### 1.5 — Mileage labeled bare "optional"
- **File:** `frontend/components/diagnose/VehicleStep.tsx` (Mileage `Field`, ~line 98).
- **Decision (owner):** keep it optional (no schema change — `mileage` stays `.nullish()`), but relabel so the value is clear.
- **Target:** change `hint="optional"` → `hint="helps accuracy"` (or similar). Optionally reinforce in the 1.1 subtitle. **Do not** add validation or change the zod schema.

### 1.6 — Action plan: what is it based on, do the 5 steps map to the 5 causes?
- **Answer (for your understanding):** "What to check first" = `result.whatToCheckFirst`, assembled in `engine.ts` (~lines 401–416) by interleaving the **top-3 causes'** `checksFirst` items and de-duping (≤5 steps). It is a **prioritized checklist drawn from the likely causes — NOT one step per cause.** Today nothing in the UI says that, so it looks arbitrary.
- **Target (language/framing only — owner said NO photos yet, do NOT touch the algorithm):**
  1. Add a one-line intro under the "What to check first" card title in `frontend/components/results/ResultsView.tsx` (~lines 185–196), e.g. *"A few things to look at first, based on the likely causes above."*
  2. Optional, if time allows: a light **plain-language pass** on the most technical `checksFirst` strings for the **common** issues in `backend/src/knowledgeBase.ts` (e.g. swap "outer CV boot" phrasing for a layperson hint). Keep it light — there are 29 issues; prioritize the few most-likely-to-surface ones. Do not restructure data or remove technical accuracy.

### 1.7 — Percentages erode trust when the top cause is low
- **Decision (owner):** **keep the number, reframe it. DO NOT inflate** (see guardrail above).
- **Files:** `frontend/components/results/CauseCard.tsx` (the `{cause.confidence}% match` badge, ~lines 76–88) and `ResultsView.tsx` ("Likely causes, ranked" heading).
- **Target — two presentation changes:**
  1. **Lead with rank language.** On each `CauseCard`, add a small qualitative label driven by `cause.rank`/`confidence` band: rank 1 → **"Most likely"**, then **"Possible"** / **"Worth checking"** for the rest. This makes a 40% top cause read as *"the most likely of several"* rather than *"only 40% sure."*
  2. **Add a one-line legend** near the causes heading explaining the number, e.g. *"% match = how closely your description fits each known pattern — a starting point for your mechanic, not the odds it's correct."* Could be inline helper text or a small tooltip/info affordance consistent with the design system.
  - Keep the existing animated confidence bar + `confidenceColor()` logic. Keep the raw `%`. The framing does the trust work.

---

## PHASE 2 — Custom Make dropdown (replaces native datalist)

- **Current:** `frontend/components/diagnose/VehicleStep.tsx` (~lines 62–76) uses a native `<input list="vehicle-makes"> + <datalist>` fed by a hardcoded `MAKES` array (~20 makes, lines 14–18). It renders as the browser's generic dropdown — off-brand.
- **There is NO existing Select/Combobox/Dropdown component** in `frontend/components/` — you'll build the first one.
- **Target:** a reusable, on-brand **Combobox** component (build it generic — **Phase 3 reuses it for Model**):
  - New file, e.g. `frontend/components/ui/Combobox.tsx`.
  - Behavior: typeable text input (reuse `inputClass`) + a **styled dropdown panel** (matte solid surface, `.glass`/`.glass-strong` look, amber selected/hover state using `border-amber-400/60 bg-amber-500/15 text-amber-200`). Filters options as the user types. **Free text allowed** — the user can submit a make not in the list.
  - Accessibility/UX: full keyboard support (↑/↓/Enter/Esc), `role="combobox"`/`listbox` ARIA wiring, click-outside-to-close, `focus-visible` ring, reduced-motion-aware open/close (use `MotionProvider`/framer-motion already in the app). Min 44px option height (Phase 4).
  - Wire it into the Make field; keep the `MAKES` array as the option source (move it somewhere shared if convenient).

---

## PHASE 3 — Model autocomplete (hybrid dataset + fuzzy spell-correct)

Owner wants: real model suggestions **per selected make**, **free-typed models still allowed**, and
**spelling fixes** so input feels meaningful. Chosen approach: **Hybrid data source.**

- **Reuse the Phase 2 `Combobox`** for the Model field (currently a plain text input, VehicleStep.tsx ~lines 77–85).
- **Data — hybrid:**
  1. **Bundled static dataset** (instant, offline, primary): new `frontend/lib/vehicles/models.ts` (or `.json`) mapping each make → its popular models. Curate the common models for the existing ~20 makes (and any you add). This covers the overwhelming majority of inputs with zero network.
  2. **NHTSA vPIC fallback** (long tail): for makes/models not in the bundle, fetch from the free U.S. government API (no key): `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/{make}?format=json` → returns `{ Results: [{ Make_Name, Model_Name, ... }] }`.
     - **Proxy + cache via a Next route handler** `frontend/app/api/models/route.ts` (avoids CORS, lets you cache). Server checks the static bundle first, then NHTSA; cache responses (route-level `revalidate`/cache headers; optionally memoize). **Graceful fallback:** if NHTSA errors/times out, the field still works as free text — never block submission.
- **Free-typed models:** the Combobox must accept values not in the list (same as Make).
- **Fuzzy spell-correction:** when the typed model is close to a known model for the selected make, surface a correction. Recommended: add **`fuse.js`** for fuzzy filtering inside the combobox, plus a Levenshtein-distance threshold for a "Did you mean **Civic**?" affordance (or gentle auto-snap on blur when distance is very small). Keep it suggestive, not forced — don't overwrite the user's text without consent.
- Models depend on the selected make: clear/refresh model options when `make` changes.

---

## PHASE 4 — Mobile optimization

Assume **most users are on mobile.** Current state (verified earlier): no horizontal overflow at
375px and layouts already stack, **but tap targets are only AA (~24px) not 44px**, and inputs use
14px text. Tasks:

- **Bump all interactive tap targets to ≥44×44px:** wizard nav buttons, the engine-type & context toggle chips, inputs (currently `py-2.5` ≈ 40px — nudge up), the new Combobox options, the "Copy script" button, results reset button. Use min-height utilities; don't break desktop density.
- **iOS zoom gotcha:** inputs at `text-sm` (14px) trigger iOS auto-zoom on focus. Use **≥16px font on inputs at mobile breakpoints** (e.g. `text-base sm:text-sm`) to prevent the zoom jump — applies to `inputClass` and the new Combobox input/textarea.
- **Results layout on small screens:** the results grid (`lg:col-span-2` causes column + side cards) — confirm side cards ("What to check first", "What to tell your mechanic") stack cleanly below the causes on mobile and the verdict banner / pills wrap without overflow (re-check after Fix 1.4).
- **Combobox on mobile:** dropdown panel sized within viewport, scrollable, doesn't overflow horizontally; keyboard/scroll behavior sane.
- **Verify** the wizard step indicator, the scanning overlay, and the diagnose form at **375px and 414px**.

---

## Verification (run before declaring done)

From `car-diagnostic-app/` (root):
1. **Tests:** run the backend test suite (npm workspace test script) — keep all ~30 green. The mechanic-script and engine tests may assert on copy you changed in 1.3 — update assertions to match the new wording, don't weaken the tests.
2. **Lint + build:** run lint and `next build` for `frontend` — must pass clean (Tailwind v4, Turbopack).
3. **Run the app** (`npm run dev` from root or `frontend`) and walk the full flow:
   - Vehicle step: Make combobox (keyboard + free text), Model combobox (suggestions per make, "did you mean" on a misspelling, free-typed model, make-change clears models), mileage relabel.
   - Submit → results: verify the 2-element verdict row (1.4), the rank labels + legend on causes (1.7), the action-plan intro (1.6), and the de-AI'd mechanic script with **no "online triage"** (1.3).
   - Use the demo: `/diagnose?demo=1` prefills the Honda Civic CV-joint scenario for quick end-to-end checks.
4. **Mobile:** test at **375px** and **414px** — confirm 44px tap targets, no iOS focus-zoom, no horizontal overflow, side cards stack.
5. **NHTSA fallback resilience:** simulate the API failing (offline / blocked) and confirm the Model field degrades to free text without blocking submission.
6. Grep the codebase for the ban-list once more (`online triage`, provider names, "rule engine", DSP terms) to confirm nothing user-facing leaked.

When green: commit on `frontend`, then merge → `main` to deploy.

---

## Out of scope / do NOT do
- **Logo / branding iteration** — owner is revisiting separately. Don't design a logo.
- **Photo/diagram descriptions for the action-plan steps** — explicitly deferred; language only in 1.6.
- **Inflating or changing the confidence formula** — see guardrail. Presentation only.
- Don't surface AI/engine/DSP internals anywhere (voice ban-list).

---

## Appendix — owner's original punch-list (verbatim)
1. "Age and mileage matter…" → AI/engine-ish language, talks about the engine rather than what users need. → **1.1**
2. Make dropdown should match the site's UI, not a generic dropdown (if easy). → **Phase 2**
3. Per-make model autocomplete/dropdown from real sources; allow models not on the list; fix spelling mistakes so input feels useful. → **Phase 3**
4. Why is mileage optional? → **1.5** (keep optional, relabel)
5. Fully optimize for mobile (assume most users are mobile). → **Phase 4**
6. Review/run section: "Audio / No recording — text and context only" reads awkwardly. → **1.2**
7. What is the action plan based on; do the 5 steps match the 5 causes? Fix language (no photos yet). → **1.6**
8. "What to tell your mechanic" sounds AI-y; "an online triage" sounds stupid. → **1.3**
9. Why 3 alerts at the top (verdict + severity + urgency)? → **1.4**
10. What are the percentages based on; why can the top cause be such a low %? (trust concern) → **1.7**
11. Edit logo/branding later — keep in mind, don't build yet. → **Out of scope**
