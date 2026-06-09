import type { RedFlag, SoundContext } from "./schemas";
import type { SoundMatch } from "./lexicon";
import { matchPhrases } from "./lexicon";

interface RedFlagRule {
  id: string;
  label: string;
  message: string;
  stopDriving: boolean;
  test: (
    text: string,
    contexts: SoundContext[],
    sounds: SoundMatch[]
  ) => boolean;
}

const has = (text: string, phrases: string[]) =>
  matchPhrases(text, phrases).length > 0;

const RULES: RedFlagRule[] = [
  {
    id: "brake-grinding",
    label: "Grinding while braking",
    message:
      "Grinding during braking usually means the brake pads are worn to metal. Braking performance is compromised — have the brakes inspected before driving further.",
    stopDriving: true,
    test: (text, contexts, sounds) =>
      sounds.some((s) => s.type === "grind") &&
      (contexts.includes("braking") || has(text, ["brake", "braking", "stop", "pedal"])),
  },
  {
    id: "severe-knocking",
    label: "Engine knocking",
    message:
      "Loud or deep engine knocking can indicate internal engine damage in progress. Continuing to drive can turn a repair into a full engine replacement.",
    stopDriving: true,
    test: (text, contexts, sounds) =>
      sounds.some((s) => s.type === "knock") &&
      (has(text, ["loud", "deep", "heavy", "bad", "severe", "worse", "louder"]) ||
        contexts.includes("idle")),
  },
  {
    id: "smoke",
    label: "Smoke reported",
    message:
      "Any visible smoke means stop driving and investigate immediately. Smoke from the engine bay or wheels can precede a fire.",
    stopDriving: true,
    test: (text) => has(text, ["smoke", "smoking"]),
  },
  {
    id: "burning-smell",
    label: "Burning smell",
    message:
      "A burning smell (rubber, oil, or 'hot metal') points to overheating components — commonly a dragging brake, slipping belt, or leaking oil on the exhaust. Stop and investigate soon.",
    stopDriving: true,
    test: (text) => has(text, ["burning", "burnt", "burn smell"]),
  },
  {
    id: "overheating",
    label: "Possible overheating",
    message:
      "An overheating engine can be destroyed in minutes. If the temperature gauge climbs or steam appears, pull over safely and shut the engine off.",
    stopDriving: true,
    test: (text) =>
      has(text, ["overheat", "temperature gauge", "running hot", "steam", "coolant warning"]),
  },
  {
    id: "oil-pressure",
    label: "Oil pressure warning",
    message:
      "An oil-pressure warning light with engine noise is an emergency for the engine. Stop driving immediately — oil starvation destroys bearings fast.",
    stopDriving: true,
    test: (text) => has(text, ["oil light", "oil pressure", "oil warning"]),
  },
  {
    id: "wheel-wobble",
    label: "Wheel wobble / shaking",
    message:
      "A wobbling wheel or violent shaking can mean a loose wheel, tire failure, or broken suspension — all of which can cause loss of control. Check lug nuts and tires before driving at speed.",
    stopDriving: true,
    test: (text, contexts) =>
      has(text, ["wobbl", "violent shak", "shaking badly", "wheel feels loose", "lug"]) ||
      (has(text, ["shak", "vibrat"]) && contexts.includes("highway_speed") && has(text, ["worse", "bad", "scary", "violent"])),
  },
  {
    id: "steering-concern",
    label: "Steering responsiveness concern",
    message:
      "Anything that affects whether the car steers — looseness, binding, grinding through the wheel, or delayed response — is a stop-driving safety issue until inspected.",
    stopDriving: true,
    test: (text) =>
      has(text, [
        "steering feels loose",
        "hard to steer",
        "steering is hard",
        "won't turn",
        "doesn't respond",
        "lost steering",
        "steering went",
      ]),
  },
  {
    id: "power-loss",
    label: "Loss of power",
    message:
      "A noise accompanied by losing power can leave you stranded in traffic. Limit driving to what's needed to reach a safe place or a shop.",
    stopDriving: false,
    test: (text) =>
      has(text, ["loss of power", "lost power", "losing power", "won't accelerate", "no power"]),
  },
  {
    id: "heavy-fluid-leak",
    label: "Significant fluid leak",
    message:
      "A puddle or fast drip under the car means a system is losing fluid — brakes, coolant, oil, or transmission. Identify the fluid before driving far; brake fluid or heavy oil loss means stop.",
    stopDriving: false,
    test: (text) =>
      has(text, ["puddle", "pool of", "leaking a lot", "leaking heavily", "dripping fast", "gushing"]),
  },
];

export function detectRedFlags(
  normalizedText: string,
  contexts: SoundContext[],
  sounds: SoundMatch[]
): RedFlag[] {
  return RULES.filter((r) => r.test(normalizedText, contexts, sounds)).map(
    ({ id, label, message, stopDriving }) => ({ id, label, message, stopDriving })
  );
}
