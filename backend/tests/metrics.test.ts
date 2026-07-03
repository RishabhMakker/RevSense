import { describe, expect, it } from "vitest";
import { evaluateCase, summarize } from "../eval/metrics";
import { rq } from "../eval/helpers";
import type { EvalCase } from "../eval/types";

const cvCase = (expect_: EvalCase["expect"]): EvalCase => ({
  id: "t",
  tags: ["t"],
  request: rq(
    "I hear a clicking or popping sound when turning the steering wheel at low speed.",
    ["low_speed_turning", "turning_right"]
  ),
  expect: expect_,
});

describe("eval metrics", () => {
  it("scores a top-1 hit with reciprocal rank 1", () => {
    const o = evaluateCase(cvCase({ top1: ["cv-axle-wear"] }));
    expect(o.top1Hit).toBe(true);
    expect(o.top3Hit).toBe(true);
    expect(o.reciprocalRank).toBe(1);
    expect(o.violations).toHaveLength(0);
  });

  it("scores a miss with the actual top id in the violation message", () => {
    const o = evaluateCase(cvCase({ top1: ["rod-knock"] }));
    expect(o.top1Hit).toBe(false);
    expect(o.violations[0]).toContain("expected rod-knock");
    expect(o.reciprocalRank).toBeLessThan(1);
  });

  it("flags mustNotRank and missing red flags as violations", () => {
    const o = evaluateCase(
      cvCase({
        mustNotRank: ["cv-axle-wear"],
        redFlagIds: ["smoke"],
      })
    );
    expect(o.violations.some((v) => v.startsWith("mustNotRank"))).toBe(true);
    expect(o.safetyViolations.some((v) => v.includes("smoke"))).toBe(true);
  });

  it("summarize computes MRR over pinned cases only", () => {
    const hit = evaluateCase(cvCase({ top1: ["cv-axle-wear"] }));
    const unpinned = evaluateCase(cvCase({ maxTopConfidence: 88 }));
    const s = summarize([hit, unpinned]);
    expect(s.top1.total).toBe(1);
    expect(s.mrr).toBe(1);
    expect(s.cases).toBe(2);
  });
});
