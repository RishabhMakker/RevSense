import type { EvalCase } from "../types";
import { rq, veh } from "../helpers";

/** Cases for the A4 engine/turbo/fuel/HVAC/benign knowledge-base expansion. */
export const EXPANSION_MISC_CASES: EvalCase[] = [
  /* --------------------------- Turbo / air ---------------------------- */
  {
    id: "turbo-siren-boost-01",
    tags: ["engine", "clear"],
    request: rq(
      "A loud siren whine when the turbo spools under acceleration, and some smoke on startup lately.",
      ["acceleration"],
      { vehicle: veh("Subaru", "WRX", 2016, 110_000) }
    ),
    expect: { top1: ["turbo-bearing-whine"] },
  },
  {
    id: "wastegate-flutter-liftoff-01",
    tags: ["engine", "clear"],
    request: rq(
      "A fluttering wa-wa-wa sound right when I let off the gas after accelerating hard. Turbo car, drives fine.",
      ["acceleration"],
      { vehicle: veh("Volkswagen", "GTI", 2018, 70_000) }
    ),
    expect: { top1: ["wastegate-flutter"] },
  },
  {
    id: "boost-leak-power-01",
    tags: ["engine", "clear"],
    request: rq(
      "A loud whoosh hiss when accelerating and the car loses power when accelerating, check engine light is on.",
      ["acceleration"],
      { vehicle: veh("Ford", "F-150", 2017, 90_000) }
    ),
    expect: { top1: ["boost-intake-leak"] },
  },

  /* ------------------------------ Engine ------------------------------ */
  {
    id: "timing-chain-startup-01",
    tags: ["engine", "clear"],
    request: rq(
      "A chain rattle for the first few seconds on startup every cold morning, then it goes quiet.",
      ["cold_start"]
    ),
    expect: { top1: ["timing-chain-rattle"] },
  },
  {
    id: "vvt-phaser-codes-01",
    tags: ["engine", "clear"],
    request: rq(
      "A rattle from the top of the engine at idle and cold start, and the check engine light shows cam timing codes.",
      ["cold_start", "idle"],
      { vehicle: veh("Ford", "F-150", 2013, 140_000) }
    ),
    expect: { top1: ["vvt-phaser-rattle"] },
  },
  {
    id: "flexplate-gear-knock-01",
    tags: ["engine", "clear"],
    request: rq(
      "A metallic knock at idle in gear that changes in Park at the same revs, seems to come from the bellhousing area.",
      ["idle"]
    ),
    expect: { top1: ["flexplate-crack"] },
  },
  {
    id: "piston-slap-cold-01",
    tags: ["engine", "clear"],
    request: rq(
      "A hollow knock when cold that quiets when warm, oil pressure is fine and it has done this for months.",
      ["cold_start"]
    ),
    expect: { top1: ["piston-slap"] },
  },
  {
    id: "injector-tick-normal-01",
    tags: ["engine", "clear", "benign"],
    request: rq(
      "An even rhythmic ticking from the engine bay at idle, direct injection engine, runs perfectly smooth.",
      ["idle"],
      { vehicle: veh("Kia", "Sorento", 2020, 45_000) }
    ),
    expect: { top1: ["injector-tick"] },
  },

  /* ------------------------------- Fuel -------------------------------- */
  {
    id: "fuel-pump-rear-whine-01",
    tags: ["fuel_air", "clear"],
    request: rq(
      "A loud whine from under the rear seat that gets worse when the tank is low, and it hesitates at highway speed.",
      ["highway_speed", "idle"]
    ),
    expect: { top1: ["fuel-pump-whine"] },
  },
  {
    id: "fuel-prime-keyon-01",
    tags: ["fuel_air", "clear", "benign"],
    request: rq(
      "A two second hum from the back every time I turn the key on before I start it, then it stops.",
      ["cold_start"]
    ),
    expect: { top1: ["fuel-pump-prime-whine"] },
  },

  /* ------------------------------- HVAC -------------------------------- */
  {
    id: "ac-compressor-toggle-01",
    tags: ["hvac", "clear"],
    request: rq(
      "A growling rattle that starts the second I turn the AC on and stops with the AC off.",
      ["idle"]
    ),
    expect: { top1: ["ac-compressor-noise"] },
  },
  {
    id: "blower-fan-speed-01",
    tags: ["hvac", "clear"],
    request: rq(
      "A squealing flutter from behind the dash that changes with fan speed, even with the engine off.",
      ["idle"]
    ),
    expect: { top1: ["blower-motor-noise"] },
  },
  {
    id: "refrigerant-hiss-shutoff-01",
    tags: ["hvac", "clear", "benign"],
    request: rq(
      "A soft hiss from the dash for a minute after I turn the car off, mostly after using the air conditioning.",
      ["idle"]
    ),
    expect: { top1: ["refrigerant-hiss-benign"] },
  },
  {
    id: "blend-door-clicks-01",
    tags: ["hvac", "clear", "benign"],
    request: rq(
      "Repeated clicking from behind the dash when I change the temperature, and one side blows colder than the other.",
      ["idle"]
    ),
    expect: { top1: ["blend-door-click"] },
  },

  /* ------------------------- Brakes / benign --------------------------- */
  {
    id: "abs-selftest-once-01",
    tags: ["brakes", "clear", "benign"],
    request: rq(
      "A short groaning buzz from under the hood the first time I pull away every morning, once per drive, no warning lights.",
      ["low_speed", "cold_start"]
    ),
    expect: { top1: ["abs-selftest-buzz"] },
  },
  {
    id: "booster-hiss-pedal-01",
    tags: ["brakes", "clear"],
    request: rq(
      "A constant hiss from behind the brake pedal when I press and hold it, and the pedal feels harder than before.",
      ["braking", "idle"]
    ),
    expect: { top1: ["brake-booster-hiss"] },
  },
  {
    id: "regen-groan-ev-01",
    tags: ["ev", "brakes", "clear", "benign"],
    request: rq(
      "A soft groan as the car slows itself down when I let off, right before coming to a stop. It has always done it.",
      ["braking", "low_speed"],
      { vehicle: veh("Tesla", "Model Y", 2022, 30_000, "electric") }
    ),
    expect: { top1: ["regen-braking-groan"] },
  },

  /* ------------------------------ Exhaust ------------------------------ */
  {
    id: "exhaust-hanger-swing-01",
    tags: ["exhaust", "clear"],
    request: rq(
      "The muffler knocks against the underbody over bumps, and the tailpipe visibly swings if I push it.",
      ["over_bumps"]
    ),
    expect: { top1: ["exhaust-hanger-clunk"] },
  },
  {
    id: "cat-rocks-in-can-01",
    tags: ["exhaust", "clear", "figurative"],
    request: rq(
      "Sounds like rocks in a can from under the car at idle, and I can hear a rattle inside the muffler when I tap it.",
      ["idle"]
    ),
    expect: { top1: ["cat-rattle-internal"] },
  },
  {
    id: "exhaust-cooling-tick-01",
    tags: ["exhaust", "clear", "benign"],
    request: rq(
      "An uneven ticking from under the car for a few minutes after I park, fades away as it sits.",
      ["idle"]
    ),
    expect: { top1: ["exhaust-cooling-tick"] },
  },

  /* ----------------------------- EV misc ------------------------------- */
  {
    id: "ev-charging-fan-01",
    tags: ["ev", "cooling", "clear", "benign"],
    request: rq(
      "A humming fan noise from the front while the car is charging in the garage, even with everything off.",
      ["idle"],
      { vehicle: veh("Hyundai", "Ioniq 5", 2023, 20_000, "electric") }
    ),
    expect: { top1: ["ev-cooling-pump-hum"] },
  },
  {
    id: "ev-inverter-normal-01",
    tags: ["ev", "electrical", "clear", "benign"],
    request: rq(
      "The usual sci-fi electric whine when accelerating gently, same as it has always sounded since new.",
      ["acceleration", "low_speed"],
      { vehicle: veh("Nissan", "Leaf", 2021, 35_000, "electric") }
    ),
    expect: { top1: ["ev-inverter-whine"] },
  },

  /* --------------------------- Wheels/tires ---------------------------- */
  {
    id: "flat-spot-storage-01",
    tags: ["wheels_tires", "clear"],
    request: rq(
      "The car sat for six weeks and now there is a rhythmic thump thump that rises with speed, seems to smooth out after twenty minutes.",
      ["low_speed", "highway_speed"]
    ),
    expect: { top1: ["flat-spot-tires"] },
  },
];
