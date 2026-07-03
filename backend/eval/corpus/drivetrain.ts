import type { EvalCase } from "../types";
import { rq, veh } from "../helpers";

export const DRIVETRAIN_CASES: EvalCase[] = [
  {
    id: "cv-click-driveway-01",
    tags: ["drivetrain", "clear"],
    request: rq(
      "Rhythmic clicking from the front when I turn left out of my driveway, and it gets faster as the car speeds up.",
      ["low_speed_turning", "turning_left"]
    ),
    expect: { top1: ["cv-axle-wear"] },
  },
  {
    id: "cv-pop-parking-lot-02",
    tags: ["drivetrain", "clear"],
    request: rq(
      "Popping noise when making tight turns in parking lots, mostly while accelerating gently.",
      ["low_speed_turning", "acceleration"]
    ),
    expect: { top1: ["cv-axle-wear"] },
  },
  {
    id: "cv-figurative-cards-03",
    tags: ["drivetrain", "figurative"],
    request: rq(
      "It sounds like a pack of cards stuck in bicycle spokes, mostly when I pull out of a parking spot.",
      ["low_speed_turning", "turning_right"]
    ),
    interpreted: {
      soundTypes: ["click", "pop"],
      contexts: [],
      rationale: "Read 'cards in spokes' as rhythmic clicking and popping.",
    },
    expect: { top1: ["cv-axle-wear"] },
  },
  {
    id: "mount-clunk-drive-reverse-01",
    tags: ["drivetrain", "clear"],
    request: rq(
      "A heavy clunk from under the hood when I shift from drive to reverse, and the whole car lurches.",
      ["reversing"]
    ),
    expect: { top1: ["engine-or-trans-mount"] },
  },
  {
    id: "mount-thud-gear-idle-vibe-02",
    tags: ["drivetrain", "clear"],
    request: rq(
      "Thunk when I put it in gear and under hard acceleration, and there is more vibration in the cabin at idle than there used to be.",
      ["acceleration", "idle"]
    ),
    expect: { top1: ["engine-or-trans-mount"] },
  },
  {
    id: "ujoint-clunk-driveshaft-01",
    tags: ["drivetrain", "clear"],
    request: rq(
      "Single metallic clunk from the driveshaft area under the truck when shifting into gear, plus a vibration at highway speed. It is rear wheel drive.",
      ["reversing", "highway_speed"],
      { vehicle: veh("Ford", "F-150", 2012, 140_000) }
    ),
    expect: { top1: ["driveline-u-joint"] },
  },
  {
    id: "trans-whine-neutral-drop-01",
    tags: ["drivetrain", "clear"],
    request: rq(
      "Whining noise that rises with road speed while in gear, and it goes away completely when I shift into neutral.",
      ["acceleration", "highway_speed"]
    ),
    expect: { top1: ["transmission-whine"] },
  },
  {
    id: "trans-whine-fluid-slip-02",
    tags: ["drivetrain", "clear"],
    request: rq(
      "The transmission fluid looked dark, it whines when accelerating and sometimes feels like it slips between gears.",
      ["acceleration"]
    ),
    expect: { top1: ["transmission-whine"] },
  },
];
