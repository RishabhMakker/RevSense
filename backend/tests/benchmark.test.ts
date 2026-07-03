import { afterAll, describe, expect, it } from "vitest";
import { CORPUS, isHeadroom } from "../eval/corpus/index";
import { evaluateCase, summarize, type CaseOutcome } from "../eval/metrics";
import { formatReport } from "../eval/report";

/**
 * Golden-corpus benchmark.
 *
 * FLOORS are the measured state of the engine, asserted so accuracy can only
 * ratchet upward: any change that drops a metric below its floor fails CI.
 * After a phase genuinely improves the engine, re-measure (npm run eval) and
 * RAISE the floors to the new numbers — never lower them to make a change fit.
 *
 * Headroom-tagged cases pin desired behavior for phases that haven't landed
 * (negation handling, KB expansion). They're reported for progress tracking
 * but excluded from the floor metrics.
 */
const FLOORS = {
  top1Pct: 100,
  top3Pct: 100,
  mrr: 1,
  maxViolationCases: 0,
};

const outcomes = CORPUS.map(evaluateCase);
const core = outcomes.filter((o) => !isHeadroom(o.evalCase));
const headroom = outcomes.filter((o) => isHeadroom(o.evalCase));
const coreSummary = summarize(core);
const headroomSummary = summarize(headroom);

describe("benchmark corpus", () => {
  it("has a healthy corpus size", () => {
    expect(CORPUS.length).toBeGreaterThanOrEqual(90);
  });

  it(`core top-1 accuracy >= ${FLOORS.top1Pct}%`, () => {
    expect(coreSummary.top1.pct).toBeGreaterThanOrEqual(FLOORS.top1Pct);
  });

  it(`core top-3 accuracy >= ${FLOORS.top3Pct}%`, () => {
    expect(coreSummary.top3.pct).toBeGreaterThanOrEqual(FLOORS.top3Pct);
  });

  it(`core MRR >= ${FLOORS.mrr}`, () => {
    expect(coreSummary.mrr).toBeGreaterThanOrEqual(FLOORS.mrr);
  });

  it(`core constraint violations <= ${FLOORS.maxViolationCases}`, () => {
    const failing = core.filter((o) => o.violations.length > 0);
    expect(
      failing.map((o) => ({ id: o.evalCase.id, violations: o.violations }))
    ).toHaveLength(FLOORS.maxViolationCases);
  });

  it("core safety expectations NEVER regress", () => {
    // Headroom cases may pin not-yet-implemented flag behavior (e.g. not
    // firing on explicitly negated phrases); core safety is non-negotiable.
    const safetyFailures = core
      .filter((o) => o.safetyViolations.length > 0)
      .map((o) => ({ id: o.evalCase.id, violations: o.safetyViolations }));
    expect(safetyFailures).toHaveLength(0);
  });
});

afterAll(() => {
  // Printed on every run so `npm run eval` doubles as the report command.
  console.log(formatReport("core", coreSummary, core));
  console.log(formatReport("headroom (expected gaps)", headroomSummary, headroom));
});
