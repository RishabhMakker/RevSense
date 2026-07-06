import type { KnownIssue } from "./types";

export const COOLING_ISSUES: KnownIssue[] = [
  {
    id: "coolant-leak-water-pump",
    title: "Coolant leak / water pump",
    category: "cooling",
    description:
      "A hiss after shutting off a hot engine, a sweet syrupy smell, or a grinding whine from the front of the engine can point to a coolant leak or a failing water pump. Cooling problems escalate to overheating fast.",
    sounds: ["hiss", "whine", "grind"],
    strongPhrases: ["coolant", "sweet smell", "after i turn it off", "temperature", "overheating", "steam"],
    supportingPhrases: ["leak", "puddle", "radiator", "smell"],
    negativePhrases: ["coolant level is fine", "coolant is full", "red fluid"],
    contexts: { strong: ["idle"], weak: ["cold_start", "highway_speed"] },
    signals: { speed: "tracks_engine_rpm", locations: ["front"] },
    audioHints: ["broadband_hiss", "tonal_whine"],
    notFor: ["electric"],
    wear: { ageFrom: 8, mileageFrom: 90_000 },
    baseRate: 0.4,
    severity: "high",
    urgency: "prompt",
    safeToDrive: "caution",
    checksFirst: [
      "Check the coolant level in the overflow tank when the engine is COLD — never open a hot radiator cap.",
      "Look for green/orange/pink residue or puddles under the front of the engine.",
      "Watch the temperature gauge on your next short drive; any climb above normal means stop.",
    ],
    confirmRuleOut: [
      "A cooling system pressure test pinpoints leaks quickly.",
      "Weep marks or drips at the water pump confirm the pump; a whine plus play at the pump pulley seals it.",
    ],
    repairDirection:
      "Fix the leak (hose, pump, radiator) before it overheats — overheating warps heads and turns a small job into an engine job.",
    repairDifficulty: "pro",
    mechanicSummary:
      "Possible coolant leak/water-pump noise. Please pressure-test the cooling system and inspect the pump weep hole and pulley play.",
  },
  {
    id: "ev-cooling-pump-hum",
    title: "EV battery/electronics cooling pump & fan",
    category: "cooling",
    description:
      "EVs and hybrids run electric coolant pumps and fans for the battery and power electronics — sometimes while parked, charging, or after you walk away. A soft hum or whir in those moments is usually the thermal system doing its job; a new loud drone can mean a tired pump or fan.",
    sounds: ["hum", "whine", "hiss"],
    strongPhrases: ["while charging", "when parked", "after i turn it off", "keeps running", "fan noise when off"],
    supportingPhrases: ["battery", "electric", "pump", "fan", "front"],
    contexts: { strong: ["idle"], weak: ["cold_start"] },
    signals: { locations: ["front"] },
    audioHints: ["tonal_whine", "broadband_hiss"],
    notFor: ["gasoline", "diesel"],
    baseRate: 0.35,
    severity: "low",
    urgency: "monitor",
    safeToDrive: "yes",
    checksFirst: [
      "Note WHEN it runs: during/after charging and on hot days is expected battery-thermal behavior.",
      "Compare loudness to what the car has always done — a pump growing louder or grinding is the concern.",
      "Check for any thermal or battery warnings in the car's app or dash.",
    ],
    confirmRuleOut: [
      "A quiet hum during charging or hot-weather parking is normal thermal management.",
      "A grinding/whining pump with reduced range or thermal warnings needs service.",
    ],
    repairDirection:
      "None if quiet and situational; a noisy pump or fan is a straightforward replacement at a shop familiar with EVs.",
    repairDifficulty: "pro",
    mechanicSummary:
      "Thermal pump/fan hum on an electrified vehicle; please assess pump/fan bearing noise if louder than baseline.",
  },
];
