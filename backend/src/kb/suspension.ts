import type { KnownIssue } from "./types";

export const SUSPENSION_ISSUES: KnownIssue[] = [
  {
    id: "strut-mount",
    title: "Worn strut mount / bearing",
    category: "suspension",
    description:
      "The top strut mounts include a bearing that lets the strut rotate with the steering. When worn, they pop, creak, or clunk during slow-speed turns and over small bumps, often felt at the top of the shock tower.",
    sounds: ["pop", "creak", "clunk"],
    strongPhrases: ["turn", "popping when turning", "front top", "strut"],
    supportingPhrases: ["bump", "parking", "slow", "creak"],
    contexts: {
      strong: ["low_speed_turning", "turning_left", "turning_right", "over_bumps"],
      weak: ["low_speed", "reversing"],
    },
    signals: { locations: ["front"] },
    audioHints: ["sharp_transients"],
    wear: { mileageFrom: 80_000, ageFrom: 8 },
    baseRate: 0.5,
    severity: "moderate",
    urgency: "soon",
    safeToDrive: "yes",
    checksFirst: [
      "Have a helper turn the wheel lock-to-lock while you rest a hand on the strut tower under the hood — worn mounts transmit a pop or grind you can feel.",
      "Listen for a single pop per steering input rather than rapid clicking.",
      "Check for clunks over speed bumps at parking speed.",
    ],
    confirmRuleOut: [
      "Noise/feel at the strut tower during stationary steering is a good confirmation.",
      "Rapid click-click-click while rolling through a turn suggests CV joints instead.",
    ],
    repairDirection:
      "Replace the strut mounts/bearings — often done together with struts if they're tired.",
    repairDifficulty: "pro",
    mechanicSummary:
      "Pop/creak on steering input and small bumps, suspected strut top mounts. Please check mount bearings while loaded and unloaded.",
  },
  {
    id: "sway-bar-links",
    title: "Worn sway bar end links",
    category: "suspension",
    description:
      "Sway-bar end links are small ball-jointed rods that wear quickly on rough roads. The signature is a metallic rattle or clunk from the front over bumps and broken pavement, usually disappearing on smooth roads.",
    sounds: ["rattle", "clunk", "click"],
    strongPhrases: ["bump", "rough road", "pothole", "speed bump", "rattle over"],
    supportingPhrases: ["front", "metallic", "small bumps", "driveway"],
    contexts: { strong: ["over_bumps"], weak: ["low_speed"] },
    signals: { locations: ["front"] },
    audioHints: ["sharp_transients", "rhythmic_ticking"],
    wear: { mileageFrom: 60_000, ageFrom: 6 },
    baseRate: 0.7,
    severity: "low",
    urgency: "soon",
    safeToDrive: "yes",
    checksFirst: [
      "With the car parked, grab each sway-bar end link and try to shake it — any free play or knocking means it's worn.",
      "Note that the noise typically vanishes on smooth roads and during steady cornering.",
      "Check both sides; they usually wear in pairs.",
    ],
    confirmRuleOut: [
      "Hand-shake play at the link is an easy, reliable confirmation.",
      "If the clunk happens during braking or acceleration rather than bumps, look at control arms or mounts.",
    ],
    repairDirection:
      "Replace the end links — an inexpensive, quick job and a very common fix for bump rattles.",
    repairDifficulty: "diy-moderate",
    mechanicSummary:
      "Front-end rattle over bumps, quiet on smooth roads. Please check sway-bar end links and bushings for play.",
  },
  {
    id: "control-arm-bushings",
    title: "Worn control arm bushings",
    category: "suspension",
    description:
      "The rubber bushings where the control arms mount to the body crack and soften with age. Expect dull clunks over bumps, a clunk when braking from low speed, and slightly vague or shifting steering feel.",
    sounds: ["clunk", "creak", "knock"],
    strongPhrases: ["bushing", "control arm", "clunk when braking", "dull thud"],
    supportingPhrases: ["bump", "brake", "vague", "pulls"],
    contexts: {
      strong: ["over_bumps"],
      weak: ["braking", "acceleration", "low_speed"],
    },
    signals: { locations: ["front"] },
    audioHints: ["sharp_transients", "low_rumble"],
    wear: { mileageFrom: 90_000, ageFrom: 10 },
    baseRate: 0.5,
    severity: "moderate",
    urgency: "soon",
    safeToDrive: "yes",
    checksFirst: [
      "Look at the visible control-arm bushings for cracked, separated, or oil-soaked rubber.",
      "Notice whether the clunk has a duller, rubbery character versus a sharp metallic rattle.",
      "Check tire wear — worn bushings let alignment wander and scrub tires unevenly.",
    ],
    confirmRuleOut: [
      "Visibly cracked or separated bushing rubber confirms it.",
      "A pry-bar test on a lift shows movement at the bushing; if the links and ball joints are tight and bushings move, that's your noise.",
    ],
    repairDirection:
      "Replace bushings or complete control arms (often cheaper in labor), then align.",
    repairDifficulty: "pro",
    mechanicSummary:
      "Dull clunks over bumps with vague steering. Please inspect control-arm bushings and ball joints; alignment after replacement.",
  },
  {
    id: "ball-joint-wear",
    title: "Worn ball joint",
    category: "suspension",
    description:
      "Ball joints connect the control arms to the steering knuckle. Worn ones creak or clunk over bumps and during turns; a badly worn joint can separate and cause loss of control, so this one shouldn't wait.",
    sounds: ["creak", "groan", "clunk", "knock", "squeal"],
    strongPhrases: ["ball joint", "creaking when turning", "creaks over bumps"],
    supportingPhrases: ["turn", "bump", "front", "groan"],
    contexts: {
      strong: ["over_bumps", "low_speed_turning"],
      weak: ["turning_left", "turning_right", "low_speed"],
    },
    signals: { locations: ["front"] },
    audioHints: ["sharp_transients"],
    wear: { mileageFrom: 100_000, ageFrom: 10 },
    baseRate: 0.4,
    severity: "high",
    urgency: "prompt",
    safeToDrive: "caution",
    checksFirst: [
      "Listen for a creak that happens with suspension movement — pushing down on a front corner can reproduce it.",
      "Check for uneven inner tire-edge wear.",
      "If steering has developed a clunk plus wandering, get it inspected promptly rather than diagnosing further yourself.",
    ],
    confirmRuleOut: [
      "A shop checking joint play with the wheel lifted gives a definitive answer.",
      "If the creak vanishes after spraying the rubber bushing areas with silicone, bushings are more likely than the joint itself.",
    ],
    repairDirection:
      "Replace the worn ball joint (or arm assembly). Treat as a safety repair — a separated joint drops the corner of the car.",
    repairDifficulty: "pro",
    mechanicSummary:
      "Creak/clunk with suspension travel and turning. Please check ball joints for play and boots for damage; advise on urgency.",
  },
];
