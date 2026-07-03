import type { EvalCase } from "../types";
import { DRIVETRAIN_CASES } from "./drivetrain";
import { BRAKES_CASES } from "./brakes";
import { STEERING_SUSPENSION_CASES } from "./steering-suspension";
import { WHEELS_ENGINE_CASES } from "./wheels-engine";
import { BELTS_EXHAUST_ELECTRICAL_CASES } from "./belts-exhaust-electrical";
import { VAGUE_CASES } from "./vague";
import { NEGATION_CASES } from "./negation";
import { AUDIO_CASES } from "./audio";
import { RED_FLAG_CASES } from "./red-flags";
import { ENGINE_TYPE_CASES } from "./engine-types";

export const CORPUS: EvalCase[] = [
  ...DRIVETRAIN_CASES,
  ...BRAKES_CASES,
  ...STEERING_SUSPENSION_CASES,
  ...WHEELS_ENGINE_CASES,
  ...BELTS_EXHAUST_ELECTRICAL_CASES,
  ...VAGUE_CASES,
  ...NEGATION_CASES,
  ...AUDIO_CASES,
  ...RED_FLAG_CASES,
  ...ENGINE_TYPE_CASES,
];

// Fail loudly at import time on copy-paste id collisions.
{
  const seen = new Set<string>();
  for (const c of CORPUS) {
    if (seen.has(c.id)) throw new Error(`Duplicate eval case id: ${c.id}`);
    seen.add(c.id);
  }
}

/** Cases that pin desired-but-not-yet-implemented behavior. They appear in
 *  the report (progress tracking) but are excluded from CI floors. */
export const isHeadroom = (c: EvalCase): boolean =>
  c.tags.some((t) => t.startsWith("headroom-"));
