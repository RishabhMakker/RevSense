import type { EvalCase } from "../types";
import { rq } from "../helpers";

export const BELTS_EXHAUST_ELECTRICAL_CASES: EvalCase[] = [
  /* ---------------------------- Belts & pulleys --------------------------- */
  {
    id: "belt-squeal-cold-rain-01",
    tags: ["belts", "clear"],
    request: rq(
      "Loud squeal for a few seconds on cold morning starts, noticeably worse when it rains.",
      ["cold_start"]
    ),
    expect: { top1: ["serpentine-belt-squeal"] },
  },
  {
    id: "belt-screech-ac-damp-02",
    tags: ["belts", "clear"],
    request: rq(
      "Screeching squeal with the AC on when accelerating away from lights, worse on damp mornings.",
      ["acceleration"]
    ),
    expect: { top1: ["serpentine-belt-squeal"] },
  },
  {
    id: "pulley-chirp-rpm-01",
    tags: ["belts", "clear"],
    request: rq(
      "Constant chirping from the engine bay at idle that speeds up exactly with engine RPM when I rev it.",
      ["idle"]
    ),
    expect: { top1: ["pulley-tensioner-bearing"] },
  },
  {
    id: "pulley-rough-spin-02",
    tags: ["belts", "clear"],
    request: rq(
      "A rattling grind from the pulley area at idle; one pulley felt rough and wobbly when I spun it with the belt off.",
      ["idle"]
    ),
    expect: { top1: ["pulley-tensioner-bearing"] },
  },

  /* ------------------------------- Exhaust ------------------------------- */
  {
    id: "heatshield-tinny-rpm-01",
    tags: ["exhaust", "clear"],
    request: rq(
      "Tinny metallic rattle from under the car at idle, it buzzes at certain RPMs and vanishes when I rev higher.",
      ["idle"]
    ),
    expect: { top1: ["exhaust-heat-shield"] },
  },
  {
    id: "heatshield-sheet-metal-02",
    tags: ["exhaust", "figurative"],
    request: rq(
      "Buzzing under the car at stoplights, sounds like a piece of loose sheet metal vibrating.",
      ["idle"]
    ),
    expect: { top1: ["exhaust-heat-shield"] },
  },
  {
    id: "manifold-tick-cold-smell-01",
    tags: ["exhaust", "clear"],
    request: rq(
      "Rapid ticking on cold start that gets quieter as the engine warms up, and I catch an exhaust smell in the engine bay.",
      ["cold_start"]
    ),
    expect: { top1: ["exhaust-manifold-leak"] },
  },

  /* ------------------------------- Cooling ------------------------------- */
  {
    id: "coolant-hiss-sweet-smell-01",
    tags: ["cooling", "clear"],
    request: rq(
      "Hissing after I shut off a hot engine and a sweet syrupy smell, the coolant level keeps dropping.",
      ["idle"]
    ),
    expect: { top1: ["coolant-leak-water-pump"] },
  },
  {
    id: "coolant-puddle-whine-02",
    tags: ["cooling", "clear", "red-flag"],
    request: rq(
      "A grinding whine from the front of the engine and a small pink puddle under the car in the mornings.",
      ["idle"]
    ),
    expect: {
      top1: ["coolant-leak-water-pump"],
      redFlagIds: ["heavy-fluid-leak"],
      safeToDrive: "caution",
    },
  },

  /* ----------------------------- Electrical ------------------------------ */
  {
    id: "alternator-whine-rpm-lights-01",
    tags: ["electrical", "clear"],
    request: rq(
      "High whine that rises and falls exactly with engine RPM, and it changes when I turn the headlights on.",
      ["idle", "acceleration"]
    ),
    expect: { top1: ["alternator-bearing-whine"] },
  },
  {
    id: "alternator-named-load-02",
    tags: ["electrical", "clear"],
    request: rq(
      "A whine from the alternator area that gets louder when revving, and changes with the AC and rear defroster on.",
      ["idle"]
    ),
    expect: { top1: ["alternator-bearing-whine"] },
  },
  {
    id: "starter-grind-key-01",
    tags: ["electrical", "clear"],
    request: rq(
      "Loud grinding whir just when I turn the key to start it, but the engine runs fine once it catches.",
      ["cold_start"]
    ),
    expect: { top1: ["starter-issue"] },
  },
  {
    id: "starter-single-click-02",
    tags: ["electrical", "clear"],
    request: rq(
      "A single loud click when I turn the key and nothing happens, then it usually starts on the second try.",
      ["cold_start"]
    ),
    expect: { top1: ["starter-issue"] },
  },
];
