import type { KnownIssue } from "./types";

export const ELECTRICAL_ISSUES: KnownIssue[] = [
  {
    id: "alternator-bearing-whine",
    title: "Alternator bearing whine",
    category: "electrical",
    description:
      "A high whine that rises and falls exactly with engine RPM — regardless of road speed or steering — often comes from the alternator's bearings or another accessory on the belt path. Sometimes it changes with electrical load (headlights, AC).",
    sounds: ["whine", "hum", "squeal"],
    strongPhrases: ["whine with rpm", "alternator", "louder when revving", "electrical"],
    supportingPhrases: ["headlights", "engine bay", "rev", "constant whine"],
    // An accessory whine tracks engine RPM, not road speed.
    negativePhrases: ["road speed", "with road speed"],
    contexts: { strong: ["idle", "acceleration"], weak: ["cold_start", "highway_speed"] },
    signals: { speed: "tracks_engine_rpm", locations: ["front"] },
    audioHints: ["tonal_whine", "high_pitched"],
    notFor: ["electric"],
    wear: { mileageFrom: 100_000, ageFrom: 10 },
    baseRate: 0.35,
    severity: "moderate",
    urgency: "soon",
    safeToDrive: "caution",
    checksFirst: [
      "Rev the engine in park — if the whine pitch tracks RPM precisely, it's on the accessory drive.",
      "Turn on headlights, rear defrost, and AC; a whine that changes with load implicates the alternator.",
      "Watch for battery/charging warning lights or dimming lights at idle.",
    ],
    confirmRuleOut: [
      "A stethoscope on the alternator housing versus other accessories isolates it.",
      "If the whine changes with steering input instead, look at power steering.",
    ],
    repairDirection:
      "Replace or rebuild the alternator before the bearing seizes and takes the belt with it.",
    repairDifficulty: "pro",
    mechanicSummary:
      "RPM-tracking whine, possibly load-sensitive. Please isolate alternator bearing noise and check charging output.",
  },
  {
    id: "starter-issue",
    title: "Starter motor / flywheel engagement issue",
    category: "electrical",
    description:
      "Grinding or a harsh whirring at the moment you start the car — or a single click with no crank — points to a failing starter motor, its solenoid, or worn flywheel teeth. The car may still run fine once started.",
    sounds: ["grind", "whine", "click", "rattle"],
    strongPhrases: ["when starting", "starting the car", "turn the key", "won't start", "cranking", "single click"],
    supportingPhrases: ["morning", "intermittent", "battery", "ignition"],
    contexts: { strong: ["cold_start"], weak: [] },
    signals: { locations: ["front"] },
    audioHints: ["sharp_transients", "broadband_hiss"],
    wear: { mileageFrom: 120_000, ageFrom: 10 },
    baseRate: 0.4,
    severity: "moderate",
    urgency: "prompt",
    safeToDrive: "yes",
    checksFirst: [
      "Note exactly when the noise happens: only during cranking points to the starter; after start-up points elsewhere.",
      "Check battery terminals for corrosion and tightness — a weak connection mimics starter failure.",
      "Count clicks: one loud click usually means the solenoid engaging but motor failing; rapid clicking suggests a weak battery.",
    ],
    confirmRuleOut: [
      "If the noise occurs only while the key is in 'start', the starter circuit is confirmed as the area.",
      "A battery/charging test rules the simple stuff out first.",
    ],
    repairDirection:
      "Test the battery first, then replace the starter if confirmed. The risk is being stranded, not crash safety.",
    repairDifficulty: "pro",
    mechanicSummary:
      "Grinding/click on engagement during cranking. Please test battery and starter draw, and inspect flywheel ring gear teeth.",
  },
  {
    id: "ev-inverter-whine",
    title: "EV inverter / motor whine (usually normal)",
    category: "electrical",
    description:
      "The faint, sci-fi whine that rises and falls with the accelerator on an EV is the inverter and motor doing their normal work. It is by design audible at parking speeds; only a marked change in loudness or pitch is worth investigating.",
    sounds: ["whine", "hum"],
    strongPhrases: ["spaceship", "sci-fi", "electric whine", "whine when accelerating gently", "inverter"],
    supportingPhrases: ["electric", "ev", "quiet", "always done"],
    contexts: { strong: ["acceleration", "low_speed"], weak: ["reversing"] },
    signals: {},
    audioHints: ["tonal_whine", "high_pitched", "strong_harmonics"],
    notFor: ["gasoline", "diesel"],
    baseRate: 0.4,
    severity: "low",
    urgency: "monitor",
    safeToDrive: "yes",
    checksFirst: [
      "Compare against how the car has sounded since new — inverter whine is a constant companion, not a new arrival.",
      "Notice it tracks the accelerator smoothly in both drive and reverse (reverse is often slightly louder by design).",
    ],
    confirmRuleOut: [
      "A consistent, familiar whine proportional to power is normal EV operation.",
      "A NEW, louder whine tied to road speed regardless of throttle points at the reduction gear or a wheel bearing instead.",
    ],
    repairDirection:
      "None for the normal whine. Document and compare over time if unsure.",
    repairDifficulty: "diy-easy",
    mechanicSummary:
      "Characteristic inverter/motor whine on an EV, consistent with normal operation.",
  },
];
