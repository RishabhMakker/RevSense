import type { EvalCase } from "../types";
import { rq } from "../helpers";

export const STEERING_SUSPENSION_CASES: EvalCase[] = [
  /* ------------------------------ Steering ------------------------------ */
  {
    id: "column-click-parked-01",
    tags: ["steering", "clear"],
    request: rq(
      "I feel a click through the steering wheel when turning, even while parked in the garage with the car stationary.",
      ["low_speed_turning"]
    ),
    expect: { top1: ["steering-shaft-column"] },
  },
  {
    id: "column-clunk-rocking-02",
    // headroom-scoring: needs negative evidence on cv-axle-wear for
    // stationary wording ("at a standstill") — lands in A2.
    tags: ["steering", "clear", "headroom-scoring"],
    request: rq(
      "A clunk in the steering column when I rock the wheel back and forth at a standstill.",
      ["turning_left", "turning_right"]
    ),
    expect: { top1: ["steering-shaft-column"] },
  },
  {
    id: "ps-whine-full-lock-01",
    tags: ["steering", "clear"],
    request: rq(
      "A whining groan when turning the wheel to full lock, much worse on cold mornings.",
      ["low_speed_turning", "cold_start"]
    ),
    expect: { top1: ["power-steering-whine"] },
  },
  {
    id: "ps-whine-heavy-steering-02",
    tags: ["steering", "clear"],
    request: rq(
      "Heavy steering effort and a whine from the engine bay whenever I turn the wheel at parking speed.",
      ["low_speed_turning"]
    ),
    expect: { top1: ["power-steering-whine"] },
  },
  {
    id: "rack-knock-play-01",
    tags: ["steering", "clear"],
    request: rq(
      "There is play in the wheel and a knocking from the front over rough roads, the car wanders a bit on the highway.",
      ["over_bumps"]
    ),
    expect: { top1: ["steering-rack-knock"] },
  },
  {
    id: "rack-tie-rod-sawing-02",
    // headroom-scoring: "at a stop" should count against CV-joint wear
    // (needs wheel rotation) — negative evidence lands in A2.
    tags: ["steering", "clear", "headroom-scoring"],
    request: rq(
      "Clunks from the front when sawing the steering wheel back and forth at a stop, a friend mentioned tie rod ends.",
      ["turning_left", "turning_right"]
    ),
    expect: { top1: ["steering-rack-knock"] },
  },

  /* ----------------------------- Suspension ----------------------------- */
  {
    id: "strut-pop-parking-turn-01",
    tags: ["suspension", "clear"],
    request: rq(
      "A popping when turning at parking speed, feels like it comes from the top of the front strut area.",
      ["low_speed_turning"]
    ),
    expect: { top1: ["strut-mount"] },
  },
  {
    id: "strut-creak-speed-bumps-02",
    tags: ["suspension", "clear"],
    request: rq(
      "Creaking and clunking from the top of the front struts when going over speed bumps.",
      ["over_bumps"]
    ),
    expect: { top1: ["strut-mount"] },
  },
  {
    id: "sway-rattle-potholes-01",
    tags: ["suspension", "clear"],
    request: rq(
      "Metallic rattling from the front end over potholes and broken pavement, completely quiet on smooth roads.",
      ["over_bumps"]
    ),
    expect: { top1: ["sway-bar-links"] },
  },
  {
    id: "sway-clunk-driveway-02",
    tags: ["suspension", "clear"],
    request: rq(
      "Clunking over small bumps and driveway entrances, disappears once I am on the highway.",
      ["over_bumps", "low_speed"]
    ),
    expect: { top1: ["sway-bar-links"] },
  },
  {
    id: "bushings-dull-thud-01",
    tags: ["suspension", "clear"],
    request: rq(
      "A dull thud from the front over bumps and a clunk when braking gently.",
      ["over_bumps", "braking"]
    ),
    expect: { top1: ["control-arm-bushings"] },
  },
  {
    id: "balljoint-door-hinge-01",
    tags: ["suspension", "figurative"],
    request: rq(
      "A creaking groaning noise like an old door hinge from the front wheel area over every bump.",
      ["over_bumps"]
    ),
    expect: { top1: ["ball-joint-wear"] },
  },
  {
    id: "balljoint-named-02",
    tags: ["suspension", "clear"],
    request: rq(
      "It creaks over bumps and clunks when turning into driveways, a mechanic friend said to check the ball joints.",
      ["over_bumps", "low_speed_turning"]
    ),
    expect: { top1: ["ball-joint-wear"] },
  },
];
