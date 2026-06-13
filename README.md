# RevSense 🔧

**Hear what your car is telling you.**

RevSense is a car-sound triage assistant. Record the noise your car is making
(or upload a clip), describe the symptom in plain language, tag when it
happens, and get a ranked, safety-aware report: likely causes with confidence
and evidence, what to check first, whether it's safe to keep driving, and a
script for your mechanic.

The ranking is done by a **transparent rule-based diagnostic engine** — not a
black-box model. Basic acoustic analysis runs in your browser, and an
**optional** LLM layer deepens the explanation when an API key is configured.
With no key, the app is fully functional.

## Features

- 🎙️ **Browser audio capture** — live waveform, playback, or file upload
- 📊 **On-device acoustic analysis** — FFT-based feature extraction; only ~15
  numbers are sent to the server, raw audio never leaves your device
- 🧠 **Transparent diagnostic engine** — 29 curated failure patterns scored
  against your description, driving context, and vehicle details
- 🚨 **Safety red flags** — brake grinding, engine knock, smoke, overheating,
  wheel wobble and more trigger explicit stop-driving alerts
- ✨ **Optional AI explanations** — add an Anthropic or OpenAI key and the LLM
  rewrites the result for your case; the engine's safety verdict always wins
- 🔒 **Nothing stored** — no database, no accounts, no persistence

## Quick start

```bash
# Node 20+ required
npm install        # installs both workspaces
npm run dev        # → http://localhost:3000
```

Then open **http://localhost:3000/diagnose?demo=1** and hit **Run diagnosis**
for an instant demo, or walk through the wizard with your own input.

👉 See **[INSTRUCTIONS.md](INSTRUCTIONS.md)** for a full step-by-step guide
(prerequisites, optional AI setup, troubleshooting, backend verification).

## How it works

1. **Audio (optional)** — the browser computes loudness, spectral shape, and a
   pulse detector, mapped to coarse hints like "rhythmic ticking ~4×/sec".
2. **Scoring** — every known issue accumulates weighted points from sound
   words, key phrases, driving context, and vehicle age/mileage. Confidence is
   capped at 88% — deliberately never certain.
3. **Verdict** — red-flag detection runs over the text; the overall
   safe-to-drive verdict is computed conservatively from the top causes.
4. **AI layer (optional)** — the result goes to Claude/OpenAI to rewrite
   explanations. The model can only discuss causes the engine ranked and can
   never relax the safety verdict; any failure falls back to the engine.

## Tech stack

Next.js 16 + TypeScript + Tailwind v4 + Framer Motion, with the API as Next.js
route handlers. Domain logic lives in `@revsense/backend`, a pure-TypeScript
workspace package (zod schemas, knowledge base, scoring engine, AI providers)
imported by thin API routes — clean front/back separation in a single Vercel
deploy. Audio uses the Web Audio API + a hand-rolled FFT. Tested with Vitest
(25 engine tests).

## Optional AI configuration

All optional — **the app runs fully without any key** (heuristic mode).

| Variable | Effect |
|---|---|
| `ANTHROPIC_API_KEY` | Enables Claude-powered explanations |
| `OPENAI_API_KEY` | Alternative provider |
| `OPENROUTER_API_KEY` | Free option — use a [`:free` model](https://openrouter.ai/models?q=free) via [OpenRouter](https://openrouter.ai) |
| `AI_PROVIDER` | Force `anthropic` \| `openai` \| `openrouter` \| `none` (default: auto-detect) |
| `AI_MODEL` | Model override |

Locally: `cp frontend/.env.example frontend/.env.local` and uncomment what you
need. The `/api/status` endpoint reflects whether AI mode is active.

## Deploying to Vercel (free tier)

1. Push to GitHub and import the repo in Vercel (**Add New → Project**).
2. Set **Root Directory** to `frontend` — Vercel detects the workspace and
   bundles `backend/` automatically.
3. Framework preset: Next.js (auto). Deploy.
4. (Optional) Add `ANTHROPIC_API_KEY` under Settings → Environment Variables
   to enable AI mode.

## Limitations & safety

This is **triage, not diagnosis** — it ranks plausible causes from a
description and can't inspect the vehicle. Audio analysis gives coarse clues,
not trained-model classification. Symptom matching is English-only.

RevSense is **not a certified mechanic**. If you experience braking or steering
problems, smoke, burning smells, overheating, an oil-pressure warning, severe
knocking, or wheel wobble: stop driving and have the vehicle professionally
inspected.
