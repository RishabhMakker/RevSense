# Product

## Register

product

## Users

Car owners who hear a strange noise and don't know what it means. Non-experts — not mechanics, not enthusiasts. They're often anxious (is this safe to drive?), short on time, and want a clear answer, not a rabbit hole. Primary context: at home after noticing a sound, or parked somewhere wondering if they can keep driving.

## Product Purpose

RevSense triages car noises into ranked, safety-aware diagnostic reports. It does not claim to replace a mechanic — it tells you what's likely wrong, how confident to be, whether it's safe to drive, and exactly what to say when you call the shop. The transparent rule-based engine (not a black-box model) is the core value; the optional LLM layer deepens explanations but never overrules the safety verdict.

## Brand Personality

Trustworthy · Clear · Practical

The tone is that of a knowledgeable friend who happens to know cars — not a detached AI, not a gruff mechanic, not an anxious warning label. Calm authority. Plain language. No hedging, but also no overclaiming.

## Anti-references

- **Generic SaaS / startup landing pages** — white-card layouts, blue CTA buttons, hero-metric grids, "AI-powered" badge everywhere. RevSense should look like a precision tool, not a funding pitch.
- **AI chatbot / assistant UIs** — conversational bubbles, typing indicators, "Ask me anything" energy. RevSense has a structured workflow with a real engine behind it; that structure should be visible and reassuring.
- **OBD2 / legacy mechanic shop software** — dense data tables, tiny fonts, visual clutter, no hierarchy. The opposite failure mode: technically intimidating when the user needs clarity.

## Design Principles

1. **Safety verdict is inescapable.** The stop-driving verdict is the most important thing RevSense can say. It must be visually dominant — not buried in a card, not the same weight as the rest. Severity hierarchy should be self-evident before reading.

2. **Triage honesty, not false precision.** Confidence caps at 88% by design. The UI should reinforce this — present ranked possibilities, not certainties. Avoid progress bars that look like accuracy meters. Use "likely" not "definitely."

3. **Expert confidence, plain language.** The engine is sophisticated; the output must be legible to someone who doesn't know what a CV joint is. Every label, heading, and explanation should pass a "non-car-person" test.

4. **Show the engine, not the AI.** The transparent rule-based engine is the differentiator. The optional LLM should feel like a polish layer, not the product itself. The ranked causes, mechanic script, and safety verdict should feel like structured expert output — not a chatbot answer.

5. **One job per screen.** The wizard has discrete steps (audio → vehicle → symptom → review). Each step owns exactly one decision. No visual competition between steps, no forward-looking complexity bleeding in.

## Accessibility & Inclusion

WCAG 2.1 AA minimum. Color must not be the sole signal for severity — pair color with icon and label. Safety-critical alerts (stop-driving) must be announced to screen readers. Reduced-motion alternative required for all animations (the animated equalizer, pulse rings, scanning overlay).
