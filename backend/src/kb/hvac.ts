import type { KnownIssue } from "./types";

export const HVAC_ISSUES: KnownIssue[] = [
  {
    id: "ac-compressor-noise",
    title: "AC compressor / clutch noise",
    category: "hvac",
    description:
      "A rattle, click, or growl that appears the moment the air conditioning is switched on — and vanishes with it off — points at the AC compressor or its clutch, not the engine itself.",
    sounds: ["rattle", "click", "grind", "hum"],
    strongPhrases: ["with the ac on", "when the ac is on", "turn the ac on", "turn on the air", "starts with the ac", "ac compressor", "with the air conditioning"],
    supportingPhrases: ["idle", "engine bay", "clicks on", "cycle"],
    negativePhrases: ["ac off too", "even with the ac off", "ac is off too"],
    contexts: { strong: ["idle"], weak: ["low_speed", "acceleration"] },
    signals: { speed: "tracks_engine_rpm", locations: ["front"] },
    audioHints: ["rhythmic_ticking", "low_rumble"],
    notFor: ["electric"],
    wear: { mileageFrom: 90_000 },
    baseRate: 0.35,
    severity: "moderate",
    urgency: "soon",
    safeToDrive: "yes",
    checksFirst: [
      "Toggle the AC on and off at idle — a noise keyed exactly to the AC switch is the compressor circuit.",
      "Listen for the normal single click of the clutch engaging versus an ongoing rattle or growl.",
      "Check whether the AC still cools; weak cooling plus noise strengthens the case.",
    ],
    confirmRuleOut: [
      "Noise only with AC engaged is near-diagnostic for the compressor/clutch.",
      "If the noise continues with AC off, look at the belt tensioner or idler pulleys instead.",
    ],
    repairDirection:
      "A failing compressor is best replaced before it seizes and shreds the belt; a noisy clutch alone is a cheaper repair.",
    repairDifficulty: "pro",
    mechanicSummary:
      "Noise keyed to AC engagement. Please isolate compressor/clutch noise and check system pressures.",
  },
  {
    id: "blower-motor-noise",
    title: "Blower motor squeal / flutter",
    category: "hvac",
    description:
      "A squeal, chirp, or fluttering from behind the dash that changes with FAN SPEED (not engine speed) is the heater blower motor or debris caught in it — leaves love to get in there.",
    sounds: ["squeal", "chirp", "flutter", "hum"],
    strongPhrases: ["with the fan", "changes with fan speed", "behind the dash", "when the heater is on", "blower"],
    supportingPhrases: ["vent", "dash", "leaves", "fan"],
    contexts: { strong: ["idle"], weak: ["cold_start"] },
    signals: { locations: ["in_cabin"] },
    audioHints: ["high_pitched", "broadband_hiss"],
    baseRate: 0.4,
    severity: "low",
    urgency: "monitor",
    safeToDrive: "yes",
    checksFirst: [
      "Cycle the fan from off to max with the engine idling — a noise that scales with fan speed is the blower.",
      "It persists with the engine off (ignition on) too, which fully rules out the engine.",
      "Check the cabin air filter and intake for leaves or debris.",
    ],
    confirmRuleOut: [
      "Noise tracking fan speed instead of engine RPM is definitive.",
      "If it changes when you rev the engine instead, look at the accessory drive.",
    ],
    repairDirection:
      "Clear debris or replace the blower motor — an easy, inexpensive dash-access job on most cars.",
    repairDifficulty: "diy-moderate",
    mechanicSummary:
      "Cabin noise scaling with fan speed. Please check blower motor and clear the intake/cabin filter path.",
  },
  {
    id: "refrigerant-hiss-benign",
    title: "Refrigerant equalizing hiss (normal)",
    category: "hvac",
    description:
      "A soft hiss from the dash or engine bay for a minute or two right after shutting off the car — especially after using the AC — is refrigerant pressure equalizing in the system. Normal.",
    sounds: ["hiss"],
    strongPhrases: ["after i turn the car off", "after shutting off", "from the dash after", "when parked after driving"],
    supportingPhrases: ["ac", "air conditioning", "brief", "stops"],
    contexts: { strong: ["idle"], weak: [] },
    signals: { locations: ["in_cabin", "front"] },
    audioHints: ["broadband_hiss"],
    baseRate: 0.35,
    severity: "low",
    urgency: "monitor",
    safeToDrive: "yes",
    checksFirst: [
      "Confirm the timing: it starts right at shutoff after AC use and fades within a couple of minutes.",
      "Confirm the AC still cools normally on the next drive.",
    ],
    confirmRuleOut: [
      "A brief post-shutoff hiss with normal cooling is pressure equalization — no fault.",
      "A hiss WHILE driving, or steadily weakening cooling, points at a real refrigerant leak instead.",
    ],
    repairDirection:
      "None needed — normal system behavior. If cooling degrades, have the system leak-tested.",
    repairDifficulty: "diy-easy",
    mechanicSummary:
      "Post-shutoff equalization hiss after AC use; cooling normal, no fault indicated.",
  },
  {
    id: "blend-door-click",
    title: "HVAC blend-door actuator click (after shutdown)",
    category: "hvac",
    description:
      "A repeated soft clicking or ticking from behind the dash — often right after startup or shutdown, or when changing temperature — is usually a small plastic blend-door actuator recalibrating or stripping its gears.",
    sounds: ["click", "tick"],
    strongPhrases: ["behind the dash", "from the dash", "when i change the temperature", "after i shut it off", "clicking from the vents"],
    supportingPhrases: ["heater", "ac", "vent", "repeated"],
    contexts: { strong: ["idle", "cold_start"], weak: [] },
    signals: { locations: ["in_cabin"] },
    audioHints: ["rhythmic_ticking"],
    baseRate: 0.35,
    severity: "low",
    urgency: "monitor",
    safeToDrive: "yes",
    checksFirst: [
      "Change the temperature or vent mode and listen — a click burst that follows the controls is a door actuator.",
      "Note whether one side of the cabin blows the wrong temperature (a stripped actuator symptom).",
    ],
    confirmRuleOut: [
      "Clicking synchronized with HVAC control changes is definitive for an actuator.",
      "Clicking that tracks engine speed instead is not HVAC — look at the valvetrain checks.",
    ],
    repairDirection:
      "Replace the small actuator (inexpensive part; access behind the dash varies from trivial to tedious).",
    repairDifficulty: "diy-moderate",
    mechanicSummary:
      "Dash clicking tied to HVAC mode/temperature changes, suspected blend-door actuator.",
  },
];
