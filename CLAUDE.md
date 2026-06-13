# CLAUDE.md — RevSense

Guidance for Claude Code (and other coding agents) working on this repo.

## What this is

RevSense is a car-sound triage web app: users record/describe a car noise,
and a rule-based diagnostic engine (optionally enhanced by an LLM) returns
ranked likely causes with safety guidance. Built as a one-shot MVP, June 2026.

## Architecture (the one decision that matters)

npm workspaces monorepo, single Vercel deploy:

- **`frontend/`** — Next.js 16 (App Router, Turbopack) + TypeScript +
  Tailwind v4 + Framer Motion. Contains the UI **and** the API route
  handlers (`app/api/*`), because Vercel runs route handlers as serverless
  functions for free.
- **`backend/`** — `@revsense/backend`, a **pure TypeScript workspace
  package with no server**. All domain logic lives here: zod schemas,
  knowledge base, lexicon, scoring engine, red flags, AI providers. The
  frontend consumes it via `transpilePackages: ["@revsense/backend"]`
  (see `frontend/next.config.ts`; `outputFileTracingRoot` points at the repo
  root so Vercel bundles the workspace dep when Root Directory = `frontend`).

Do not introduce a standalone backend server — it would break the
one-project Vercel deployment that this structure exists to preserve.

## Folder map

```
backend/src/
  schemas.ts        # zod schemas + ALL shared types/labels (request, result, enums)
  lexicon.ts        # sound-word synonym matching (prefix-stem regexes)
  knowledgeBase.ts  # 29 KnownIssue entries + KNOWN_ISSUE_COUNT
  engine.ts         # scoring weights, confidence curve, verdict, mechanic script
  redFlags.ts       # stop-driving pattern detection
  demo.ts           # canned clicking-while-turning request (DEMO_REQUEST)
  ai/
    prompt.ts       # shared system prompt + JSON response schema
    anthropic.ts    # @anthropic-ai/sdk provider (structured outputs, adaptive thinking)
    openai.ts       # fetch-based OpenAI provider
    enhance.ts      # env resolution, defensive merge, graceful fallback
  index.ts          # public exports — frontend imports ONLY from here
backend/tests/engine.test.ts   # 25 vitest tests pinning engine behavior

frontend/app/
  page.tsx                # landing
  diagnose/page.tsx       # wizard page (?demo=1 prefills the demo scenario)
  api/diagnose/route.ts   # POST: validate → diagnose() → enhanceWithAI()
  api/demo/route.ts       # GET: deterministic sample result (no AI)
  api/status/route.ts     # GET: AI-configured status for the UI
frontend/components/
  landing/                # Hero, Sections (HowItWorks/Features/DemoCallout/Safety)
  diagnose/               # DiagnoseWizard (state owner), Audio/Vehicle/Symptom/Review steps,
                          # ScanningOverlay, types.ts
  results/                # ResultsView, CauseCard
  audio/Waveforms.tsx     # live analyser canvas + envelope bars
frontend/lib/
  audio/fft.ts            # radix-2 FFT
  audio/analyze.ts        # feature extraction + hint derivation (the honest-DSP layer)
  audio/useRecorder.ts    # MediaRecorder hook (voice processing disabled!)
  api.ts, ui.ts           # fetch client, severity/verdict styling maps
samples/                  # curl-able demo payload + expected behavior
```

## Commands (run from repo root)

```bash
npm install        # all workspaces
npm run dev        # Next dev server on :3000
npm test           # backend engine tests (vitest)
npm run typecheck  # tsc --noEmit in both workspaces
npm run lint       # eslint (frontend)
npm run build      # production build (must stay green)
```

## How the engine works (backend/src/engine.ts)

Each `KnownIssue` accumulates points: sound-type matches (+30, cap 45),
strong phrases (+12, cap 36), supporting phrases (+6, cap 18), strong
contexts (+18, cap 36), weak contexts (+8, cap 16), audio hints (+10, cap
20), mileage/age wear boosts (+8/+6), baseRate prior (×8). `notFor` excludes
engine types (e.g. belt squeal on EVs); `dampFor` halves (knock on diesels).
Confidence = `100·score/(score+65)`, clamped to **15–88%** — deliberately
never certain. Top 5 causes returned; trailing weak guesses trimmed but
never below 3. The overall verdict considers the top cause plus runners-up
**≥45% only** (tuned so a weak generic match can't set a stop-driving
verdict — see the test "squealing while braking"). Red flags (redFlags.ts)
force `safeToDrive: "no"` + `urgency: "immediate"` regardless of causes.

When tuning weights, run `npm test` — the suite pins the spec's example
scenarios (clicking+turning → CV joint #1, grinding+braking → metal pads +
red flag, EV excludes belt causes, confidence bounds, etc.).

## AI layer rules

- Env: `AI_PROVIDER` / `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` /
  `OPENROUTER_API_KEY` / `AI_MODEL`. No key → `enhanceWithAI` returns the
  heuristic result untouched; the app must never *require* AI.
  OpenRouter (`ai/openrouter.ts`) is the zero-cost path: OpenAI-compatible
  fetch with tolerant JSON extraction for `:free` models.
- The LLM may only rewrite explanations for causes the engine ranked
  (schema enum restricts ids) and may never relax the safety verdict —
  the merge in `ai/enhance.ts` enforces this; keep it that way.
- Anthropic provider uses `claude-opus-4-8`, adaptive thinking, and
  `output_config.format` JSON schema (structured outputs). The route sets
  `maxDuration = 60` for Vercel.

## Audio analysis honesty policy

`lib/audio/analyze.ts` computes real DSP features and maps them to coarse
hints (`rhythmic_ticking`, `tonal_whine`, …). The UI labels these "basic
acoustic clues". Never market this as a trained model, and never send raw
audio to the server — only the `AudioFeatures` object crosses the wire.

## Known limitations / future work

- No drivetrain-layout awareness (U-joint can rank for a FWD car).
- Heuristic text matching is English-only, prefix-stem based.
- No tests for the frontend audio analysis (it's browser-only; consider
  vitest + jsdom with synthesized PCM if expanding).
- Pulse detection is envelope-peak based; autocorrelation would be sturdier.
- Roadmap ideas live at the bottom of README.md.

## Conventions for future sessions

- Shared types/labels live in `backend/src/schemas.ts` — don't duplicate
  them in the frontend; import from `@revsense/backend`.
- UI copy that cites the knowledge-base size uses `KNOWN_ISSUE_COUNT`.
- Adding a knowledge-base entry: copy an existing `KnownIssue`, keep
  `checksFirst`/`confirmRuleOut` ≥2 items (tests enforce), add a scenario
  test if it has a distinctive signature.
- Keep `npm run build`, `npm test`, `npm run typecheck`, `npm run lint`
  green before finishing any change.
- Verify UI changes via the preview server (`.claude/launch.json` at the
  parent folder defines a `revsense` config) — the demo flow
  `/diagnose?demo=1` exercises the whole pipeline without a microphone.
