import type { EvalCase } from "../types";
import { rq } from "../helpers";

export const BRAKES_CASES: EvalCase[] = [
  {
    id: "pads-squeal-low-speed-01",
    tags: ["brakes", "clear"],
    request: rq(
      "High pitched squeal when I brake at low speed, it goes away when I press the pedal harder.",
      ["braking", "low_speed"]
    ),
    expect: { top1: ["brake-pads-worn"], safeToDrive: "caution" },
  },
  {
    id: "pads-squeak-stop-sign-02",
    tags: ["brakes", "clear"],
    request: rq(
      "A squeaking noise every time I slow down for a stop sign, mostly from the front.",
      ["braking"]
    ),
    expect: { top1: ["brake-pads-worn"] },
  },
  {
    id: "grind-metal-braking-01",
    tags: ["brakes", "clear", "red-flag"],
    request: rq(
      "Horrible metal on metal grinding when braking, and it gets louder every day.",
      ["braking"]
    ),
    expect: {
      top1: ["brake-metal-grinding"],
      redFlagIds: ["brake-grinding"],
      safeToDrive: "no",
    },
  },
  {
    id: "grind-braking-pulls-02",
    tags: ["brakes", "clear", "red-flag"],
    request: rq(
      "Grinding sound from the front when I press the brake pedal, and the car pulls slightly to the left when stopping.",
      ["braking"]
    ),
    expect: {
      top1: ["brake-metal-grinding"],
      redFlagIds: ["brake-grinding"],
      safeToDrive: "no",
    },
  },
  {
    id: "rotors-pedal-pulse-01",
    tags: ["brakes", "clear"],
    request: rq(
      "The brake pedal pulses and the steering wheel shakes when braking from highway speed.",
      ["braking", "highway_speed"]
    ),
    expect: { top1: ["warped-rotors"] },
  },
  {
    id: "rotors-shudder-downhill-02",
    tags: ["brakes", "clear"],
    request: rq(
      "A shudder through the brake pedal when slowing down from 70, worse on long downhill stretches.",
      ["braking"]
    ),
    expect: { top1: ["warped-rotors"] },
  },
  {
    id: "caliper-burning-pull-01",
    tags: ["brakes", "clear", "red-flag"],
    request: rq(
      "Burning smell near the front right wheel, the car pulls to one side, and there is a rubbing noise even when I am not braking.",
      ["braking", "highway_speed"]
    ),
    expect: {
      top1: ["stuck-caliper"],
      redFlagIds: ["burning-smell"],
      safeToDrive: "no",
    },
  },
  {
    id: "caliper-hot-wheel-drag-02",
    tags: ["brakes", "clear"],
    request: rq(
      "One wheel gets really hot after short drives and there is a constant dragging grinding at low speed.",
      ["low_speed"]
    ),
    expect: { top1: ["stuck-caliper"] },
  },
];
