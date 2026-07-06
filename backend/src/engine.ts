import {
  AUDIO_HINT_LABELS,
  DISCLAIMER,
  ISSUE_CATEGORY_LABELS,
  REPAIR_DIFFICULTY_LABELS,
  SOUND_CONTEXT_LABELS,
  URGENCY_LABELS,
  type AudioFeatures,
  type AudioHint,
  type AudioSummary,
  type DiagnoseRequest,
  type DiagnosisOverall,
  type DiagnosisResult,
  type RankedCause,
  type RedFlag,
  type SafeToDrive,
  type Severity,
  type SoundContext,
  type Urgency,
} from "./schemas";
import { detectSounds, matchPhrases, normalizeText, type SoundMatch } from "./lexicon";
import { KNOWLEDGE_BASE, type KnownIssue } from "./knowledgeBase";
import { detectRedFlags } from "./redFlags";
import type { InterpretedSignals } from "./ai/interpret";
import {
  extractModifiers,
  type NoiseLocation,
  type RecentWorkArea,
  type SymptomModifiers,
} from "./modifiers";
import type { IssueCategory } from "./schemas";

/* ------------------------------------------------------------------ */
/* Scoring weights — tuned by the test suite in backend/tests          */
/* ------------------------------------------------------------------ */

const W = {
  soundMatch: 30,
  soundCap: 45,
  strongPhrase: 12,
  strongPhraseCap: 36,
  supportPhrase: 6,
  supportPhraseCap: 18,
  strongContext: 18,
  strongContextCap: 36,
  weakContext: 8,
  weakContextCap: 16,
  audioHint: 10,
  audioHintCap: 20,
  audioContradiction: -8,
  audioContradictionCap: -16,
  /** Recording evidence can never outweigh the typed story: net audio
   *  contribution is clamped to this band. */
  audioNetBound: 20,
  wearMileage: 8,
  wearAge: 6,
  baseRateScale: 8,
  negativePhrase: -15,
  negativePhraseCap: -30,
  excludedContext: -14,
  excludedContextCap: -28,
  // Structured symptom modifiers (speed/temperature/load/onset/location).
  signalMatch: 8,
  signalMatchCap: 24,
  signalContradiction: -10,
  signalContradictionCap: -20,
  negatedSound: -12,
  negatedSoundCap: -24,
  negatedContext: -14,
  negatedContextCap: -28,
  recentWork: 6,
} as const;

/* ------------------------------------------------------------------ */
/* Signal specificity — an IDF-style likelihood-ratio analogue          */
/*                                                                      */
/* A signal shared by many issues ("clunk") separates causes far less  */
/* than a rare one ("chirp"), so each hit is scaled by how few issues  */
/* list it. Precomputed from the KB at module load: fully deterministic */
/* and it keeps adapting as the knowledge base grows.                  */
/* ------------------------------------------------------------------ */

function countBy<T>(lists: readonly (readonly T[])[]): Map<T, number> {
  const df = new Map<T, number>();
  for (const list of lists) {
    for (const item of new Set(list)) df.set(item, (df.get(item) ?? 0) + 1);
  }
  return df;
}

/** Median document frequency of a map — the anchor where specificity = 1.0.
 *  Anchoring to the median (not the KB size) keeps the scale stable as the
 *  knowledge base grows: only a signal's rarity RELATIVE to its peers matters. */
function medianDf(df: Map<string, number>): number {
  const values = [...df.values()].sort((a, b) => a - b);
  return values[Math.floor((values.length - 1) / 2)] ?? 1;
}

function makeSpecificity(
  df: Map<string, number>
): (key: string) => number {
  const anchor = medianDf(df);
  return (key: string) => {
    const raw = 1 + Math.log2(anchor / Math.max(df.get(key) ?? 1, 1)) / 2;
    return Math.min(1.8, Math.max(0.6, raw));
  };
}

const SOUND_DF = countBy(KNOWLEDGE_BASE.map((i) => i.sounds));
const STRONG_CONTEXT_DF = countBy(KNOWLEDGE_BASE.map((i) => i.contexts.strong));
const HINT_DF = countBy(KNOWLEDGE_BASE.map((i) => i.audioHints));
const soundSpecificity = makeSpecificity(SOUND_DF);
const contextSpecificity = makeSpecificity(STRONG_CONTEXT_DF);
const hintSpecificity = makeSpecificity(HINT_DF);

const mean = (xs: number[]) =>
  xs.length === 0 ? 1 : xs.reduce((a, b) => a + b, 0) / xs.length;

/** Specificity threshold above which evidence copy may brag a little. */
const DISTINCTIVE_SPECIFICITY = 1.3;

/* ------------------------------------------------------------------ */
/* Structured symptom modifiers                                         */
/* ------------------------------------------------------------------ */

/** Merge deterministic extraction with optional AI enrichment. The AI may
 *  only FILL fields the regex pass left unknown and ADD to arrays — it can
 *  widen the reading, never narrow or override it. */
function mergeModifiers(
  det: SymptomModifiers,
  ai: InterpretedSignals | null | undefined
): SymptomModifiers {
  if (!ai) return det;
  const fill = <T extends string>(detValue: T, aiValue: T | undefined): T =>
    detValue !== "unknown" ? detValue : (aiValue ?? detValue);
  return {
    onset: fill(det.onset, ai.onset),
    frequency: fill(det.frequency, ai.frequency),
    speedDependence: fill(det.speedDependence, ai.speedDependence),
    temperature: fill(det.temperature, ai.temperature),
    load: fill(det.load, ai.load),
    location: fill(det.location, ai.location),
    recentWork: [...new Set([...det.recentWork, ...(ai.recentWork ?? [])])],
    negatedSoundTypes: [
      ...new Set([...det.negatedSoundTypes, ...(ai.negatedSoundTypes ?? [])]),
    ],
    negatedContexts: [
      ...new Set([...det.negatedContexts, ...(ai.negatedContexts ?? [])]),
    ],
  };
}

const RECENT_WORK_CATEGORY: Record<RecentWorkArea, IssueCategory> = {
  brakes: "brakes",
  tires_wheels: "wheels_tires",
  suspension: "suspension",
  engine: "engine",
  transmission_drivetrain: "drivetrain",
  exhaust: "exhaust",
  battery_electrical: "electrical",
  belts_accessories: "belts",
};

/** Coarse buckets a specific location implies (front_left → front + left). */
function coarseLocations(loc: NoiseLocation): Set<NoiseLocation> {
  const set = new Set<NoiseLocation>([loc]);
  if (loc.startsWith("front")) set.add("front");
  if (loc.startsWith("rear")) set.add("rear");
  if (loc.endsWith("left")) set.add("left");
  if (loc.endsWith("right")) set.add("right");
  return set;
}

/** Hints that can't honestly coexist as descriptions of the same noise.
 *  Used for contradiction scoring: when an issue's expected sound character
 *  is absent AND the recording shows a conflicting character, that recording
 *  argues against the issue. */
const HINT_CONFLICTS: Partial<Record<AudioHint, AudioHint[]>> = {
  high_pitched: ["low_rumble"],
  low_rumble: ["high_pitched"],
  tonal_whine: ["broadband_hiss", "irregular_knocking"],
  strong_harmonics: ["broadband_hiss", "irregular_knocking"],
  broadband_hiss: ["tonal_whine", "strong_harmonics"],
  rhythmic_ticking: ["irregular_knocking"],
  irregular_knocking: ["rhythmic_ticking", "tonal_whine", "strong_harmonics"],
};

const SIGNAL_MATCH_COPY: Record<string, string> = {
  speed_road: "The way it tracks road speed, not engine speed, fits this issue.",
  speed_rpm: "The way it tracks engine speed, not road speed, fits this issue.",
  temperature_cold: "Being worst when cold and fading as it warms is classic for this.",
  temperature_warm: "Showing up once everything is warmed up fits this issue.",
  load: "How it changes with load fits this issue.",
  onset: "The way it started matches how this issue usually appears.",
  location: "Where you hear it from fits where this issue lives.",
};

/**
 * Vehicle priors (per-model NHTSA complaint/recall density) modulate only the
 * base-rate prior: effectiveBaseRate = min(1, baseRate + boost). With
 * baseRateScale = 8 the maximum possible swing is +8 points — enough to break
 * ties between plausible causes, never enough to manufacture a top cause.
 */
const PRIORS = {
  /** categoryWeight 0..1 → up to this much base-rate boost. */
  weightScale: 0.35,
  /** Extra boost when the category has an open recall. */
  recallBoost: 0.25,
  /** Weight at which the boost is worth a plain-language evidence bullet. */
  evidenceThreshold: 0.5,
} as const;

const SEVERITY_RANK: Record<Severity, number> = {
  low: 0,
  moderate: 1,
  high: 2,
  critical: 3,
};
const URGENCY_RANK: Record<Urgency, number> = {
  monitor: 0,
  soon: 1,
  prompt: 2,
  immediate: 3,
};
const SAFETY_RANK: Record<SafeToDrive, number> = { yes: 0, caution: 1, no: 2 };

interface ScoredIssue {
  issue: KnownIssue;
  score: number;
  evidence: string[];
  hasDirectEvidence: boolean;
}

function listToProse(items: string[], conjunction = "and"): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, ${conjunction} ${items[items.length - 1]}`;
}

function scoreIssue(
  issue: KnownIssue,
  req: DiagnoseRequest,
  text: string,
  sounds: SoundMatch[],
  modifiers: SymptomModifiers
): ScoredIssue | null {
  const engineType = req.vehicle.engineType ?? "unknown";
  if (issue.notFor?.includes(engineType)) return null;

  let score = 0;
  const evidence: string[] = [];
  let hasDirectEvidence = false;

  // 1. Canonical sound-type matches (literal text matches + AI-inferred ones
  //    score identically; only the evidence wording differs so we never claim
  //    the user "described" a word they didn't type).
  const soundHits = sounds.filter((s) => issue.sounds.includes(s.type));
  if (soundHits.length > 0) {
    const soundSpec = mean(soundHits.map((s) => soundSpecificity(s.type)));
    score += Math.min(soundHits.length * W.soundMatch, W.soundCap) * soundSpec;
    hasDirectEvidence = true;
    const distinctive =
      soundSpec >= DISTINCTIVE_SPECIFICITY ? " Few other issues sound like this." : "";
    const literalHits = soundHits.filter((s) => !s.inferred);
    const inferredHits = soundHits.filter((s) => s.inferred);
    if (literalHits.length > 0) {
      const words = literalHits.map((s) => `"${s.matchedWord}"`);
      evidence.push(
        `You described ${listToProse(words)} — a signature sound for this issue.${distinctive}`
      );
    }
    if (inferredHits.length > 0) {
      const types = inferredHits.map((s) => `${s.type}-type`);
      evidence.push(
        `Your description reads as a ${listToProse(types)} sound — a signature sound for this issue.${distinctive}`
      );
    }
  }

  // 2. Phrase matches
  const strongHits = matchPhrases(text, issue.strongPhrases);
  if (strongHits.length > 0) {
    score += Math.min(strongHits.length * W.strongPhrase, W.strongPhraseCap);
    hasDirectEvidence = true;
    evidence.push(
      `Key details in your description (${listToProse(
        strongHits.map((p) => `"${p}"`)
      )}) point this way.`
    );
  }
  const supportHits = matchPhrases(text, issue.supportingPhrases);
  if (supportHits.length > 0) {
    score += Math.min(supportHits.length * W.supportPhrase, W.supportPhraseCap);
  }
  // Counter-evidence: phrases and contexts that argue AGAINST this cause.
  // Capped so a chatty description can't nuke a well-supported match, and
  // surfaced as a plain-language note so the demotion stays explainable.
  const counterEvidence: string[] = [];
  if (issue.negativePhrases) {
    const negHits = matchPhrases(text, issue.negativePhrases);
    if (negHits.length > 0) {
      score += Math.max(
        negHits.length * W.negativePhrase,
        W.negativePhraseCap
      );
      counterEvidence.push(
        `Some details in your description ("${negHits.join('", "')}") argue against this one.`
      );
    }
  }

  // 3. Context matches
  const strongCtx = req.contexts.filter((c) => issue.contexts.strong.includes(c));
  if (strongCtx.length > 0) {
    // A rare context is only extra-diagnostic when it CORROBORATES sound or
    // phrase evidence. On its own (vague text + a context checkbox) it stays
    // flat-weighted, so a rarely-listed context can't mint a confident guess.
    const corroborated = soundHits.length > 0 || strongHits.length > 0;
    const ctxSpec = corroborated
      ? mean(strongCtx.map((c) => contextSpecificity(c)))
      : 1;
    score +=
      Math.min(strongCtx.length * W.strongContext, W.strongContextCap) * ctxSpec;
    hasDirectEvidence = true;
    const labels = strongCtx.map((c) => SOUND_CONTEXT_LABELS[c].toLowerCase());
    evidence.push(
      `It happens during ${listToProse(labels)} — exactly when this issue typically makes itself heard.`
    );
  }
  const weakCtx = req.contexts.filter((c) => issue.contexts.weak.includes(c));
  if (weakCtx.length > 0) {
    score += Math.min(weakCtx.length * W.weakContext, W.weakContextCap);
  }
  const excludedCtx = req.contexts.filter((c) =>
    issue.contexts.exclude?.includes(c)
  );
  if (excludedCtx.length > 0) {
    score += Math.max(
      excludedCtx.length * W.excludedContext,
      W.excludedContextCap
    );
    const labels = excludedCtx.map((c) => SOUND_CONTEXT_LABELS[c].toLowerCase());
    counterEvidence.push(
      `It happening during ${listToProse(labels)} doesn't fit how this issue usually behaves.`
    );
  }

  // 4. Audio corroboration / contradiction (only when a recording/upload was
  //    analyzed and isn't too quiet to trust). Net contribution is clamped to
  //    ±audioNetBound so a bad phone recording never outweighs typed symptoms.
  if (req.audio && !req.audio.hints.includes("quiet_recording")) {
    const observed = req.audio.hints;
    const hintHits = observed.filter((h) => issue.audioHints.includes(h));
    let audioScore = 0;
    if (hintHits.length > 0) {
      const hintSpec = mean(hintHits.map((h) => hintSpecificity(h)));
      audioScore =
        Math.min(hintHits.length * W.audioHint, W.audioHintCap) * hintSpec;
      evidence.push(
        `What we picked up in your recording (${listToProse(
          hintHits.map((h) => AUDIO_HINT_LABELS[h].toLowerCase())
        )}) matches this issue.`
      );
    } else if (issue.audioHints.length > 0) {
      // None of the expected character was heard — does the recording show a
      // CONFLICTING character instead?
      const conflicts = issue.audioHints.filter((expected) =>
        (HINT_CONFLICTS[expected] ?? []).some((c) => observed.includes(c))
      );
      if (conflicts.length > 0) {
        audioScore = Math.max(
          conflicts.length * W.audioContradiction,
          W.audioContradictionCap
        );
        counterEvidence.push(
          "Your recording doesn't have the character this issue usually has."
        );
      }
    }
    score += Math.max(-W.audioNetBound, Math.min(W.audioNetBound, audioScore));
  }

  // 5. Vehicle wear profile
  const age = new Date().getFullYear() - req.vehicle.year;
  const mileage = req.vehicle.mileage ?? null;
  if (issue.wear) {
    if (
      issue.wear.mileageFrom !== undefined &&
      mileage !== null &&
      mileage >= issue.wear.mileageFrom
    ) {
      score += W.wearMileage;
      evidence.push(
        `At ${mileage.toLocaleString("en-US")} miles, this is a common wear point.`
      );
    } else if (issue.wear.ageFrom !== undefined && age >= issue.wear.ageFrom) {
      score += W.wearAge;
      evidence.push(
        `A ${age}-year-old vehicle is in the typical age range for this failure.`
      );
    }
  }

  // 5.5 Structured symptom modifiers vs. the issue's physical signals.
  //     Matches corroborate (+8 each, cap +24); contradictions between two
  //     KNOWN values subtract (−10 each, cap −20). "unknown" is always 0.
  if (issue.signals) {
    const sig = issue.signals;
    let matchPoints = 0;
    let contraPoints = 0;
    const note = (key: string) => {
      const copy = SIGNAL_MATCH_COPY[key];
      if (copy) evidence.push(copy);
    };

    if (sig.speed && modifiers.speedDependence !== "unknown") {
      const got = modifiers.speedDependence;
      const matched =
        sig.speed === "either" ? got !== "independent" : got === sig.speed;
      if (matched) {
        matchPoints += W.signalMatch;
        note(got === "tracks_road_speed" ? "speed_road" : "speed_rpm");
      } else {
        contraPoints += W.signalContradiction;
        counterEvidence.push(
          "The way it changes with speed doesn't match how this issue usually behaves."
        );
      }
    }
    if (sig.temperature && modifiers.temperature !== "unknown") {
      if (modifiers.temperature === sig.temperature) {
        matchPoints += W.signalMatch;
        note(sig.temperature === "cold_only" ? "temperature_cold" : "temperature_warm");
      } else if (modifiers.temperature !== "any") {
        contraPoints += W.signalContradiction;
        counterEvidence.push(
          "Its hot/cold behavior doesn't match how this issue usually behaves."
        );
      }
    }
    if (sig.load && modifiers.load !== "unknown") {
      if (modifiers.load === sig.load) {
        matchPoints += W.signalMatch;
        note("load");
      } else if (modifiers.load !== "unchanged") {
        contraPoints += W.signalContradiction;
      }
    }
    if (sig.onset && modifiers.onset !== "unknown") {
      if (modifiers.onset === sig.onset) {
        matchPoints += W.signalMatch;
        note("onset");
      } else {
        contraPoints += W.signalContradiction;
      }
    }
    if (sig.locations && sig.locations.length > 0 && modifiers.location !== "unknown") {
      const got = coarseLocations(modifiers.location);
      if (sig.locations.some((l) => got.has(l) || l === modifiers.location)) {
        matchPoints += W.signalMatch;
        note("location");
      } else {
        // Contradict only on an unambiguous front/rear conflict.
        const frontOnly = sig.locations.every((l) => l.startsWith("front"));
        const rearOnly = sig.locations.every((l) => l.startsWith("rear"));
        if ((frontOnly && got.has("rear")) || (rearOnly && got.has("front"))) {
          contraPoints += W.signalContradiction;
          counterEvidence.push(
            "Where the noise seems to come from doesn't fit this issue."
          );
        }
      }
    }
    score += Math.min(matchPoints, W.signalMatchCap);
    score += Math.max(contraPoints, W.signalContradictionCap);
  }

  // 5.6 Explicit negations. A negated sound/context the issue depends on is
  //     strong counter-evidence — slightly weaker than the points an
  //     affirmation would have earned, since negated wording is less reliable.
  const negSounds = modifiers.negatedSoundTypes.filter((t) =>
    issue.sounds.includes(t)
  );
  if (negSounds.length > 0) {
    score += Math.max(negSounds.length * W.negatedSound, W.negatedSoundCap);
    counterEvidence.push(
      "You ruled out the kind of sound this issue usually makes."
    );
  }
  const negCtx = modifiers.negatedContexts.filter(
    (c) => issue.contexts.strong.includes(c) && !req.contexts.includes(c)
  );
  if (negCtx.length > 0) {
    score += Math.max(negCtx.length * W.negatedContext, W.negatedContextCap);
    counterEvidence.push(
      "It not happening in this issue's typical moments argues against it."
    );
  }

  // 5.7 Recent work in the same area: suggestive, not diagnostic.
  if (
    modifiers.recentWork.some((a) => RECENT_WORK_CATEGORY[a] === issue.category)
  ) {
    score += W.recentWork;
    evidence.push(
      "This started after recent work in the same area — worth telling the shop."
    );
  }

  // 6. Prior commonness, nudged by per-model priors when the request has them.
  //    Priors never gate on hasDirectEvidence — they only shade the prior.
  const priorWeight = req.priors?.categoryWeights[issue.category] ?? 0;
  const priorRecall = req.priors?.recallCategories.includes(issue.category) ?? false;
  const rateBoost =
    priorWeight * PRIORS.weightScale + (priorRecall ? PRIORS.recallBoost : 0);
  score += Math.min(1, issue.baseRate + rateBoost) * W.baseRateScale;
  if (priorRecall || priorWeight >= PRIORS.evidenceThreshold) {
    evidence.push(
      "This is a commonly reported trouble area for this vehicle."
    );
  }

  // 7. Engine-type damping (e.g. knock on a diesel is weak evidence)
  if (issue.dampFor?.includes(engineType)) score *= 0.5;

  if (score <= 0) return null;
  // Up to four supporting bullets plus one honest counter-note, so a cause
  // demoted by negative evidence still explains itself.
  const shown = [...evidence.slice(0, 4), ...counterEvidence.slice(0, 1)];
  return { issue, score, evidence: shown, hasDirectEvidence };
}

/** Saturating curve keeps confidence honest: never near 100%.
 *  K is re-fit against the benchmark whenever scoring shifts: 65 → 72 when
 *  specificity raised raw scores (A2), 72 → 68 when the KB doubling diluted
 *  per-signal specificity (A4). Target: clear-case median in the 55–75 band. */
const CONFIDENCE_K = 68;
function toConfidence(score: number): number {
  return Math.max(
    15,
    Math.min(88, Math.round((100 * score) / (score + CONFIDENCE_K)))
  );
}

function toRankedCause(scored: ScoredIssue, rank: number): RankedCause {
  const { issue, score, evidence } = scored;
  return {
    id: issue.id,
    rank,
    title: issue.title,
    category: issue.category,
    categoryLabel: ISSUE_CATEGORY_LABELS[issue.category],
    confidence: toConfidence(score),
    severity: issue.severity,
    urgency: issue.urgency,
    urgencyLabel: URGENCY_LABELS[issue.urgency],
    safeToDrive: issue.safeToDrive,
    description: issue.description,
    whyLikely: evidence,
    confirmRuleOut: issue.confirmRuleOut,
    checksFirst: issue.checksFirst,
    repairDirection: issue.repairDirection,
    repairDifficulty: issue.repairDifficulty,
    repairDifficultyLabel: REPAIR_DIFFICULTY_LABELS[issue.repairDifficulty],
    mechanicSummary: issue.mechanicSummary,
  };
}

function computeOverall(
  causes: RankedCause[],
  redFlags: RedFlag[],
  lowConfidence: boolean
): DiagnosisOverall {
  // Judge overall risk from causes that carry real weight: the top cause
  // always counts; runners-up only above 45% so a weak generic match (e.g.
  // metal-on-metal pads at 35% on a squeal-only report) can't set the verdict.
  const considered = causes.filter((c, i) => i === 0 || c.confidence >= 45);
  const hasStopFlag = redFlags.some((f) => f.stopDriving);

  let severity: Severity = "low";
  let urgency: Urgency = "monitor";
  let safety: SafeToDrive = "yes";
  for (const c of considered) {
    if (SEVERITY_RANK[c.severity] > SEVERITY_RANK[severity]) severity = c.severity;
    if (URGENCY_RANK[c.urgency] > URGENCY_RANK[urgency]) urgency = c.urgency;
    if (SAFETY_RANK[c.safeToDrive] > SAFETY_RANK[safety]) safety = c.safeToDrive;
  }
  if (hasStopFlag) {
    safety = "no";
    urgency = "immediate";
    if (SEVERITY_RANK[severity] < SEVERITY_RANK.high) severity = "high";
  } else if (redFlags.length > 0 && safety === "yes") {
    safety = "caution";
    if (URGENCY_RANK[urgency] < URGENCY_RANK.prompt) urgency = "prompt";
  }

  const verdict =
    safety === "no"
      ? "Avoid driving until this is inspected"
      : safety === "caution"
        ? "Drive gently and get it checked soon"
        : "OK to drive — keep monitoring it";

  const top = causes[0];
  let summary: string;
  if (!top) {
    summary =
      "We couldn't match your description to a specific known issue. Try describing the sound itself (clicking, grinding, squealing…) and exactly when it happens, or add a recording.";
  } else {
    const second = causes[1];
    const lead = `The strongest match is ${top.title.toLowerCase()} (${top.confidence}% confidence)`;
    const runnerUp = second
      ? `, with ${second.title.toLowerCase()} (${second.confidence}%) also worth checking`
      : "";
    const flagNote = hasStopFlag
      ? " Your description includes warning signs we treat as stop-driving issues — see the safety alerts above."
      : redFlags.length > 0
        ? " Some details in your description warrant extra caution."
        : "";
    const confNote = lowConfidence
      ? " Overall confidence is low — more detail about the sound would sharpen this."
      : "";
    summary = `${lead}${runnerUp}.${flagNote}${confNote}`;
  }

  return {
    severity,
    urgency,
    urgencyLabel: URGENCY_LABELS[urgency],
    safeToDrive: safety,
    verdict,
    summary,
  };
}

/** Presentation-level summary of how priors touched this result. */
function buildPersonalization(
  priors: DiagnoseRequest["priors"]
): DiagnosisResult["personalization"] {
  if (!priors) return null;
  const applied =
    Object.values(priors.categoryWeights).some((w) => (w ?? 0) > 0) ||
    priors.recallCategories.length > 0;
  const recallLabels = [...new Set(priors.recallCategories)].map((c) =>
    ISSUE_CATEGORY_LABELS[c].toLowerCase()
  );
  const recallNotice =
    recallLabels.length > 0
      ? `This vehicle has at least one open recall involving the ${listToProse(
          recallLabels,
          "and"
        )}. A dealer can check your VIN and complete recall repairs for free.`
      : null;
  return { priorsApplied: applied, recallNotice };
}

function buildAudioSummary(audio: AudioFeatures): AudioSummary {
  const notes: string[] = [];
  notes.push(
    `${audio.durationSec.toFixed(1)}s ${audio.source === "recording" ? "recording" : "uploaded clip"} analyzed.`
  );
  if (audio.pulseRateHz && audio.pulseCount >= 3) {
    notes.push(
      `Detected a repeating pulse about ${audio.pulseRateHz.toFixed(1)}× per second — rhythmic sounds usually track wheel or engine speed.`
    );
  }
  if (audio.spectralCentroidHz >= 2500) {
    notes.push("Energy is concentrated in high frequencies — squeal/whine territory.");
  } else if (audio.spectralCentroidHz <= 400) {
    notes.push("Energy is concentrated in low frequencies — rumble/knock territory.");
  }
  if (audio.hints.includes("quiet_recording")) {
    notes.push(
      "The recording is very quiet, which limits what we can read from it. Re-recording closer to the noise would help."
    );
  }
  return {
    hints: audio.hints,
    hintLabels: audio.hints.map((h) => AUDIO_HINT_LABELS[h]),
    notes,
  };
}

/* ------------------------------------------------------------------ */
/* Mechanic script — first-person, plain-spoken, no internals           */
/* ------------------------------------------------------------------ */

/** Plain "when it happens" phrasing per context. The turning trio (left /
 *  right / low-speed) overlaps, so it's collapsed separately in
 *  `describeTurning` and intentionally omitted from this map. */
const CONTEXT_MOMENTS: Partial<Record<SoundContext, string>> = {
  cold_start: "on cold starts",
  idle: "at idle",
  acceleration: "when accelerating",
  braking: "when braking",
  over_bumps: "over bumps",
  highway_speed: "at highway speed",
  low_speed: "at low speed",
  reversing: "when reversing",
};

/** One plain, spoken read of a recording — never DSP jargon. Recording-quality
 *  hints (too quiet / clipped) are intentionally absent: they aren't "what
 *  stood out" about the noise itself. */
const AUDIO_PLAIN: Partial<Record<AudioHint, string>> = {
  rhythmic_ticking: "it has a steady, repeating rhythm",
  sharp_transients: "it's sharp and sudden",
  high_pitched: "it's high-pitched",
  low_rumble: "it's a low rumble",
  tonal_whine: "it's a steady whine",
  broadband_hiss: "it sounds like a rush of air",
  irregular_knocking: "it knocks unevenly, without a steady beat",
  strong_harmonics: "it has a musical, steady tone",
  modulated_drone: "it pulses as it drones",
};

/** Collapse the overlapping turning contexts into one natural phrase so the
 *  user never reads a redundant list. e.g. left + right + low-speed →
 *  "when turning, especially at low speed"; left alone → "when turning left". */
function describeTurning(
  contexts: Set<SoundContext>,
  emphasizeLowSpeed: boolean
): string | null {
  const left = contexts.has("turning_left");
  const right = contexts.has("turning_right");
  const lowSpeed = contexts.has("low_speed_turning");
  if (!left && !right && !lowSpeed) return null;
  // Both directions (or only the low-speed variant) just reads as "turning".
  const direction =
    left && right
      ? "turning"
      : left
        ? "turning left"
        : right
          ? "turning right"
          : "turning";
  if (!lowSpeed) return `when ${direction}`;
  if (!left && !right) return "when turning at low speed";
  return emphasizeLowSpeed
    ? `when ${direction}, especially at low speed`
    : `when ${direction} at low speed`;
}

/** Build the de-duplicated "when it happens" clause from the selected contexts. */
function describeWhen(contexts: SoundContext[]): string {
  const set = new Set(contexts);
  const lowSpeedInTurning = set.has("low_speed_turning");
  const seen = new Set<string>();
  const phrases: string[] = [];
  for (const c of contexts) {
    if (c === "turning_left" || c === "turning_right" || c === "low_speed_turning") {
      continue;
    }
    // Don't say "at low speed" twice when the turning phrase already covers it.
    if (c === "low_speed" && lowSpeedInTurning) continue;
    const phrase = CONTEXT_MOMENTS[c];
    if (phrase && !seen.has(phrase)) {
      seen.add(phrase);
      phrases.push(phrase);
    }
  }
  // Append the collapsed turning phrase; only emphasize low speed when it's the
  // sole moment, so the ", especially…" qualifier doesn't break a longer list.
  const turning = describeTurning(set, phrases.length === 0);
  if (turning) phrases.push(turning);
  return listToProse(phrases);
}

/** Title in mid-sentence form: lower-case only the first letter so internal
 *  abbreviations (CV, ABS, …) keep their casing. */
function midSentenceTitle(title: string): string {
  return title.charAt(0).toLowerCase() + title.slice(1);
}


function buildMechanicScript(
  req: DiagnoseRequest,
  causes: RankedCause[],
  sounds: SoundMatch[]
): string {
  const v = req.vehicle;

  // The sound(s), de-duped, with a neutral fallback.
  const soundWords = [...new Set(sounds.map((s) => s.matchedWord))];
  const soundPhrase =
    soundWords.length > 0
      ? `a ${listToProse(soundWords)} sound`
      : "an unusual noise";

  const when = describeWhen(req.contexts);
  const whenPart = when ? `, mostly ${when}` : "";

  // Lead with the vehicle. With mileage it gets its own short sentence; without
  // it we merge so there's no dangling "My 2014 Honda Civic." fragment.
  const vehicle = `${v.year} ${v.make} ${v.model}`;
  const opening = v.mileage
    ? `My ${vehicle} has about ${v.mileage.toLocaleString("en-US")} miles. It's making ${soundPhrase}${whenPart}.`
    : `My ${vehicle} is making ${soundPhrase}${whenPart}.`;

  // One tight, plain clause about the recording — only if there's something
  // worth saying, and never the audio internals.
  const audioHint = req.audio?.hints.map((h) => AUDIO_PLAIN[h]).find(Boolean);
  const audioPart = req.audio
    ? audioHint
      ? ` I recorded it too — ${audioHint}.`
      : " I have a recording of it as well, if that helps."
    : "";

  // Frame as the owner looked into the symptoms themselves — name the top
  // causes in plain words, never the numbers or a "please check X" ask.
  let suspicionPart = "";
  if (causes.length > 0) {
    const [first, ...rest] = causes
      .slice(0, 3)
      .map((c) => midSentenceTitle(c.title));
    if (rest.length === 0) {
      suspicionPart = ` I looked into the symptoms and think it might be ${first}.`;
    } else {
      const alternatives =
        rest.length === 1 ? rest[0]! : `${rest[0]!}, or ${rest[1]!}`;
      suspicionPart = ` I looked into the symptoms and think it might be ${first} — or possibly ${alternatives}.`;
    }
  }

  return `${opening}${audioPart}${suspicionPart}`;
}

/* ------------------------------------------------------------------ */
/* Public API                                                           */
/* ------------------------------------------------------------------ */

export function diagnose(
  req: DiagnoseRequest,
  interpreted?: InterpretedSignals | null
): DiagnosisResult {
  const text = normalizeText(req.symptomText);
  const literalSounds = detectSounds(text);

  // Structured modifiers: deterministic regex extraction always runs; the AI
  // may only fill fields the regex left unknown and add to arrays.
  const detModifiers = extractModifiers(text);
  const modifiers = mergeModifiers(detModifiers, interpreted);

  // Merge AI-interpreted signals into the inputs the engine scores on. The AI
  // can only add canonical sounds/contexts the literal matching missed — it
  // never removes anything and never ranks. Safety is deliberately excluded
  // (see redFlags below): a stop-driving alert must trace to the user's words.
  const literalTypes = new Set(literalSounds.map((s) => s.type));
  const inferredSounds: SoundMatch[] = (interpreted?.soundTypes ?? [])
    .filter((t) => !literalTypes.has(t) && !modifiers.negatedSoundTypes.includes(t))
    .map((t) => ({ type: t, matchedWord: t, inferred: true }));
  const sounds = [...literalSounds, ...inferredSounds];

  const addedContexts = (interpreted?.contexts ?? []).filter(
    (c) => !req.contexts.includes(c) && !modifiers.negatedContexts.includes(c)
  );
  const effReq: DiagnoseRequest =
    addedContexts.length > 0
      ? { ...req, contexts: [...req.contexts, ...addedContexts] }
      : req;

  // Red flags run on the user's LITERAL text and contexts only — the AI
  // interpreter must not be able to manufacture OR suppress a stop-driving
  // verdict. Deterministic negation is the sole exception: a sound the user
  // explicitly denied ("it's not grinding") doesn't count as a flag trigger,
  // and phrase triggers use the same affirmed-only matching internally.
  const affirmedSounds = literalSounds.filter(
    (s) => !detModifiers.negatedSoundTypes.includes(s.type)
  );
  const redFlags = detectRedFlags(text, req.contexts, affirmedSounds);

  const scoredAll = KNOWLEDGE_BASE.map((issue) =>
    scoreIssue(issue, effReq, text, sounds, modifiers)
  )
    .filter((s): s is ScoredIssue => s !== null)
    .sort((a, b) => b.score - a.score);

  // Prefer causes with direct evidence; backfill so we always show 3 if possible.
  const direct = scoredAll.filter((s) => s.hasDirectEvidence);
  const backfill = scoredAll.filter((s) => !s.hasDirectEvidence);
  const picked = [...direct, ...backfill].slice(0, 5);
  // Trim trailing weak guesses, but never below 3.
  while (picked.length > 3 && picked[picked.length - 1]!.score < 25) picked.pop();

  const causes = picked.map((s, i) => toRankedCause(s, i + 1));
  const lowConfidence =
    direct.length === 0 || (causes[0]?.confidence ?? 0) < 35;

  const overall = computeOverall(causes, redFlags, lowConfidence);

  const checkSeen = new Set<string>();
  const whatToCheckFirst: string[] = [];
  const checkOrder = [
    causes[0]?.checksFirst[0],
    causes[0]?.checksFirst[1],
    causes[1]?.checksFirst[0],
    causes[2]?.checksFirst[0],
    causes[1]?.checksFirst[1],
  ];
  for (const check of checkOrder) {
    if (check && !checkSeen.has(check)) {
      checkSeen.add(check);
      whatToCheckFirst.push(check);
    }
    if (whatToCheckFirst.length >= 5) break;
  }

  const note = lowConfidence
    ? sounds.length === 0
      ? "We couldn't pick out a specific sound word (click, grind, squeal, knock…) from your description, so these rankings lean on context alone. Describing the noise itself will sharpen the result."
      : "The signals here are weaker than usual — treat the ranking as a rough starting point."
    : null;

  // Surface the interpreter's contribution only when it genuinely added
  // signals the literal matching missed.
  const interpretation =
    interpreted && (inferredSounds.length > 0 || addedContexts.length > 0)
      ? {
          soundTypes: inferredSounds.map((s) => s.type),
          contexts: addedContexts,
          rationale: interpreted.rationale,
        }
      : null;

  return {
    requestId: globalThis.crypto.randomUUID(),
    generatedAt: new Date().toISOString(),
    mode: "heuristic",
    aiProviderLabel: null,
    vehicleLabel: `${req.vehicle.year} ${req.vehicle.make} ${req.vehicle.model}`,
    overall,
    redFlags,
    causes,
    whatToCheckFirst,
    mechanicScript: buildMechanicScript(effReq, causes, sounds),
    audioSummary: req.audio ? buildAudioSummary(req.audio) : null,
    inputQuality: {
      // Honest about literal matches only; inferred signals live in `interpretation`.
      soundWordsDetected: literalSounds.map((s) => s.matchedWord),
      contextCount: effReq.contexts.length,
      hasAudio: Boolean(req.audio),
      note,
    },
    interpretation,
    personalization: buildPersonalization(req.priors),
    disclaimer: DISCLAIMER,
  };
}
