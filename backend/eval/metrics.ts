import { diagnose } from "../src/engine";
import type { DiagnosisResult } from "../src/schemas";
import type { EvalCase } from "./types";

export interface CaseOutcome {
  evalCase: EvalCase;
  result: DiagnosisResult;
  /** null when the case doesn't pin a top-1 expectation. */
  top1Hit: boolean | null;
  /** Whether an acceptable top-1 id landed anywhere in the top 3 (null as above). */
  top3Hit: boolean | null;
  /** 1/rank of the first acceptable id among ranked causes; 0 when absent. */
  reciprocalRank: number | null;
  /** Human-readable failed constraints (empty = case fully passed). */
  violations: string[];
  /** Violations of red-flag/safety expectations specifically. */
  safetyViolations: string[];
}

export function evaluateCase(evalCase: EvalCase): CaseOutcome {
  const result = diagnose(evalCase.request, evalCase.interpreted ?? null);
  const e = evalCase.expect;
  const rankedIds = result.causes.map((c) => c.id);
  const top3Ids = rankedIds.slice(0, 3);
  const flags = new Set(result.redFlags.map((f) => f.id));
  const violations: string[] = [];
  const safetyViolations: string[] = [];

  let top1Hit: boolean | null = null;
  let top3Hit: boolean | null = null;
  let reciprocalRank: number | null = null;
  if (e.top1 && e.top1.length > 0) {
    top1Hit = e.top1.includes(rankedIds[0] ?? "");
    top3Hit = top3Ids.some((id) => e.top1!.includes(id));
    const rank = rankedIds.findIndex((id) => e.top1!.includes(id));
    reciprocalRank = rank === -1 ? 0 : 1 / (rank + 1);
    if (!top1Hit) {
      violations.push(
        `top1: expected ${e.top1.join("|")}, got ${rankedIds[0] ?? "(none)"}`
      );
    }
  }

  for (const id of e.top3MustInclude ?? []) {
    if (!top3Ids.includes(id)) {
      violations.push(`top3MustInclude: ${id} not in [${top3Ids.join(", ")}]`);
    }
  }
  for (const id of e.mustNotRank ?? []) {
    if (rankedIds.includes(id)) {
      violations.push(`mustNotRank: ${id} ranked #${rankedIds.indexOf(id) + 1}`);
    }
  }
  for (const id of e.redFlagIds ?? []) {
    if (!flags.has(id)) {
      const v = `redFlag missing: ${id}`;
      violations.push(v);
      safetyViolations.push(v);
    }
  }
  for (const id of e.forbidRedFlagIds ?? []) {
    if (flags.has(id)) {
      const v = `forbidden redFlag fired: ${id}`;
      violations.push(v);
      safetyViolations.push(v);
    }
  }
  if (e.safeToDrive && result.overall.safeToDrive !== e.safeToDrive) {
    const v = `safeToDrive: expected ${e.safeToDrive}, got ${result.overall.safeToDrive}`;
    violations.push(v);
    safetyViolations.push(v);
  }
  const topConfidence = result.causes[0]?.confidence ?? 0;
  if (e.minTopConfidence !== undefined && topConfidence < e.minTopConfidence) {
    violations.push(
      `minTopConfidence: expected >=${e.minTopConfidence}, got ${topConfidence}`
    );
  }
  if (e.maxTopConfidence !== undefined && topConfidence > e.maxTopConfidence) {
    violations.push(
      `maxTopConfidence: expected <=${e.maxTopConfidence}, got ${topConfidence}`
    );
  }
  if (e.lowConfidenceNote !== undefined) {
    const hasNote = Boolean(result.inputQuality.note);
    if (hasNote !== e.lowConfidenceNote) {
      violations.push(
        `lowConfidenceNote: expected ${e.lowConfidenceNote}, got ${hasNote}`
      );
    }
  }

  return {
    evalCase,
    result,
    top1Hit,
    top3Hit,
    reciprocalRank,
    violations,
    safetyViolations,
  };
}

export interface TagStats {
  cases: number;
  top1Hits: number;
  top1Total: number;
  violationCases: number;
}

export interface Summary {
  cases: number;
  top1: { hits: number; total: number; pct: number };
  top3: { hits: number; total: number; pct: number };
  /** Mean reciprocal rank over cases with a top-1 expectation. */
  mrr: number;
  /** Cases with at least one failed constraint. */
  violationCases: number;
  safetyViolationCases: number;
  /** Median top-cause confidence over cases that pin a top-1 — the anchor
   *  for re-fitting the confidence curve constant after weight changes. */
  medianTopConfidence: number;
  perTag: Record<string, TagStats>;
}

const pct = (hits: number, total: number) =>
  total === 0 ? 100 : Math.round((1000 * hits) / total) / 10;

export function summarize(outcomes: CaseOutcome[]): Summary {
  let top1Hits = 0;
  let top1Total = 0;
  let top3Hits = 0;
  let rrSum = 0;
  let violationCases = 0;
  let safetyViolationCases = 0;
  const topConfidences: number[] = [];
  const perTag: Record<string, TagStats> = {};

  for (const o of outcomes) {
    if (o.top1Hit !== null) {
      top1Total += 1;
      if (o.top1Hit) top1Hits += 1;
      if (o.top3Hit) top3Hits += 1;
      rrSum += o.reciprocalRank ?? 0;
      topConfidences.push(o.result.causes[0]?.confidence ?? 0);
    }
    if (o.violations.length > 0) violationCases += 1;
    if (o.safetyViolations.length > 0) safetyViolationCases += 1;
    for (const tag of o.evalCase.tags) {
      const t = (perTag[tag] ??= {
        cases: 0,
        top1Hits: 0,
        top1Total: 0,
        violationCases: 0,
      });
      t.cases += 1;
      if (o.top1Hit !== null) {
        t.top1Total += 1;
        if (o.top1Hit) t.top1Hits += 1;
      }
      if (o.violations.length > 0) t.violationCases += 1;
    }
  }

  const sorted = [...topConfidences].sort((a, b) => a - b);
  const medianTopConfidence =
    sorted.length === 0 ? 0 : (sorted[Math.floor((sorted.length - 1) / 2)] ?? 0);

  return {
    cases: outcomes.length,
    top1: { hits: top1Hits, total: top1Total, pct: pct(top1Hits, top1Total) },
    top3: { hits: top3Hits, total: top1Total, pct: pct(top3Hits, top1Total) },
    mrr: top1Total === 0 ? 1 : Math.round((1000 * rrSum) / top1Total) / 1000,
    violationCases,
    safetyViolationCases,
    medianTopConfidence,
    perTag,
  };
}
