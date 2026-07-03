import type { EvalCase } from "../types";
import { rq } from "../helpers";

/**
 * Underspecified inputs. The right answer is honesty: low confidence, a
 * weak-input note, and no overconfident specific diagnosis — not a guess.
 */
export const VAGUE_CASES: EvalCase[] = [
  {
    id: "vague-something-off-01",
    tags: ["vague"],
    request: rq(
      "Something sounds off about my car lately, it is hard to describe.",
      ["other"]
    ),
    expect: { lowConfidenceNote: true, maxTopConfidence: 45 },
  },
  {
    id: "vague-comes-and-goes-02",
    tags: ["vague"],
    request: rq(
      "There is a noise when I drive, it comes and goes without a pattern.",
      ["other"]
    ),
    expect: { lowConfidenceNote: true, maxTopConfidence: 45 },
  },
  {
    id: "vague-weird-sometimes-03",
    tags: ["vague"],
    request: rq("My car makes a weird sound sometimes when driving around.", [
      "low_speed",
    ]),
    expect: { lowConfidenceNote: true, maxTopConfidence: 45 },
  },
  {
    id: "vague-front-somewhere-04",
    tags: ["vague"],
    request: rq("A noise coming from the front somewhere, not sure what kind.", [
      "other",
    ]),
    expect: { lowConfidenceNote: true, maxTopConfidence: 45 },
  },
  {
    id: "vague-not-right-05",
    tags: ["vague"],
    request: rq(
      "It just does not sound right when I am driving around town lately.",
      ["low_speed"]
    ),
    expect: { lowConfidenceNote: true, maxTopConfidence: 45 },
  },
  {
    id: "vague-intermittent-06",
    tags: ["vague"],
    request: rq(
      "A weird intermittent noise, I cannot tell where it is coming from.",
      ["other"]
    ),
    expect: { lowConfidenceNote: true, maxTopConfidence: 45 },
  },
  {
    id: "vague-commute-07",
    tags: ["vague"],
    request: rq(
      "The car sounds different than it used to on my commute, nothing specific.",
      ["highway_speed"]
    ),
    expect: { lowConfidenceNote: true, maxTopConfidence: 45 },
  },
  {
    id: "vague-noise-word-only-08",
    tags: ["vague"],
    request: rq(
      "There is a faint noise, maybe a slight hum, but honestly it might be nothing.",
      ["other"]
    ),
    // A single weak sound word: a specific guess is fine but must stay humble.
    expect: { maxTopConfidence: 55 },
  },
  {
    id: "vague-passenger-heard-09",
    tags: ["vague"],
    request: rq(
      "My passenger heard something odd from her side yesterday but I could not hear it myself.",
      ["other"]
    ),
    expect: { lowConfidenceNote: true, maxTopConfidence: 45 },
  },
  {
    id: "vague-after-wash-10",
    tags: ["vague"],
    request: rq(
      "Ever since the car wash the car seems louder inside than before somehow.",
      ["highway_speed"]
    ),
    expect: { lowConfidenceNote: true, maxTopConfidence: 45 },
  },
];
