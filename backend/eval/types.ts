import type { DiagnoseRequest, SafeToDrive } from "../src/schemas";
import type { InterpretedSignals } from "../src/ai/interpret";

/**
 * Golden-corpus evaluation case.
 *
 * A case is a full DiagnoseRequest plus what a competent mechanic would call
 * the right triage answer. The corpus is the definition of "accurate" for
 * this engine: weight changes are only accepted when they hold or raise the
 * benchmark (see tests/benchmark.test.ts).
 *
 * Some cases intentionally FAIL on the current engine (tagged "headroom-*").
 * They pin desired behavior for upcoming work (negation handling, new
 * knowledge-base entries) and make progress measurable, not aspirational.
 */
export interface EvalExpectation {
  /** Acceptable top-1 issue ids (any of these counts as a hit). */
  top1?: string[];
  /** Ids that must ALL appear somewhere in the top 3. */
  top3MustInclude?: string[];
  /** Ids that must NOT appear anywhere in the ranked causes. */
  mustNotRank?: string[];
  /** Red-flag ids that must be present (subset match). */
  redFlagIds?: string[];
  /** Red-flag ids that must NOT be present. */
  forbidRedFlagIds?: string[];
  /** Exact overall safe-to-drive verdict, when the case pins one. */
  safeToDrive?: SafeToDrive;
  minTopConfidence?: number;
  maxTopConfidence?: number;
  /** Expect the engine to flag the input as weak (inputQuality.note set). */
  lowConfidenceNote?: boolean;
}

export interface EvalCase {
  /** Unique, stable, kebab-case (e.g. "cv-click-driveway-01"). */
  id: string;
  /**
   * Tags for the per-tag breakdown. Conventions:
   *   category tags: "drivetrain", "brakes", ...
   *   input tags:    "clear", "figurative", "vague", "negation", "audio"
   *   safety tags:   "red-flag"
   *   engine tags:   "ev", "hybrid", "diesel"
   *   headroom tags: "headroom-negation", "headroom-kb" (expected to fail
   *                  until the matching phase lands — excluded from floors)
   */
  tags: string[];
  request: DiagnoseRequest;
  /** Optional canned AI interpretation to exercise the AI-on scoring path. */
  interpreted?: InterpretedSignals | null;
  expect: EvalExpectation;
}
