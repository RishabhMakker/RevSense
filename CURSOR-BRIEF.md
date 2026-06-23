# Cursor task brief — RevSense landing-page copy revamp

> **How to use this file:** In Cursor, point the agent at this file —
> *"Read `CURSOR-BRIEF.md` and implement it exactly."* This brief is self-contained; you do not
> need any outside context. A separate work-stream is editing the app/diagnose files in parallel —
> **do not touch their files** (the DO-NOT-TOUCH list below is strict).
> You can delete this file once the work is merged.

## Your role

You are a senior frontend engineer doing a **copy & content revamp** of the RevSense **landing /
marketing page only**. This is **not a redesign** — keep the existing visual system exactly as-is
(dark "ink" background, glass surfaces `.glass` / `.glass-strong`, amber→orange gradient accents,
the `.text-gradient` wordmark, Framer Motion entrances, `lucide-react` icons). Do not add or
remove design tokens, fonts, colors, or layout structure beyond what's specified.

## The project

RevSense is a car-diagnostic web app. Repo root: `car-diagnostic-app/` (this folder). It's an
npm-workspaces monorepo: `frontend/` is Next.js 16 (App Router, Turbopack) + TypeScript +
Tailwind v4 + Framer Motion; `backend/` is a pure-TS package imported as `@revsense/backend`.

Run from the repo root:
```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # must stay green
npm run lint     # must stay green
```

## Why this change

The site currently reads like a tech demo: it brags about engine internals ("29 known failure
patterns", "10 vehicle systems", "rule engine", FFT/DSP jargon), names the AI provider, and
frames the whole product around *recording a sound*. Reposition it as a **car diagnostic /
analysis tool** where a recording is just **one** input, and strip every piece of
developer/AI-implementation language.

## Positioning & voice (apply to every word you write)

- **What RevSense is, in one line:** "Describe what your car is doing, add a recording if you have
  one, and get a ranked, safety-aware list of likely causes — plus what to check and exactly what
  to tell your mechanic." **Sound is one signal, not the headline.**
- **Voice:** Trustworthy · Clear · Practical — a knowledgeable friend who knows cars. Plain
  language, honest confidence, no overclaiming, no buzzwords.
- **Never write** in user-facing copy: provider names ("OpenRouter" / "Anthropic" / "OpenAI"),
  "API key", "29" or "known failure patterns", "10 vehicle systems", "rule engine",
  "transparent rule-based engine", "FFT", "spectral centroid", "crest factor", "model", "ML",
  "on-device", "never leaves your phone", "no database", "browser tab".
- **Privacy** is expressed with exactly one simple line where needed:
  **"We don't save your recordings or results."**
- **Terminology:** use "diagnosis" / "your report" (not "triage report"), "likely causes",
  "what to tell your mechanic", "recording".

## Files you MAY edit (and ONLY these)

```
frontend/components/landing/Hero.tsx
frontend/components/landing/Sections.tsx     (HowItWorks, Features, DemoCallout, SafetySection)
frontend/components/Navbar.tsx
frontend/components/Footer.tsx
frontend/app/layout.tsx                      (root metadata only)
frontend/app/page.tsx                        (only if you reorder/remove a whole section)
```

## DO NOT TOUCH (another work-stream owns these — editing causes merge conflicts)

```
frontend/app/globals.css
frontend/components/Logo.tsx
frontend/components/diagnose/**     (entire folder)
frontend/components/results/**      (entire folder)
frontend/components/audio/**        (entire folder)
frontend/app/diagnose/**            (entire folder)
frontend/lib/**
backend/**
```

## Process (do this for each file)

1. **Open and read the whole file first** so you preserve the existing JSX/structure and only
   change the copy/icons specified.
2. Apply the exact before → after changes below.
3. Fix imports: remove `KNOWN_ISSUE_COUNT` and any now-unused `lucide-react` icons; add any new
   icons you reference. (`KNOWN_ISSUE_COUNT` comes from `@revsense/backend`.)
4. Keep all `className`, animation, and layout code intact.

---

## Exact changes

### 1. `frontend/app/layout.tsx` — metadata only

- **title** — replace `"RevSense — Hear what your car is telling you"`
  → `"RevSense — Understand what your car is telling you"`
- **description** — replace the current value (starts `"Record the noise your car is making…"`)
  → `"Describe what your car is doing, add a recording if you have one, and get a ranked, safety-aware list of likely causes — plus what to check and exactly what to tell your mechanic."`

### 2. `frontend/components/landing/Hero.tsx`

- **Badge pill.** Current:
  ```tsx
  <div className="glass mb-7 flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-amber-200/90">
    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
    {KNOWN_ISSUE_COUNT} failure patterns · 10 vehicle systems
  </div>
  ```
  Change to use the **`ShieldCheck`** icon (already imported in this file) and the text
  **`Ranked causes · Safety-first · Mechanic-ready`**. Remove the now-unused `Sparkles` import
  and the `KNOWN_ISSUE_COUNT` import (line `import { KNOWN_ISSUE_COUNT } from "@revsense/backend";`).
- **H1.** Change only the first word: `Hear what your car is` → `Understand what your car is`
  (keep the `<span className="text-gradient">telling you</span>` exactly).
- **Sub-paragraph.** Replace:
  > "Record the noise, describe when it happens, and RevSense triages the likely causes — ranked by confidence, flagged for safety, and translated into exactly what to tell your mechanic."

  with:
  > "Describe what's going on — and add a recording if you have one. RevSense ranks the likely causes, flags anything unsafe, and tells you exactly what to say at the shop."
- **Leave unchanged:** both CTAs ("Diagnose your car", "Try the demo scenario"), the animated
  equalizer, and the floating sample-verdict card (its copy is fine).

### 3. `frontend/components/landing/Sections.tsx`

This file exports `HowItWorks`, `Features`, `DemoCallout`, `SafetySection`. Remove the
`KNOWN_ISSUE_COUNT` import. Manage icon imports as you go (final icon set is listed at the end).

**3a. `HowItWorks`** — reorder so describing leads and recording is optional.
- Section heading: `"From mystery noise to action plan in a minute"`
  → `"From mystery problem to a clear plan in a minute"`.
- Replace the three `steps` with these, in this order (keep the `01 / 02 / 03` styling):
  - **01 · "Describe the problem"** — icon `ClipboardList` —
    `Tell us about your car and what it's doing, in plain language — "clicking when I turn at low speed" — and tag when it happens.`
  - **02 · "Add a recording (optional)"** — icon `Mic` —
    `Got the noise on your phone? Add a clip and RevSense factors it in. No clip? It works from your description alone. We don't save your recording.`
  - **03 · "Get a ranked diagnosis"** — icon `Stethoscope` —
    `RevSense ranks the likely causes, tells you what to check first, whether it's safe to drive, and exactly what to say at the shop.`

**3b. `Features`** —
- Section heading: `"A serious triage tool, not a magic 8-ball"` → `"A real diagnosis, not a guess"`.
- Subtitle: → `"Ranked possibilities with the reasons behind them — and honest confidence, never fake certainty."`
- Replace the six feature cards entirely (this **drops** the old "Real audio analysis"/FFT card
  and the "Optional AI explanations / add a key" card) with these six:
  - **"Ranked, not guessed"** — icon `Gauge` —
    `Every likely cause comes with a confidence level and the reasons it fits your car — so you see why, not just what.`
  - **"Safety comes first"** — icon `AlertTriangle` —
    `Grinding brakes, engine knock, smoke, overheating, a wobbling wheel — RevSense calls these out clearly and tells you when to stop driving.`
  - **"Mechanic-ready"** — icon `Wrench` —
    `A word-for-word script for the shop, what to check first, the likely repair, and how involved it is — so you walk in informed.`
  - **"Works from a recording too"** — icon `AudioWaveform` —
    `Add a clip of the noise and RevSense factors it into the ranking. Optional, never required.`
  - **"Clear, not clinical"** — icon `Stethoscope` —
    `Built for people who aren't mechanics. Plain language, honest confidence, no scary jargon.`
  - **"Private by default"** — icon `Lock` —
    `We don't save your recordings or results.`

**3c. `DemoCallout`** — keep it; change the one phrase
`watch the engine rank causes, surface evidence, and draft the mechanic script.`
→ `watch RevSense rank the causes, show its reasoning, and draft the mechanic script.`

**3d. `SafetySection`** — keep it; two edits:
- `It ranks possibilities from your description and basic acoustic clues — it cannot inspect your car`
  → `It ranks possibilities from what you describe (and a recording, if you add one) — it cannot inspect your car`
- `RevSense detects these patterns in your description and will tell you, plainly, when it thinks you should stop driving.`
  → `RevSense watches for these and will tell you, plainly, when to stop driving.`
- Leave the red-flag checklist (`Grinding while braking`, etc.) exactly as-is.

**Final `lucide-react` import set for Sections.tsx:** `AlertTriangle, AudioWaveform,
ClipboardList, Gauge, Lock, Mic, Stethoscope, Wrench`. Remove `BrainCircuit` and `Cpu`
(no longer used).

### 4. `frontend/components/Navbar.tsx`

No changes — the nav links and "Start diagnosis" CTA are still accurate. (Listed only so you
know it was reviewed.)

### 5. `frontend/components/Footer.tsx`

- Tagline paragraph. Replace:
  > "A smart triage assistant for car noises. RevSense combines your description, driving context, and basic acoustic clues with a rule-based diagnostic engine — plus optional AI explanations."

  with:
  > "A clear, safety-first way to figure out what your car is doing. Describe the problem, add a recording if you have one, and get a ranked diagnosis with a plan."
- In the **Trust** column, change the two static `<span>` lines:
  - `No data stored` → `We don't save your recordings`
  - `Audio stays on device` → `Private by default`
- Leave the bottom legal/disclaimer line as-is.

---

## Verify before you finish

1. `npm run dev`, open `http://localhost:3000`, read the page top to bottom: it should read as
   "understand / analyze what your car is doing", **not** "record a sound". Search the rendered
   page for any banned word (provider names, "29", "rule engine", "FFT", etc.) — there should be none.
2. Check a narrow (mobile ~375px) and wide viewport — existing responsive classes should hold;
   fix any heading overflow you introduce.
3. No console errors.
4. `npm run build` and `npm run lint` must be green.
5. Confirm `git status` shows changes **only** in the allowed files (section 1–5 above) and
   nothing in the DO-NOT-TOUCH list.
