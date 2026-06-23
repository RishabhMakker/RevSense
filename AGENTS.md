# Agent guide — RevSense

Conventions for any AI coding agent (Claude Code, Cursor, Copilot, etc.) in this repo.
See `CLAUDE.md` for architecture and commands.

## UI copy & voice (applies to every user-facing string)

RevSense is a **car diagnostic / analysis tool** where a recording is **one input, not the
headline**. Voice: **Trustworthy · Clear · Practical** — a knowledgeable friend who knows cars.
Plain language, honest confidence, no overclaiming, no buzzwords.

**Never put in user-facing copy** (frontend *or* backend-generated strings like the disclaimer
and cause reasons):

- AI provider names (OpenRouter / Anthropic / OpenAI), "API key" → say "AI", or nothing.
- Engine internals: pattern/issue counts ("29 known failure patterns"), "10 vehicle systems",
  "rule engine", "transparent rule-based engine", "model", "ML".
- DSP jargon: FFT, spectral centroid, crest factor, pulse rate, band energy, "acoustic clues".
- Over-technical privacy ("on-device", "never leaves your phone", "no database"). Use one line:
  **"We don't save your recordings or results."**

**Terminology:** "diagnosis" / "your report" (not "triage report"), "likely causes",
"what to tell your mechanic", "recording" (audio is optional). Active voice; say it once.

This refines PRODUCT.md principle 4 ("show the engine, not the AI"): keep the structured,
non-chatbot feel, but **do not brag about engine internals** in copy.

## Visual system

Matte solid surfaces are the default: `.glass` / `.glass-strong` are flat (no backdrop-blur).
Gradient text is retired — use a solid colour (e.g. `text-amber-400`) for emphasis. The only two
deliberate exceptions are the `.glass-float` hero preview card (a genuinely floating layer) and
the logo wordmark gradient (pending a separate brand pass). **Do not reintroduce gradient text or
glassmorphism as a default** — they read as AI-generated. Amber-on-near-black "tachometer" palette
stays. Every animation needs a `prefers-reduced-motion` fallback (see globals.css + MotionProvider).
