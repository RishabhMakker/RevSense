# RevSense 🔧

**Hear what your car is telling you.**

RevSense is an AI-powered car-sound triage assistant. Record the noise your
car is making (or upload a clip), describe the symptom in plain language, tag
when it happens, and get a ranked, safety-aware triage report: likely causes
with confidence and evidence, what to check first, whether it's safe to keep
driving, and a word-for-word script for your mechanic.

It is deliberately **not** a "magic AI mechanic": a transparent rule-based
diagnostic engine does the ranking, real (but basic) acoustic analysis runs in
your browser, and an optional LLM layer deepens the explanation when an API
key is configured. With no key at all, the app is fully functional.

## Screenshots

> _Placeholder — run the app locally and capture:_
> - Landing page hero (`/`)
> - Diagnostic wizard (`/diagnose`)
> - Triage report after running the demo scenario (`/diagnose?demo=1`)

## Features

- 🎙️ **Browser audio capture** — MediaRecorder with voice-processing disabled
  (echo cancellation/noise suppression would eat the mechanical sounds), live
  waveform, playback, and file upload as an alternative
- 📊 **Real acoustic analysis, on-device** — FFT-based feature extraction in
  the browser (RMS, peak, crest factor, spectral centroid, spectral flatness,
  band energy, pulse-rate detection). Only ~15 numbers are sent to the server;
  raw audio never leaves the device
- 🧠 **Transparent diagnostic engine** — 29 curated failure patterns across
  brakes, steering, suspension, engine, belts, exhaust, cooling, drivetrain,
  electrical, and wheels/tires, scored against sound words, key phrases,
  driving context, vehicle age/mileage, engine type, and audio hints
- 🔢 **Honest confidence** — a saturating confidence curve capped at 88%, with
  per-cause evidence bullets explaining *why* it ranked
- 🚨 **Safety red flags** — brake grinding, engine knock, smoke, burning
  smells, overheating, oil-pressure warnings, wheel wobble, steering concerns,
  and heavy leaks trigger explicit stop-driving alerts that the AI layer can
  never soften
- ✨ **Optional AI enhancement** — add an Anthropic (or OpenAI) key and the
  LLM rewrites the explanation for your specific case; the engine's safety
  verdict always wins
- 🧾 **Mechanic-ready output** — "what to check first", repair direction and
  difficulty, urgency, and a copyable first-person script for the shop
- 🔒 **Nothing stored** — no database, no accounts, no persistence

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js 16 + TypeScript + Tailwind CSS v4 + Framer Motion | Vercel-native, fast to polish |
| API | Next.js route handlers (`/api/diagnose`, `/api/demo`, `/api/status`) | Serverless on Vercel free tier — no separate server to host |
| Backend logic | `@revsense/backend` — a pure-TypeScript npm workspace package | Real frontend/backend separation without breaking Vercel deploys |
| Validation | Zod | Shared request schema between client and server |
| AI | `@anthropic-ai/sdk` (primary) + fetch-based OpenAI provider | Structured outputs; graceful fallback |
| Audio | Web Audio API + hand-rolled radix-2 FFT | No heavyweight DSP deps |
| Tests | Vitest (25 tests on the diagnostic engine) | Engine behavior is pinned |

**Architecture note:** the brief asked for separate `/frontend` and `/backend`
folders *and* easy Vercel deployment. A standalone backend server would
require a second host, so the backend is a **workspace package of pure
TypeScript modules** (schemas, knowledge base, scoring engine, AI providers)
imported by thin Next.js API routes. You get clean separation, one deploy,
and the backend stays independently testable (`npm test`).

## How it works

1. **Audio (optional)** — the browser decodes your clip and computes duration,
   RMS/peak (dBFS), crest factor, spectral centroid/flatness, band-energy
   split, zero-crossing rate, and an energy-envelope pulse detector. These map
   to coarse, honest hints like "rhythmic ticking ~4×/sec" or "high-pitched
   tonal whine".
2. **Scoring** — every knowledge-base issue accumulates weighted points:
   canonical sound-word matches (clicking/grinding/squealing/… via a synonym
   lexicon), strong/supporting phrases, strong/weak context matches, audio
   hints, wear boosts (mileage/age), and a commonness prior. EV/diesel
   awareness excludes or damps combustion-only causes.
3. **Verdict** — red-flag detection runs over the raw text and contexts; the
   overall severity/urgency/safe-to-drive verdict is computed conservatively
   from the top-ranked causes and any red flags.
4. **AI layer (optional)** — the heuristic result plus the user's report goes
   to Claude with a JSON schema (structured outputs). The model may rewrite
   explanations and evidence, but it can only discuss causes the engine
   ranked, and it cannot relax the safety verdict. Any failure (no key,
   timeout, bad output) silently falls back to the heuristic result.

## Getting started

```bash
# Node 20+ required
npm install        # installs both workspaces
npm run dev        # → http://localhost:3000
```

Then open **http://localhost:3000/diagnose?demo=1** and hit **Run diagnosis**
for the instant demo, or walk through the wizard with your own input.

Other commands:

```bash
npm test           # 25 engine tests (vitest)
npm run typecheck  # backend + frontend
npm run lint       # eslint
npm run build      # production build
```

### Demo scenario (the clicking-while-turning case)

Visit `/diagnose?demo=1` (or press the **Demo** chip in the wizard). It
prefills: *2014 Honda Civic, 128k miles, "clicking or popping sound when
turning the steering wheel at low speed…"*, contexts low-speed turning +
turning right + accelerating, plus simulated audio features showing rhythmic
4.2 Hz transients. Expected result: **Worn CV joint / axle (~72%)** on top,
with steering column/intermediate shaft and strut mount as runners-up, a
"drive gently, get it checked soon" verdict, and a complete mechanic script.

You can also verify the API without the UI — see [`samples/`](samples/README.md).

## Environment variables

All optional. **The app runs fully without any of them** (heuristic mode).

| Variable | Effect |
|---|---|
| `ANTHROPIC_API_KEY` | Enables Claude-powered explanations (recommended) |
| `OPENAI_API_KEY` | Alternative provider |
| `AI_PROVIDER` | Force `anthropic` \| `openai` \| `none` (default: auto-detect, Anthropic preferred) |
| `AI_MODEL` | Model override (defaults: `claude-opus-4-8` / `gpt-4o-mini`) |

Locally: `cp frontend/.env.example frontend/.env.local` and uncomment what you
need. The `/api/status` endpoint (and the scanning animation) reflect whether
AI mode is active.

## Deploying to Vercel (free tier)

1. Push this repo to GitHub.
2. In Vercel: **Add New → Project**, import the repo.
3. Set **Root Directory** to `frontend`. Vercel detects the npm workspace and
   includes the `backend/` package automatically (`outputFileTracingRoot` is
   already configured).
4. Framework preset: Next.js (auto). No other settings needed.
5. (Optional) Add `ANTHROPIC_API_KEY` under Project → Settings → Environment
   Variables to enable AI mode. Without it the app deploys in heuristic mode.
6. Deploy.

## Limitations

- **Triage, not diagnosis** — the engine ranks plausible causes from
  descriptions; it cannot inspect the vehicle.
- Audio analysis provides **coarse acoustic clues**, not trained-model
  classification. A quiet phone recording of a moving car may yield few hints.
- The knowledge base covers 29 common issues — uncommon failures won't be
  matched and rankings degrade gracefully toward low confidence.
- The engine doesn't know drivetrain layout (FWD/RWD), so e.g. a U-joint
  cause may appear for a front-wheel-drive car.
- Microphone capture requires HTTPS (or localhost) and user permission; iOS
  Safari records in formats the analyzer handles via `decodeAudioData`, but
  very old browsers may not support `MediaRecorder`.
- English-language symptom matching only.

## Safety disclaimer

RevSense is **not a certified mechanic** and cannot guarantee the cause of a
sound. If you experience braking or steering problems, smoke, burning smells,
overheating, an oil-pressure warning, severe knocking, or wheel wobble: stop
driving and have the vehicle professionally inspected. The app detects these
patterns and says so explicitly, but it can't catch every dangerous
condition.

## Roadmap

- Drivetrain-layout awareness (FWD/RWD/AWD) to prune impossible causes
- Spectrogram visualization and richer periodicity analysis (autocorrelation)
- Multi-language symptom lexicons
- Share/export a triage report as PDF
- Feedback loop ("which cause did the shop confirm?") to tune weights
- Streaming AI responses for faster perceived latency
