import type { EvalCase } from "../types";
import { rq, veh } from "../helpers";

/**
 * Structured-modifier cases: speed/temperature/load/location/onset/recent-work
 * signals extracted deterministically from the text (no AI required) should
 * sharpen the ranking the way a mechanic's follow-up questions would.
 */
export const MODIFIER_CASES: EvalCase[] = [
  {
    id: "mod-rod-warm-rpm-01",
    tags: ["engine", "modifiers", "red-flag"],
    request: rq(
      "Deep knock from the engine that speeds up when I rev it, and it is noticeably worse after it warms up.",
      ["idle"]
    ),
    expect: {
      top1: ["rod-knock"],
      redFlagIds: ["severe-knocking"],
      safeToDrive: "no",
    },
  },
  {
    id: "mod-lifter-rpm-cold-02",
    tags: ["engine", "modifiers"],
    request: rq(
      "Fast ticking that follows the engine when I rev in neutral, and it fades after the engine warms up.",
      ["cold_start", "idle"]
    ),
    expect: { top1: ["lifter-tick"] },
  },
  {
    id: "mod-bearing-road-speed-03",
    tags: ["wheels_tires", "modifiers", "negation"],
    request: rq(
      "Droning hum that gets faster the faster I go, and it doesn't change when I rev the engine in neutral.",
      ["highway_speed"]
    ),
    expect: { top1: ["wheel-bearing"] },
  },
  {
    id: "mod-accessory-rev-park-04",
    tags: ["electrical", "modifiers"],
    request: rq(
      "A whine that changes when I rev the engine in park, steady regardless of the gear I'm in.",
      ["idle"]
    ),
    // Both accessory-drive whines fit an RPM-tracking whine; the alternator
    // must at least make the top 3.
    expect: {
      top1: ["alternator-bearing-whine", "pulley-tensioner-bearing"],
      top3MustInclude: ["alternator-bearing-whine"],
    },
  },
  {
    id: "mod-ujoint-towing-05",
    tags: ["drivetrain", "modifiers"],
    request: rq(
      "Clunk from under the truck when shifting into gear, worse when towing. It is rear wheel drive.",
      ["reversing"],
      { vehicle: veh("Ford", "F-150", 2013, 145_000) }
    ),
    // U-joint and mounts are the two honest reads of a gear-engagement clunk;
    // the under-the-truck RWD towing story favors the driveline.
    expect: {
      top1: ["driveline-u-joint", "engine-or-trans-mount"],
      top3MustInclude: ["driveline-u-joint"],
    },
  },
  {
    id: "mod-recent-brakes-06",
    tags: ["brakes", "modifiers"],
    request: rq(
      "Just had new pads installed last week and now there is a squeak at every stop.",
      ["braking"]
    ),
    expect: { top1: ["brake-pads-worn"] },
  },
  {
    id: "mod-bearing-front-left-07",
    tags: ["wheels_tires", "modifiers"],
    request: rq(
      "A growl from the front left that gets faster with speed and changes in right-hand curves.",
      ["highway_speed"]
    ),
    expect: { top1: ["wheel-bearing"] },
  },
  {
    id: "mod-sudden-after-tire-shop-08",
    tags: ["wheels_tires", "modifiers", "red-flag"],
    request: rq(
      "Right after the tire shop visit yesterday, a sudden rhythmic clunking and wobble at low speed.",
      ["low_speed"]
    ),
    expect: {
      top1: ["loose-wheel-lugs"],
      redFlagIds: ["wheel-wobble"],
      safeToDrive: "no",
    },
  },
];
