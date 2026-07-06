import type { KnownIssue } from "./types";

export const FUEL_AIR_ISSUES: KnownIssue[] = [
  {
    id: "fuel-pump-whine",
    title: "Failing fuel pump whine",
    category: "fuel_air",
    description:
      "A fuel pump on its way out whines or buzzes loudly from the rear of the car (under the back seat / tank area), often worse on a low tank or hot day, and may pair with long cranks or hesitation.",
    sounds: ["whine", "hum", "rattle"],
    strongPhrases: ["from the back seat", "under the rear seat", "fuel pump", "from the tank", "louder on empty", "low tank"],
    supportingPhrases: ["rear", "hesitat", "hard to start", "sputter"],
    contexts: { strong: ["idle", "highway_speed"], weak: ["acceleration", "cold_start"] },
    signals: { locations: ["rear"] },
    audioHints: ["tonal_whine"],
    notFor: ["electric"],
    wear: { mileageFrom: 100_000 },
    baseRate: 0.3,
    severity: "moderate",
    urgency: "prompt",
    safeToDrive: "caution",
    checksFirst: [
      "Locate it: pump whine comes from the rear seat/tank area, not the engine bay.",
      "Notice if it is worse with a near-empty tank (the fuel cools and quiets the pump when full).",
      "Watch for hesitation, sputtering at speed, or longer-than-usual cranking.",
    ],
    confirmRuleOut: [
      "A fuel-pressure test confirms a weak pump quickly.",
      "A steady rear whine that never affects running may also be normal pump noise — volume and change over time are the tell.",
    ],
    repairDirection:
      "Replace the pump (usually in-tank) before it strands you; keeping the tank above a quarter helps it live longer meanwhile.",
    repairDifficulty: "pro",
    mechanicSummary:
      "Loud rear/tank-area whine, worse on low fuel, possible hesitation. Please test fuel pressure and pump draw.",
  },
  {
    id: "fuel-pump-prime-whine",
    title: "Fuel pump priming (normal)",
    category: "fuel_air",
    description:
      "The brief 2-second hum or whine from the rear when you switch the ignition on — before starting — is the fuel pump priming the system. It is completely normal on nearly every fuel-injected car.",
    sounds: ["whine", "hum"],
    strongPhrases: ["when i turn the key on", "before i start", "two seconds", "when i unlock", "ignition on"],
    supportingPhrases: ["rear", "brief", "stops after", "hum from the back"],
    contexts: { strong: ["cold_start"], weak: ["idle"] },
    signals: { locations: ["rear"] },
    audioHints: ["tonal_whine"],
    notFor: ["electric"],
    baseRate: 0.5,
    severity: "low",
    urgency: "monitor",
    safeToDrive: "yes",
    checksFirst: [
      "Confirm the timing: a short hum right at key-on that stops after a couple of seconds is the priming cycle.",
      "Confirm the car starts and runs normally afterward.",
    ],
    confirmRuleOut: [
      "A 1\u20133 second rear hum at key-on that always stops is normal priming — no action needed.",
      "If the whine continues loudly while driving or the car hesitates, treat it as the failing-pump pattern instead.",
    ],
    repairDirection:
      "None — this is normal operation. Reassurance is the fix.",
    repairDifficulty: "diy-easy",
    mechanicSummary:
      "Brief key-on hum from the tank area consistent with normal fuel-pump priming; no fault indicated.",
  },
];
