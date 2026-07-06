import type { KnownIssue } from "./types";

export const BRAKES_ISSUES: KnownIssue[] = [
  {
    id: "brake-pads-worn",
    title: "Worn brake pads (wear indicator squeal)",
    category: "brakes",
    description:
      "Most brake pads include a small steel tab that intentionally squeals against the rotor when the friction material is nearly used up. A high-pitched squeal when braking — sometimes fading when you press harder — usually means the pads are due.",
    sounds: ["squeal", "chirp"],
    strongPhrases: ["brake", "braking", "stop", "pedal"],
    supportingPhrases: ["high pitch", "front", "rear", "slow"],
    negativePhrases: [
      "not when braking",
      "not while braking",
      "not the brakes",
      "not think it is the brakes",
      "not think it's the brakes",
      "brakes are fine",
      "brakes feel fine",
      "brakes seem fine",
    ],
    contexts: { strong: ["braking"], weak: ["low_speed"], exclude: ["idle"] },
    audioHints: ["high_pitched", "tonal_whine"],
    wear: { mileageFrom: 30_000 },
    baseRate: 0.9,
    severity: "moderate",
    urgency: "prompt",
    safeToDrive: "caution",
    checksFirst: [
      "Look through the wheel spokes at the brake pad — less than ~3 mm of friction material means replacement time.",
      "Note whether the squeal appears when braking and changes with pedal pressure.",
      "Check whether it squeals lightly even when not braking (the indicator can drag constantly).",
    ],
    confirmRuleOut: [
      "Visual pad inspection settles it in minutes.",
      "If the noise is a grind rather than a squeal, assume metal-on-metal and stop driving — that's a different, urgent condition.",
    ],
    repairDirection:
      "Replace brake pads, and rotors if scored. One of the most routine repairs a shop does.",
    repairDifficulty: "diy-moderate",
    mechanicSummary:
      "High-pitched squeal on braking consistent with pad wear indicators. Please measure pad thickness all around and check rotor condition.",
  },
  {
    id: "brake-metal-grinding",
    title: "Brake pads worn to metal (grinding)",
    category: "brakes",
    description:
      "A harsh metallic grinding when braking usually means the pad friction material is gone and the steel backing plate is digging into the rotor. Braking distance suffers and the rotors are being destroyed.",
    sounds: ["grind"],
    strongPhrases: ["brake", "braking", "stop", "pedal"],
    supportingPhrases: ["metal", "worse", "louder"],
    negativePhrases: [
      "not when braking",
      "not while braking",
      "not the brakes",
      "not think it is the brakes",
      "not think it's the brakes",
      "brakes are fine",
      "brakes feel fine",
      "brakes seem fine",
    ],
    contexts: { strong: ["braking"], weak: [], exclude: ["idle"] },
    audioHints: ["broadband_hiss", "loud_recording"],
    baseRate: 0.6,
    severity: "critical",
    urgency: "immediate",
    safeToDrive: "no",
    checksFirst: [
      "Stop driving and inspect the pads through the wheel — if you see shiny grooved rotor and no pad material, it's metal-on-metal.",
      "Check the rotor face for deep scoring.",
      "Notice if the car pulls to one side when braking.",
    ],
    confirmRuleOut: [
      "Grinding only while braking is near-diagnostic for metal-on-metal pads.",
      "Grinding that continues when not braking points to a stuck caliper or a failing wheel bearing instead.",
    ],
    repairDirection:
      "Replace pads and almost certainly rotors; inspect calipers for heat damage. Do this before driving further.",
    repairDifficulty: "pro",
    mechanicSummary:
      "Grinding under braking, suspected metal-on-metal. Please inspect pads, rotors, and calipers urgently; vehicle advised not to drive.",
  },
  {
    id: "warped-rotors",
    title: "Warped / unevenly worn brake rotors",
    category: "brakes",
    description:
      "Rotors with uneven thickness make the brake pedal and steering wheel pulse or shudder during braking, most noticeably from highway speed. You may hear a rhythmic rubbing rather than a constant noise.",
    sounds: ["vibration", "rumble"],
    strongPhrases: ["brake", "pedal puls", "shudder", "steering wheel shake"],
    supportingPhrases: ["highway", "downhill", "vibrat", "rhythm"],
    contexts: { strong: ["braking"], weak: ["highway_speed"] },
    signals: { speed: "tracks_road_speed" },
    audioHints: ["rhythmic_ticking", "low_rumble"],
    wear: { mileageFrom: 40_000 },
    baseRate: 0.6,
    severity: "moderate",
    urgency: "soon",
    safeToDrive: "caution",
    checksFirst: [
      "Brake gently from ~60 mph (where safe) and feel for pulsing in the pedal or wheel.",
      "Check for blue heat discoloration or visible ridges on the rotor face.",
      "Note if the shudder is steering-wheel-centric (front rotors) or seat-centric (rear).",
    ],
    confirmRuleOut: [
      "Pulsation only under braking is the key signature; constant vibration points elsewhere (wheels, tires, driveline).",
      "A shop can measure rotor thickness variation to confirm.",
    ],
    repairDirection:
      "Machine or replace rotors and install fresh pads; check caliper slides while in there.",
    repairDifficulty: "pro",
    mechanicSummary:
      "Brake-applied pulsation/shudder. Please measure rotor runout and thickness variation; resurface or replace as needed.",
  },
  {
    id: "stuck-caliper",
    title: "Sticking brake caliper",
    category: "brakes",
    description:
      "A caliper that doesn't fully release drags the pad against the rotor constantly. Signs include grinding or rubbing while cruising, the car pulling to one side, a burning smell, and one wheel much hotter than the others.",
    sounds: ["grind", "squeal", "hiss"],
    strongPhrases: ["burning", "smell", "pull", "one side", "hot wheel", "smoke"],
    supportingPhrases: ["drag", "rubbing", "constant", "brake"],
    contexts: {
      strong: ["braking"],
      weak: ["highway_speed", "idle", "low_speed"],
    },
    signals: { speed: "tracks_road_speed" },
    audioHints: ["broadband_hiss"],
    wear: { ageFrom: 10 },
    baseRate: 0.4,
    severity: "high",
    // A *suspected* sticking caliper is drive-with-caution; the burning-smell
    // and smoke red flags escalate to stop-driving when that evidence exists.
    urgency: "prompt",
    safeToDrive: "caution",
    checksFirst: [
      "After a short drive, carefully feel (don't touch the metal!) for heat radiating from one wheel versus the others.",
      "Watch for the car pulling to one side at steady speed without braking.",
      "Look for smoke or a hot brake smell near one wheel.",
    ],
    confirmRuleOut: [
      "One dramatically hotter wheel after gentle driving is a strong confirmation.",
      "If all wheels run cool and there's no pull, the caliper is likely fine.",
    ],
    repairDirection:
      "Replace or rebuild the seized caliper, plus the pads/rotor on that corner if heat-damaged. A dragging brake can overheat and fade badly — treat as urgent.",
    repairDifficulty: "pro",
    mechanicSummary:
      "Suspected dragging caliper: one-side pull, heat, and rubbing noise. Please check caliper slides/pistons and hose condition on the hot corner.",
  },
  {
    id: "abs-selftest-buzz",
    title: "ABS self-test buzz (normal)",
    category: "brakes",
    description:
      "Many cars run a brief ABS pump self-test the first time you roll off after starting — a one-second buzz or groan from under the hood or floor around 5\u201315 mph. It is normal and happens once per drive.",
    sounds: ["hum", "groan", "rattle", "vibration"],
    strongPhrases: ["once per drive", "first time i pull away", "right after i start driving", "every morning when i first", "abs"],
    supportingPhrases: ["brief", "buzz", "low speed", "once"],
    contexts: { strong: ["low_speed"], weak: ["cold_start", "braking"] },
    signals: { onset: "sudden", locations: ["front", "under_car"] },
    audioHints: ["low_rumble"],
    baseRate: 0.35,
    severity: "low",
    urgency: "monitor",
    safeToDrive: "yes",
    checksFirst: [
      "Confirm the pattern: one short buzz at low speed shortly after each start, then silence for the rest of the drive.",
      "Confirm no ABS or brake warning lights are on.",
    ],
    confirmRuleOut: [
      "A once-per-drive low-speed buzz with no warning lights is the ABS self-test — normal.",
      "A groan or buzz during actual braking, or with an ABS light, needs a real brake inspection.",
    ],
    repairDirection:
      "None — normal self-check behavior. Only investigate if warning lights appear.",
    repairDifficulty: "diy-easy",
    mechanicSummary:
      "Single low-speed buzz after startup consistent with the ABS pump self-test; no fault indicated.",
  },
  {
    id: "brake-booster-hiss",
    title: "Brake booster / vacuum hose hiss",
    category: "brakes",
    description:
      "A hiss from behind the pedal when you press or hold the brake — sometimes with a slightly harder pedal — points at the brake booster diaphragm or its vacuum hose leaking.",
    sounds: ["hiss"],
    strongPhrases: ["when i press the brake pedal", "behind the pedal", "hiss when braking", "hold the brake", "booster"],
    supportingPhrases: ["pedal", "harder", "vacuum", "cabin"],
    contexts: { strong: ["braking", "idle"], weak: [] },
    signals: { locations: ["in_cabin"] },
    audioHints: ["broadband_hiss"],
    notFor: ["electric"],
    wear: { ageFrom: 10 },
    baseRate: 0.3,
    severity: "moderate",
    urgency: "prompt",
    safeToDrive: "caution",
    checksFirst: [
      "With the engine idling, press and hold the brake — a continuous hiss from behind the pedal is the tell.",
      "Notice whether the pedal has gotten harder to press or the idle changes when braking.",
      "A small hiss that stops after a second of pedal travel can be normal booster breathing; continuous is not.",
    ],
    confirmRuleOut: [
      "A continuous hiss while holding the pedal, or a stiff pedal, confirms a booster/hose leak.",
      "If the hiss is in the engine bay and unrelated to the pedal, run the vacuum-leak checks instead.",
    ],
    repairDirection:
      "Replace the leaking hose or booster promptly — power assist matters for safe stops.",
    repairDifficulty: "pro",
    mechanicSummary:
      "Pedal-correlated hiss with possible hard pedal. Please test brake booster hold and its vacuum supply.",
  },
  {
    id: "regen-braking-groan",
    title: "Regenerative braking groan (often normal)",
    category: "brakes",
    description:
      "EVs and hybrids often groan, whir, or hum softly when slowing as the motor regenerates and the friction brakes blend in — especially at low speed right before a stop. Usually normal; changes in loudness are what deserve attention.",
    sounds: ["groan", "hum", "whine"],
    strongPhrases: ["when slowing down", "when regen", "as i come to a stop", "letting off in an ev"],
    supportingPhrases: ["electric", "hybrid", "regen", "brake"],
    contexts: { strong: ["braking", "low_speed"], weak: [] },
    signals: { load: "worse_coasting" },
    audioHints: ["low_rumble", "tonal_whine"],
    notFor: ["gasoline", "diesel"],
    baseRate: 0.4,
    severity: "low",
    urgency: "monitor",
    safeToDrive: "yes",
    checksFirst: [
      "Notice whether the groan happens mainly during gentle slowing and blends away at a standstill — that's regen blending.",
      "Compare with how the car has always sounded; a NEW grind or squeal is different from the familiar groan.",
      "Check that braking feel and distance are unchanged.",
    ],
    confirmRuleOut: [
      "A soft, consistent groan during regen on an EV/hybrid is normal blending behavior.",
      "Any metallic grinding, or a groan that appeared suddenly with worse braking, needs a friction-brake inspection — rust builds on lightly-used EV rotors.",
    ],
    repairDirection:
      "Usually none. If it turned metallic or louder, have the lightly-used friction brakes cleaned and inspected.",
    repairDifficulty: "diy-easy",
    mechanicSummary:
      "Low-speed groan during regenerative slowing, likely normal blending; please rule out surface-rusted rotors if it turned metallic.",
  },
];
