import type { EvalCase } from "../types";
import { rq } from "../helpers";

export const WHEELS_ENGINE_CASES: EvalCase[] = [
  /* ---------------------------- Wheels / tires --------------------------- */
  {
    id: "bearing-hum-lane-change-01",
    tags: ["wheels_tires", "clear"],
    request: rq(
      "A humming droning noise at highway speed that changes when I turn slightly or do a gentle lane change.",
      ["highway_speed"]
    ),
    expect: { top1: ["wheel-bearing"] },
  },
  {
    id: "bearing-growl-speed-02",
    tags: ["wheels_tires", "clear"],
    request: rq(
      "A growling roar that gets faster with speed and quiets down when I steer slightly to the right.",
      ["highway_speed"]
    ),
    expect: { top1: ["wheel-bearing"] },
  },
  {
    id: "tire-rub-full-lock-01",
    tags: ["wheels_tires", "clear"],
    request: rq(
      "Rubbing noise from the front tire at full lock in parking garages, started after I got new tires fitted.",
      ["low_speed_turning"]
    ),
    expect: { top1: ["tire-rub-alignment"] },
  },
  {
    id: "tire-cupped-roar-02",
    tags: ["wheels_tires", "clear"],
    request: rq(
      "Loud tire roar on the highway, and the tread looks cupped and worn on the inside edges.",
      ["highway_speed"]
    ),
    expect: { top1: ["tire-rub-alignment"] },
  },
  {
    id: "lugs-after-rotation-01",
    tags: ["wheels_tires", "clear", "red-flag"],
    request: rq(
      "Just had my tires rotated and now there is a rhythmic clunk and the wheel feels loose and wobbly at low speed.",
      ["low_speed"]
    ),
    expect: {
      top1: ["loose-wheel-lugs"],
      redFlagIds: ["wheel-wobble"],
      safeToDrive: "no",
    },
  },

  /* ------------------------------- Engine ------------------------------- */
  {
    id: "detonation-ping-uphill-01",
    tags: ["engine", "clear"],
    request: rq(
      "Metallic pinging like marbles in a can when accelerating up hills, especially on hot days with cheap gas.",
      ["acceleration"]
    ),
    expect: { top1: ["engine-knock-detonation"] },
  },
  {
    id: "detonation-premium-fix-02",
    tags: ["engine", "clear"],
    request: rq(
      "A rattling ping under load that mostly goes away when I fill up with premium fuel.",
      ["acceleration"]
    ),
    expect: { top1: ["engine-knock-detonation"] },
  },
  {
    id: "rod-knock-oil-light-01",
    tags: ["engine", "clear", "red-flag"],
    request: rq(
      "Deep knock from the bottom of the engine that speeds up when I rev it, and the oil light flickered once.",
      ["idle"]
    ),
    expect: {
      top1: ["rod-knock"],
      redFlagIds: ["severe-knocking", "oil-pressure"],
      safeToDrive: "no",
    },
  },
  {
    id: "lifter-tick-cold-fades-01",
    tags: ["engine", "clear"],
    request: rq(
      "Fast light ticking from the top of the engine on cold start, it fades after the engine warms up for a few minutes.",
      ["cold_start", "idle"]
    ),
    expect: { top1: ["lifter-tick"] },
  },
  {
    id: "lifter-tick-oil-overdue-02",
    tags: ["engine", "clear"],
    request: rq(
      "A light sewing machine tick at idle, my oil change is quite overdue.",
      ["idle"]
    ),
    expect: { top1: ["lifter-tick"] },
  },
  {
    id: "vacuum-hiss-rough-idle-01",
    tags: ["engine", "clear"],
    request: rq(
      "Hissing from the engine bay at idle and the idle is rough and higher than it should be.",
      ["idle"]
    ),
    expect: { top1: ["vacuum-leak"] },
  },
  {
    id: "vacuum-whoosh-cel-02",
    tags: ["engine", "clear"],
    request: rq(
      "A whooshing air sound near the intake, the check engine light is on and the idle is rough.",
      ["idle"]
    ),
    expect: { top1: ["vacuum-leak"] },
  },
];
