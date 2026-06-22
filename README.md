# RevSense

Record the noise your car is making, describe the symptom, and get back a
ranked list of likely causes — how confident the tool is in each, what to
check first, whether it's safe to keep driving, and a short script to take to
your mechanic.

The ranking comes from a rule-based diagnostic engine, not a black-box model:
every cause is scored from inputs you can inspect. Acoustic analysis runs in
the browser, and an LLM layer reads your free-text description and writes the
final explanations on top of the engine's results.

## What it does

- Captures audio in the browser — live waveform, playback, or file upload.
- Extracts acoustic features on-device with an FFT. Only the ~15 resulting
  numbers go to the server; the raw recording never leaves your machine.
- Scores 29 known failure patterns against the sound, your description,
  driving context, and vehicle details.
- Flags stop-driving hazards as explicit safety alerts: brake grinding,
  engine knock, smoke, overheating, wheel wobble, and more.
- Runs the input through an LLM to interpret messy descriptions and rewrite
  the explanations. It can only discuss causes the engine ranked, and it can
  never override the safety verdict.
- Stores nothing — no database, no accounts, no persistence.

## Quick start

```bash
# Node 20+
npm install
npm run dev   # http://localhost:3000
```

Open http://localhost:3000/diagnose?demo=1 and hit **Run diagnosis** for a
demo, or walk through the wizard with your own recording.

To turn on the LLM layer, set an API key (`OPENROUTER_API_KEY`,
`ANTHROPIC_API_KEY`, or `OPENAI_API_KEY`). Without one, the engine still runs
and returns results on its own. See [INSTRUCTIONS.md](INSTRUCTIONS.md) for
setup, troubleshooting, and backend verification.

## How it works

1. **Audio.** The browser measures loudness, spectral shape, and a pulse
   rate, then maps them to coarse hints like "rhythmic ticking ~4×/sec".
2. **Interpretation.** The LLM translates your description into the engine's
   vocabulary so the ranking can use it.
3. **Scoring.** Each known issue collects weighted points from sound words,
   key phrases, driving context, and vehicle age and mileage. Confidence is
   capped at 88% — the tool never claims certainty.
4. **Verdict.** Red-flag detection runs over the text, and the safe-to-drive
   verdict is computed conservatively from the top causes.
5. **Explanation.** The LLM rewrites the results for your case. It's limited
   to the ranked causes and can't relax the safety verdict; if the call
   fails, the engine's own output is returned.

## Tech stack

Next.js 16, TypeScript, Tailwind v4, and Framer Motion, with the API built as
Next.js route handlers. Domain logic lives in `@revsense/backend`, a
pure-TypeScript workspace package (zod schemas, knowledge base, scoring
engine, AI providers) that the route handlers import — front and back stay
separate while shipping as a single deploy. Audio uses the Web Audio API with
a hand-written FFT. The engine is covered by 25 Vitest tests.

## Limitations & safety

This is triage, not diagnosis. It ranks plausible causes from a description
and can't inspect the car. The audio analysis gives rough clues, not
trained-model classification, and symptom matching is English-only.

RevSense is not a mechanic. If you have braking or steering problems, smoke,
burning smells, overheating, an oil-pressure warning, severe knocking, or
wheel wobble: stop driving and have the car professionally inspected.
