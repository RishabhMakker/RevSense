import type { KnownIssue } from "./types";

export const BELTS_ISSUES: KnownIssue[] = [
  {
    id: "serpentine-belt-squeal",
    title: "Serpentine belt slip / glazing",
    category: "belts",
    description:
      "A loud squeal on cold start or when accelerating — especially in damp weather or with the AC on — usually means the serpentine drive belt is glazed, contaminated, or under-tensioned and slipping on its pulleys.",
    sounds: ["squeal", "chirp"],
    strongPhrases: ["belt", "cold start", "first start", "morning", "wet", "rain"],
    supportingPhrases: ["accelerat", "ac on", "loud squeal", "goes away"],
    negativePhrases: ["no belt"],
    contexts: { strong: ["cold_start", "acceleration"], weak: ["idle"] },
    signals: { speed: "tracks_engine_rpm", locations: ["front"] },
    audioHints: ["high_pitched", "tonal_whine", "loud_recording"],
    notFor: ["electric"],
    wear: { ageFrom: 5, mileageFrom: 60_000 },
    baseRate: 0.75,
    severity: "moderate",
    urgency: "soon",
    safeToDrive: "caution",
    checksFirst: [
      "With the engine OFF, inspect the belt for glazing (shiny sides), cracks, or fraying.",
      "Note whether the squeal lasts a few seconds at start-up and fades — classic slip behavior.",
      "Check for coolant or oil contamination on the belt from a small leak above it.",
    ],
    confirmRuleOut: [
      "A brief mist of water on the running belt (done carefully by a professional) changing the noise confirms slip.",
      "If the noise is a chirp that tracks engine speed at idle, suspect a pulley/tensioner bearing instead.",
    ],
    repairDirection:
      "Replace the belt and check the tensioner. Cheap and quick — but a thrown belt kills the alternator, water pump, and power steering at once, so don't ignore it.",
    repairDifficulty: "diy-moderate",
    mechanicSummary:
      "Start-up/load squeal, suspected belt slip. Please check belt condition, tensioner spring force, and pulley alignment.",
  },
  {
    id: "pulley-tensioner-bearing",
    title: "Failing idler pulley / belt tensioner bearing",
    category: "belts",
    description:
      "The small bearings inside idler pulleys and belt tensioners dry out and chirp, rattle, or grind at idle, with the noise tracking engine RPM. A failed pulley can throw the belt entirely.",
    sounds: ["chirp", "rattle", "whine", "grind", "squeal"],
    strongPhrases: ["chirp", "pulley", "tensioner", "engine bay", "tracks engine speed"],
    supportingPhrases: ["idle", "rev", "bearing", "constant"],
    contexts: { strong: ["idle"], weak: ["cold_start", "acceleration"] },
    signals: { speed: "tracks_engine_rpm", locations: ["front"] },
    audioHints: ["rhythmic_ticking", "high_pitched", "tonal_whine", "strong_harmonics"],
    notFor: ["electric"],
    wear: { mileageFrom: 80_000, ageFrom: 8 },
    baseRate: 0.5,
    severity: "moderate",
    urgency: "prompt",
    safeToDrive: "caution",
    checksFirst: [
      "With the engine off, spin each accessible pulley by hand and feel for roughness or wobble.",
      "Rev the engine gently in park — noise that rises exactly with RPM points to the accessory drive.",
      "Look for belt tracking slightly off-center on a wobbling pulley.",
    ],
    confirmRuleOut: [
      "Removing the belt and running the engine briefly (a standard shop test) silences accessory noise and confirms the area.",
      "A mechanic's stethoscope on each pulley bracket locates the bad bearing precisely.",
    ],
    repairDirection:
      "Replace the noisy pulley or the tensioner assembly, usually together with a fresh belt.",
    repairDifficulty: "diy-moderate",
    mechanicSummary:
      "RPM-tracking chirp/rattle from accessory drive. Please isolate with belt removed and check idler/tensioner bearings.",
  },
];
