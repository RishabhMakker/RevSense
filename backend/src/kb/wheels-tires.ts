import type { KnownIssue } from "./types";

export const WHEELS_TIRES_ISSUES: KnownIssue[] = [
  {
    id: "wheel-bearing",
    title: "Failing wheel bearing",
    category: "wheels_tires",
    description:
      "A worn wheel bearing makes a hum, growl, or drone that rises with road speed (not engine RPM) and often changes when you swerve gently left or right, as weight shifts onto and off the bad bearing.",
    sounds: ["hum", "rumble", "grind", "whine"],
    strongPhrases: [
      "changes when i turn",
      "louder in turns",
      "lane change",
      "gets faster with speed",
      "humming",
    ],
    supportingPhrases: ["highway", "droning", "growl", "wheel"],
    // A bearing drone tracks wheel rotation and lateral load; noise that only
    // appears under braking or never varies with steering points elsewhere.
    negativePhrases: [
      "only when braking",
      "only while braking",
      "does not change when turning",
      "doesn't change when turning",
      "no matter what i do with the wheel",
    ],
    contexts: {
      strong: ["highway_speed"],
      weak: ["turning_left", "turning_right", "acceleration", "low_speed"],
      exclude: ["idle"],
    },
    signals: { speed: "tracks_road_speed" },
    audioHints: ["low_rumble", "broadband_hiss", "modulated_drone"],
    wear: { mileageFrom: 100_000, ageFrom: 10 },
    baseRate: 0.6,
    severity: "high",
    urgency: "prompt",
    safeToDrive: "caution",
    checksFirst: [
      "On an empty road, gently swerve within your lane — if the drone quiets turning one way and worsens the other, suspect the unloaded/loaded side bearing.",
      "Confirm the pitch tracks road speed, not engine RPM (coast in neutral; bearing noise continues).",
      "Check for play by rocking the lifted wheel at 12 and 6 o'clock.",
    ],
    confirmRuleOut: [
      "Noise change during gentle lane-change weight transfer is the classic bearing signature.",
      "Uniform tire roar that doesn't change with steering points to aggressive/chopped tire wear instead.",
    ],
    repairDirection:
      "Replace the wheel bearing / hub assembly. Don't defer long — a bearing that seizes at speed is dangerous.",
    repairDifficulty: "pro",
    mechanicSummary:
      "Speed-dependent hum that changes with lateral load. Please check wheel bearings for play and roughness, and confirm which corner.",
  },
  {
    id: "tire-rub-alignment",
    title: "Tire rub / uneven tire wear",
    category: "wheels_tires",
    description:
      "Tires can rub the fender liner at full steering lock (especially with new tires, spacers, or worn suspension), and unevenly worn tires produce rhythmic roaring or humming that's easy to mistake for a bearing.",
    sounds: ["rumble", "hum", "grind", "squeal"],
    strongPhrases: ["full lock", "rubbing", "fender", "tire", "tyre"],
    supportingPhrases: ["new tires", "alignment", "cupp", "feather", "wear"],
    contexts: {
      strong: ["low_speed_turning", "highway_speed"],
      weak: ["turning_left", "turning_right", "over_bumps"],
    },
    signals: { speed: "tracks_road_speed" },
    audioHints: ["low_rumble", "broadband_hiss"],
    baseRate: 0.45,
    severity: "low",
    urgency: "soon",
    safeToDrive: "yes",
    checksFirst: [
      "Run a hand across the tire tread (carefully) — a sawtooth/cupped feel means uneven wear that hums.",
      "At full lock in a parking lot, listen for rubbing and look for scuff marks on the fender liners.",
      "Check tire pressures and look for inner/outer edge wear suggesting alignment issues.",
    ],
    confirmRuleOut: [
      "Visible liner scuffing or cupped tread confirms it cheaply.",
      "Rotating the tires front-to-rear and hearing the noise move with them is a classic confirmation.",
    ],
    repairDirection:
      "Alignment, rotation, or replacement tires depending on wear; address the suspension cause if wear is uneven.",
    repairDifficulty: "diy-easy",
    mechanicSummary:
      "Road-speed hum / lock rubbing. Please check tread wear pattern, liner contact marks, pressures, and alignment.",
  },
  {
    id: "loose-wheel-lugs",
    title: "Loose wheel / lug nuts",
    category: "wheels_tires",
    description:
      "After recent tire or brake work, under-torqued lug nuts let the wheel shift, causing a rhythmic clunk or wobble that grows with speed. This is rare but genuinely dangerous — a wheel can separate.",
    sounds: ["clunk", "vibration", "knock", "rattle"],
    strongPhrases: [
      "just had tires",
      "recent tire",
      "after the shop",
      "wheel wobble",
      "lug",
      "wheel feels loose",
    ],
    supportingPhrases: ["wobbl", "shak", "new wheels", "rotation"],
    contexts: {
      strong: ["low_speed", "highway_speed"],
      weak: ["over_bumps", "braking"],
    },
    signals: { speed: "tracks_road_speed", onset: "sudden" },
    audioHints: ["rhythmic_ticking", "sharp_transients"],
    baseRate: 0.15,
    severity: "critical",
    urgency: "immediate",
    safeToDrive: "no",
    checksFirst: [
      "If you've had wheel/tire/brake work recently, stop and check every lug nut with the car's wrench now.",
      "Look for shiny streaks or witness marks around the lug seats.",
      "Do not drive at speed until torque is verified.",
    ],
    confirmRuleOut: [
      "A torque check takes five minutes and is definitive.",
      "If lugs are tight and the wobble persists, look at bent wheels, tire separation, or bearings.",
    ],
    repairDirection:
      "Torque all lug nuts to spec; inspect studs and the wheel's hub bore for damage if it was driven loose.",
    repairDifficulty: "diy-easy",
    mechanicSummary:
      "Possible loose wheel after recent service: rhythmic clunk/wobble. Please verify lug torque and inspect studs/wheel seats.",
  },
  {
    id: "flat-spot-tires",
    title: "Flat-spotted tires (after sitting)",
    category: "wheels_tires",
    description:
      "Tires that sat for weeks (or locked up in a hard stop) develop flat spots that thump or drone rhythmically with wheel speed. Temperature-set flat spots often fade after 15\u201320 minutes of driving; permanent ones don't.",
    sounds: ["vibration", "rumble", "hum"],
    strongPhrases: ["sat for", "been parked for weeks", "after storage", "thump thump", "every rotation"],
    supportingPhrases: ["tire", "vibrat", "morning", "smooths out"],
    contexts: { strong: ["low_speed", "highway_speed"], weak: ["cold_start"] },
    signals: { speed: "tracks_road_speed", onset: "sudden" },
    audioHints: ["rhythmic_ticking", "low_rumble", "modulated_drone"],
    baseRate: 0.25,
    severity: "low",
    urgency: "monitor",
    safeToDrive: "yes",
    checksFirst: [
      "Note whether the thump frequency rises exactly with speed and whether it fades after 15\u201320 minutes of driving.",
      "Think back: did the car sit for weeks, or was there a recent hard ABS stop?",
      "Check tire pressures — underinflated tires flat-spot much faster.",
    ],
    confirmRuleOut: [
      "A rhythmic thump after storage that fades with warm tires is a temporary flat spot.",
      "A thump that never fades needs the tires inspected for permanent flat spots or separation.",
    ],
    repairDirection:
      "Drive it warm and re-check; permanent flat spots mean tire replacement. Inflate properly (or use tire cradles) before the next long park.",
    repairDifficulty: "diy-easy",
    mechanicSummary:
      "Speed-synchronous thump after the car sat, suspected tire flat spots. Please inspect tread for flat spots or separation.",
  },
];
