import { DRIVETRAIN_ISSUES } from "./drivetrain";
import { BRAKES_ISSUES } from "./brakes";
import { STEERING_ISSUES } from "./steering";
import { SUSPENSION_ISSUES } from "./suspension";
import { WHEELS_TIRES_ISSUES } from "./wheels-tires";
import { ENGINE_ISSUES } from "./engine";
import { BELTS_ISSUES } from "./belts";
import { EXHAUST_ISSUES } from "./exhaust";
import { COOLING_ISSUES } from "./cooling";
import { ELECTRICAL_ISSUES } from "./electrical";
import { FUEL_AIR_ISSUES } from "./fuel-air";
import { HVAC_ISSUES } from "./hvac";
import type { KnownIssue } from "./types";

export type { IssueSignals, KnownIssue } from "./types";

export const KNOWLEDGE_BASE: KnownIssue[] = [
  ...DRIVETRAIN_ISSUES,
  ...BRAKES_ISSUES,
  ...STEERING_ISSUES,
  ...SUSPENSION_ISSUES,
  ...WHEELS_TIRES_ISSUES,
  ...ENGINE_ISSUES,
  ...BELTS_ISSUES,
  ...EXHAUST_ISSUES,
  ...COOLING_ISSUES,
  ...ELECTRICAL_ISSUES,
  ...FUEL_AIR_ISSUES,
  ...HVAC_ISSUES,
];

// Fail loudly at import time on copy-paste id collisions.
{
  const seen = new Set<string>();
  for (const issue of KNOWLEDGE_BASE) {
    if (seen.has(issue.id)) throw new Error(`Duplicate issue id: ${issue.id}`);
    seen.add(issue.id);
  }
}

/** Number of known issues — imported by UI copy so it never drifts. */
export const KNOWN_ISSUE_COUNT = KNOWLEDGE_BASE.length;
