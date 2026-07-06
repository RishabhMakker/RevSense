import type { EvalCase } from "../types";
import { rq } from "../helpers";

/**
 * Negation cases: the text explicitly rules something out, and today's
 * prefix-stem matcher can't see the "not". Cases tagged "headroom-negation"
 * pin the DESIRED behavior and are expected to fail until the structured
 * interpretation phase lands — they are excluded from CI floors but tracked
 * in the report so progress is visible.
 */
export const NEGATION_CASES: EvalCase[] = [
  {
    id: "neg-click-not-braking-01",
    // Fixed in A2 via brake-cause negative phrases.
    tags: ["negation"],
    request: rq(
      "Clicking when turning at low speed but definitely NOT when braking, the brakes feel completely fine.",
      ["low_speed_turning"]
    ),
    expect: {
      top1: ["cv-axle-wear"],
      mustNotRank: ["brake-pads-worn", "brake-metal-grinding"],
    },
  },
  {
    id: "neg-squeal-not-brakes-02",
    // Fixed in A3: negated braking context + belief-negation phrases.
    tags: ["negation"],
    request: rq(
      "Squealing while driving but it does not change at all when I press the brakes, so I do not think it is the brakes.",
      ["cold_start", "acceleration"]
    ),
    expect: {
      top1: ["serpentine-belt-squeal"],
      mustNotRank: ["brake-pads-worn"],
    },
  },
  {
    id: "neg-hum-not-turning-03",
    // A steering-independent, speed-tied hum: tire wear and differential
    // whine are both correct reads once the bearing is ruled out (its noise
    // changes with lateral load). Resolved by A2 negatives + the A4 diff entry.
    tags: ["negation"],
    request: rq(
      "Humming at highway speed that does not change when turning or swerving gently, steady no matter what I do with the wheel.",
      ["highway_speed"]
    ),
    expect: { top1: ["tire-rub-alignment", "diff-gear-whine"] },
  },
  {
    id: "neg-oil-light-never-04",
    // Fixed in A3: deterministic negation of the flag's own trigger phrase
    // ("the oil light never came on") plus temperature-signal contradiction.
    tags: ["negation", "red-flag"],
    request: rq(
      "Knocking sound only when cold, completely gone once warm. The oil light never came on and the oil level is full.",
      ["cold_start"]
    ),
    expect: {
      forbidRedFlagIds: ["oil-pressure"],
      mustNotRank: ["rod-knock"],
    },
  },
  {
    id: "neg-not-stationary-05",
    // Fixed in A3: the column's "never when stationary" negatives demote it
    // below CV wear. It may still rank lower down — that's honest triage.
    tags: ["negation"],
    request: rq(
      "Clicking when rolling through turns, it never happens when the car is stationary even with the wheel turning.",
      ["low_speed_turning"]
    ),
    expect: {
      top1: ["cv-axle-wear"],
    },
  },
  {
    id: "neg-no-smoke-06",
    // Fixed in A3: "no smoke or burning smell" no longer trips those flags,
    // while the literal brake-grinding flag stands.
    tags: ["negation", "red-flag"],
    request: rq(
      "Grinding when braking hard. No smoke or burning smell, just the noise.",
      ["braking"]
    ),
    // The literal brake red flag MUST stay (safety), but the smoke flag must
    // not fire off a negated mention.
    expect: {
      redFlagIds: ["brake-grinding"],
      forbidRedFlagIds: ["smoke", "burning-smell"],
      safeToDrive: "no",
    },
  },
  {
    id: "neg-not-engine-speed-07",
    // Fixed in A2 via the alternator's road-speed negative phrases.
    tags: ["negation"],
    request: rq(
      "A whine that rises with road speed but does not change when I rev the engine in neutral.",
      ["highway_speed"]
    ),
    expect: { mustNotRank: ["alternator-bearing-whine"] },
  },
  {
    id: "neg-only-when-moving-08",
    tags: ["negation"],
    request: rq(
      "A rhythmic clicking from the front wheels when rolling through a turn under power. It stops the moment the car stops moving.",
      ["low_speed_turning", "turning_left"]
    ),
    // No headroom tag: the affirmative signal is strong enough that the
    // current engine should already get this right.
    expect: { top1: ["cv-axle-wear"] },
  },
];
