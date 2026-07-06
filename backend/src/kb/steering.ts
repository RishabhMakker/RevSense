import type { KnownIssue } from "./types";

export const STEERING_ISSUES: KnownIssue[] = [
  {
    id: "steering-shaft-column",
    title: "Steering column / intermediate shaft wear",
    category: "steering",
    description:
      "The intermediate shaft connects the steering wheel to the rack. When its joints wear, you get a click or clunk you can often feel through the steering wheel itself when turning, especially at parking speeds — even when the car is barely moving.",
    sounds: ["click", "clunk", "creak"],
    strongPhrases: [
      "feel it in the wheel",
      "through the steering wheel",
      "steering wheel",
      "column",
      "while stationary",
      "parked",
    ],
    supportingPhrases: ["turn", "low speed", "parking"],
    // The column clicks even at rest; "only while moving" points at the axles.
    negativePhrases: [
      "only when moving",
      "only while moving",
      "only while rolling",
      "only when rolling",
      "never when stationary",
      "never happens when stationary",
      "never happens when the car is stationary",
    ],
    contexts: {
      strong: ["low_speed_turning", "turning_left", "turning_right"],
      weak: ["low_speed", "reversing"],
    },
    signals: { locations: ["in_cabin", "front"] },
    audioHints: ["sharp_transients"],
    wear: { ageFrom: 8, mileageFrom: 80_000 },
    baseRate: 0.4,
    severity: "moderate",
    urgency: "prompt",
    safeToDrive: "caution",
    checksFirst: [
      "With the car stationary and engine on, rock the steering wheel gently side to side and feel for a click through the rim.",
      "Note whether the noise happens even when not moving — CV joints need wheel rotation, the column doesn't.",
      "Check for any free play in the wheel before the tires respond.",
    ],
    confirmRuleOut: [
      "Clicking felt through the wheel while stationary points strongly to the column/intermediate shaft, not the axles.",
      "If it only clicks while rolling through turns, CV joints are more likely.",
    ],
    repairDirection:
      "Replace the intermediate shaft or affected joint. Steering play deserves prompt professional attention.",
    repairDifficulty: "pro",
    mechanicSummary:
      "Click/clunk felt through the steering wheel during low-speed steering input, present when stationary. Please check intermediate shaft and column joints for play.",
  },
  {
    id: "power-steering-whine",
    title: "Power steering pump / low fluid",
    category: "steering",
    description:
      "Hydraulic power steering whines or groans when the fluid is low, aerated, or the pump is wearing out. It's loudest when turning the wheel at low speed or holding it at full lock, and often worse on cold mornings.",
    sounds: ["whine", "hum", "groan", "creak"],
    // PS fluid is red like ATF — a red puddle plus steering whine fits here.
    strongPhrases: ["steering", "turn the wheel", "full lock", "heavy steering", "hard to turn", "red fluid"],
    supportingPhrases: ["cold", "fluid", "reservoir", "groan"],
    negativePhrases: ["electric power steering"],
    contexts: {
      strong: ["low_speed_turning", "turning_left", "turning_right"],
      weak: ["cold_start", "idle"],
    },
    signals: { speed: "tracks_engine_rpm" },
    audioHints: ["tonal_whine"],
    notFor: ["electric"],
    wear: { ageFrom: 8, mileageFrom: 90_000 },
    baseRate: 0.5,
    severity: "moderate",
    urgency: "soon",
    safeToDrive: "caution",
    checksFirst: [
      "Check the power steering reservoir level and look for foamy (aerated) fluid.",
      "Note if steering effort has increased or feels notchy.",
      "Look under the front of the car for fluid drips after parking overnight.",
      "Note: many newer cars use electric power steering and have no pump or fluid — if so, this cause doesn't apply.",
    ],
    confirmRuleOut: [
      "Low or foamy fluid plus a whine that tracks steering input is a strong match.",
      "If the fluid is full and clean and the whine tracks engine RPM instead, look at the belt/pulleys or alternator.",
    ],
    repairDirection:
      "Top up / flush fluid and fix any leak; replace the pump if it stays noisy with good fluid.",
    repairDifficulty: "pro",
    mechanicSummary:
      "Whine on steering input, suspected hydraulic PS system. Please check fluid level/condition, leaks at rack and lines, and pump noise.",
  },
  {
    id: "steering-rack-knock",
    title: "Steering rack wear / inner tie rods",
    category: "steering",
    description:
      "Wear in the steering rack or inner tie-rod ends causes a knock or rattle over rough roads and a vague, loose feeling on-center. You might hear clunks when sawing the wheel back and forth at a stop.",
    sounds: ["clunk", "rattle", "knock"],
    strongPhrases: [
      "loose steering",
      "steering feels loose",
      "play in the wheel",
      "vague",
      "tie rod",
      "rack",
    ],
    supportingPhrases: ["bump", "rough road", "wander", "steering"],
    contexts: {
      strong: ["over_bumps"],
      weak: ["turning_left", "turning_right", "low_speed_turning"],
    },
    signals: { locations: ["front"] },
    audioHints: ["sharp_transients"],
    wear: { mileageFrom: 100_000, ageFrom: 10 },
    baseRate: 0.35,
    severity: "high",
    urgency: "prompt",
    safeToDrive: "caution",
    checksFirst: [
      "With the car parked, saw the steering wheel a few degrees each way and listen for knocking from below.",
      "Note any new wandering or the need for constant small corrections on the highway.",
      "Have someone watch the front tires while you rock the wheel — delayed tire response means play somewhere in the linkage.",
    ],
    confirmRuleOut: [
      "A shop shaking the front wheels at 9 and 3 o'clock can isolate tie-rod play quickly.",
      "If the noise only happens over bumps with no steering play, sway-bar links are the more common culprit.",
    ],
    repairDirection:
      "Replace inner/outer tie rods or the rack assembly, then align. Steering play is a safety item — don't sit on it.",
    repairDifficulty: "pro",
    mechanicSummary:
      "Knocking over bumps with on-center play. Please check inner/outer tie rods and rack bushings, then alignment after repair.",
  },
];
