import type { EvalCase } from "../types";
import { rq, veh } from "../helpers";

/**
 * Engine-type awareness: EVs have no belts, pumps, or combustion; diesels
 * clatter by design. Cases tagged "headroom-kb" pin behavior that needs
 * knowledge-base entries that don't exist yet (EV-specific noises).
 */
export const ENGINE_TYPE_CASES: EvalCase[] = [
  {
    id: "ev-morning-squeal-01",
    tags: ["ev", "brakes"],
    request: rq(
      "A loud squealing sound when I start driving in the morning, fades after a few stops.",
      ["cold_start", "low_speed"],
      { vehicle: veh("Tesla", "Model 3", 2022, 40_000, "electric") }
    ),
    // Surface-rusted rotors squealing on the first stops is the classic
    // EV morning squeal; combustion-only causes must not appear.
    expect: {
      top1: ["brake-pads-worn"],
      mustNotRank: [
        "serpentine-belt-squeal",
        "power-steering-whine",
        "engine-knock-detonation",
      ],
    },
  },
  {
    id: "ev-whine-speed-02",
    tags: ["ev", "drivetrain", "headroom-kb"],
    request: rq(
      "A high pitched whine that rises with speed when accelerating hard.",
      ["acceleration", "highway_speed"],
      { vehicle: veh("Tesla", "Model Y", 2021, 60_000, "electric") }
    ),
    // Today the closest KB answer is the transmission entry; once EV
    // reduction-gear whine exists it becomes the expected top-1.
    expect: {
      top1: ["transmission-whine"],
      mustNotRank: ["alternator-bearing-whine", "power-steering-whine"],
    },
  },
  {
    id: "ev-hiss-idle-03",
    tags: ["ev", "headroom-kb"],
    request: rq(
      "A soft hissing hum from the front of the car while parked and switched on.",
      ["idle"],
      { vehicle: veh("Hyundai", "Ioniq 5", 2023, 25_000, "electric") }
    ),
    // Vacuum and coolant-pump entries are combustion-only; battery-cooling
    // entries arrive with the KB expansion.
    expect: {
      mustNotRank: ["vacuum-leak", "coolant-leak-water-pump"],
    },
  },
  {
    id: "ev-rattle-bumps-04",
    tags: ["ev", "suspension"],
    request: rq(
      "Metallic rattle from the front over potholes, quiet on smooth pavement.",
      ["over_bumps"],
      { vehicle: veh("Nissan", "Leaf", 2019, 70_000, "electric") }
    ),
    expect: { top1: ["sway-bar-links"] },
  },
  {
    id: "hybrid-cv-click-05",
    tags: ["hybrid", "drivetrain"],
    request: rq(
      "Clicking from the front wheels when turning out of parking spots at low speed.",
      ["low_speed_turning"],
      { vehicle: veh("Toyota", "Prius", 2015, 110_000, "hybrid") }
    ),
    expect: { top1: ["cv-axle-wear"] },
  },
  {
    id: "diesel-belt-squeal-06",
    tags: ["diesel", "belts"],
    request: rq(
      "Loud squeal on cold start in the rain, goes away after a minute of driving.",
      ["cold_start"],
      { vehicle: veh("Ford", "F-250", 2016, 150_000, "diesel") }
    ),
    expect: { top1: ["serpentine-belt-squeal"] },
  },
  {
    id: "diesel-damped-knock-07",
    tags: ["diesel", "engine"],
    request: rq(
      "A knocking clatter under acceleration, though honestly it has always clattered a bit.",
      ["acceleration"],
      { vehicle: veh("Ram", "2500", 2018, 120_000, "diesel") }
    ),
    // Detonation is weak evidence on a diesel (score halved); it must not
    // dominate the ranking with high confidence.
    expect: { maxTopConfidence: 60 },
  },
];
