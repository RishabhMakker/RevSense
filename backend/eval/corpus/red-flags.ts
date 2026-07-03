import type { EvalCase } from "../types";
import { rq } from "../helpers";

/**
 * Safety cases. These pin the red-flag layer: stop-driving hazards must be
 * detected from the user's literal words and must set the overall verdict.
 * Safety violations in this file are never acceptable — the benchmark test
 * asserts zero, and no phase may trade them for ranking accuracy.
 */
export const RED_FLAG_CASES: EvalCase[] = [
  {
    id: "flag-smoke-wheel-01",
    tags: ["red-flag", "brakes"],
    request: rq(
      "Grinding noise when braking and I can see smoke coming off the front wheel.",
      ["braking"]
    ),
    expect: {
      redFlagIds: ["brake-grinding", "smoke"],
      safeToDrive: "no",
    },
  },
  {
    id: "flag-smoke-hood-02",
    tags: ["red-flag"],
    request: rq("White smoke from under the hood when I stop at lights.", [
      "idle",
    ]),
    expect: { redFlagIds: ["smoke"], safeToDrive: "no" },
  },
  {
    id: "flag-burning-hot-wheel-03",
    tags: ["red-flag", "brakes"],
    request: rq(
      "Strong burning rubber smell after driving and one front wheel is too hot to touch.",
      ["low_speed"]
    ),
    expect: {
      top1: ["stuck-caliper"],
      redFlagIds: ["burning-smell"],
      safeToDrive: "no",
    },
  },
  {
    id: "flag-overheat-steam-04",
    tags: ["red-flag", "cooling"],
    request: rq(
      "Steam from under the hood, the temperature gauge is climbing, and there is a whining noise up front.",
      ["idle"]
    ),
    expect: {
      top1: ["coolant-leak-water-pump"],
      redFlagIds: ["overheating"],
      safeToDrive: "no",
    },
  },
  {
    id: "flag-oil-pressure-knock-05",
    tags: ["red-flag", "engine"],
    request: rq(
      "Deep knocking sound and the oil pressure light is on at idle.",
      ["idle"]
    ),
    expect: {
      top1: ["rod-knock"],
      redFlagIds: ["oil-pressure", "severe-knocking"],
      safeToDrive: "no",
    },
  },
  {
    id: "flag-wheel-wobble-06",
    tags: ["red-flag", "wheels_tires"],
    request: rq(
      "Violent shaking at highway speed and a wheel wobble that gets worse the faster I go.",
      ["highway_speed"]
    ),
    expect: {
      top1: ["loose-wheel-lugs"],
      redFlagIds: ["wheel-wobble"],
      safeToDrive: "no",
    },
  },
  {
    id: "flag-steering-loose-07",
    // headroom-scoring: rack needs "steering feels loose" as a strong phrase
    // (A2 KB data) to out-rank sway-bar links here; the safety flag already fires.
    tags: ["red-flag", "steering", "headroom-scoring"],
    request: rq(
      "The steering feels loose and delayed to respond, with clunking from underneath over bumps.",
      ["over_bumps"]
    ),
    expect: {
      top1: ["steering-rack-knock"],
      redFlagIds: ["steering-concern"],
      safeToDrive: "no",
    },
  },
  {
    id: "flag-power-loss-08",
    tags: ["red-flag", "engine"],
    request: rq(
      "Rattling noise and the car is losing power going uphill.",
      ["acceleration"]
    ),
    expect: {
      top1: ["engine-knock-detonation"],
      redFlagIds: ["power-loss"],
      safeToDrive: "caution",
    },
  },
  {
    id: "flag-fluid-puddle-09",
    // headroom-scoring: "red fluid" should implicate transmission / power
    // steering (their fluid is red) — phrase data lands in A2.
    tags: ["red-flag", "headroom-scoring"],
    request: rq(
      "Whining noise and a puddle of red fluid under the car every morning.",
      ["idle"]
    ),
    expect: {
      top3MustInclude: ["power-steering-whine", "transmission-whine"],
      redFlagIds: ["heavy-fluid-leak"],
      safeToDrive: "caution",
    },
  },
  {
    id: "flag-clean-no-flags-10",
    tags: ["red-flag", "suspension"],
    // Control case: an ordinary annoyance must NOT trip any safety flag.
    request: rq(
      "Small metallic rattle from the front over speed bumps, otherwise the car drives normally.",
      ["over_bumps"]
    ),
    // No safeToDrive pin: runners-up above the verdict threshold may
    // legitimately pull "caution" — the point here is zero red flags.
    expect: {
      top1: ["sway-bar-links"],
      forbidRedFlagIds: [
        "brake-grinding",
        "severe-knocking",
        "smoke",
        "burning-smell",
        "overheating",
        "oil-pressure",
        "wheel-wobble",
        "steering-concern",
        "power-loss",
        "heavy-fluid-leak",
      ],
    },
  },
];
