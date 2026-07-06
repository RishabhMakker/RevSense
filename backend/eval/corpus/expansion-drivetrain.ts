import type { EvalCase } from "../types";
import { rq, veh } from "../helpers";

/** Cases for the A4 drivetrain/transmission knowledge-base expansion. */
export const EXPANSION_DRIVETRAIN_CASES: EvalCase[] = [
  {
    id: "trans-slip-flare-01",
    tags: ["drivetrain", "clear"],
    request: rq(
      "The revs flare up between gears without the truck pulling any harder, and shifts feel delayed and soft.",
      ["acceleration"]
    ),
    expect: { top1: ["transmission-slipping"] },
  },
  {
    id: "trans-slip-hum-uphill-02",
    tags: ["drivetrain", "clear"],
    request: rq(
      "Going up hills the RPM jumps and there is a hum while it slips, transmission fluid looked dark.",
      ["acceleration", "highway_speed"]
    ),
    expect: { top1: ["transmission-slipping"] },
  },
  {
    id: "tc-shudder-rumble-strips-01",
    tags: ["drivetrain", "clear", "figurative"],
    request: rq(
      "Around 45 mph at light throttle it shudders like driving over rumble strips for a second, then smooths out.",
      ["highway_speed"]
    ),
    expect: { top1: ["torque-converter-shudder"] },
  },
  {
    id: "tc-whine-in-drive-01",
    tags: ["drivetrain", "clear"],
    request: rq(
      "A whine in Drive while holding the brake at a light that goes away when I shift to Park.",
      ["idle"]
    ),
    expect: { top1: ["torque-converter-whine"] },
  },
  {
    id: "throwout-clutch-pedal-01",
    tags: ["drivetrain", "clear"],
    request: rq(
      "A chirping whir the moment I press the clutch pedal in, silent again when I let it out. Manual transmission.",
      ["idle"]
    ),
    expect: { top1: ["throwout-bearing-chirp"] },
  },
  {
    id: "clutch-judder-takeoff-01",
    tags: ["drivetrain", "clear"],
    request: rq(
      "The whole car judders and shakes when pulling away from a stop in first gear, worst on uphill starts.",
      ["acceleration", "low_speed"]
    ),
    expect: { top1: ["clutch-judder"] },
  },
  {
    id: "dmf-clutch-in-quiet-01",
    tags: ["drivetrain", "clear"],
    request: rq(
      "A rattle at idle in neutral that completely goes away when I press the clutch in.",
      ["idle"]
    ),
    expect: { top1: ["dmf-rattle"] },
  },
  {
    id: "diff-whine-coast-01",
    tags: ["drivetrain", "clear"],
    request: rq(
      "A whine from the rear axle that rises with road speed, loudest when coasting and quieter under power.",
      ["highway_speed"],
      { vehicle: veh("Chevrolet", "Silverado", 2013, 160_000) }
    ),
    expect: { top1: ["diff-gear-whine"] },
  },
  {
    id: "diff-clunk-throttle-01",
    tags: ["drivetrain", "clear"],
    request: rq(
      "One clunk from the rear end every time I let off the gas or get back on it.",
      ["acceleration"],
      { vehicle: veh("Ford", "Mustang", 2012, 130_000) }
    ),
    // Throttle-reversal lash lives in the diff, axles, OR driveshaft joints —
    // either driveline answer is correct triage.
    expect: { top1: ["diff-clunk-lash", "driveline-u-joint"] },
  },
  {
    id: "ev-reduction-gear-02",
    tags: ["ev", "drivetrain", "clear"],
    request: rq(
      "A whine from the drive unit that rises with speed whether I'm accelerating or regenerating.",
      ["acceleration", "highway_speed"],
      { vehicle: veh("Tesla", "Model 3", 2020, 95_000, "electric") }
    ),
    expect: { top1: ["ev-reduction-gear-whine"] },
  },
  {
    id: "hybrid-engine-kick-01",
    tags: ["hybrid", "drivetrain", "clear"],
    request: rq(
      "A clunk and shudder every time the gas engine kicks in while driving, smooth in EV mode.",
      ["acceleration", "low_speed"],
      { vehicle: veh("Toyota", "Prius", 2014, 150_000, "hybrid") }
    ),
    expect: { top1: ["hybrid-engagement-clunk"] },
  },
];
