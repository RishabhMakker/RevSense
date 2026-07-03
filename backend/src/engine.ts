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
  wearMileage: 8,
  wearAge: 6,
  baseRateScale: 8,
  negativePhrase: -15,
} as const;

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
  sounds: SoundMatch[]
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
    score += Math.min(soundHits.length * W.soundMatch, W.soundCap);
    hasDirectEvidence = true;
    const literalHits = soundHits.filter((s) => !s.inferred);
    const inferredHits = soundHits.filter((s) => s.inferred);
    if (literalHits.length > 0) {
      const words = literalHits.map((s) => `"${s.matchedWord}"`);
      evidence.push(
        `You described ${listToProse(words)} — a signature sound for this issue.`
      );
    }
    if (inferredHits.length > 0) {
      const types = inferredHits.map((s) => `${s.type}-type`);
      evidence.push(
        `Your description reads as a ${listToProse(types)} sound — a signature sound for this issue.`
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
  if (issue.negativePhrases) {
    const negHits = matchPhrases(text, issue.negativePhrases);
    score += negHits.length * W.negativePhrase;
  }

  // 3. Context matches
  const strongCtx = req.contexts.filter((c) => issue.contexts.strong.includes(c));
  if (strongCtx.length > 0) {
    score += Math.min(strongCtx.length * W.strongContext, W.strongContextCap);
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

  // 4. Audio hints (only when a recording/upload was analyzed)
  if (req.audio) {
    const hintHits = req.audio.hints.filter((h) => issue.audioHints.includes(h));
    if (hintHits.length > 0) {
      score += Math.min(hintHits.length * W.audioHint, W.audioHintCap);
      evidence.push(
        `What we picked up in your recording (${listToProse(
          hintHits.map((h) => AUDIO_HINT_LABELS[h].toLowerCase())
        )}) matches this issue.`
      );
    }
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
  return { issue, score, evidence: evidence.slice(0, 4), hasDirectEvidence };
}

/** Saturating curve keeps confidence honest: never near 100%. */
function toConfidence(score: number): number {
  return Math.max(15, Math.min(88, Math.round((100 * score) / (score + 65))));
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

  // Merge AI-interpreted signals into the inputs the engine scores on. The AI
  // can only add canonical sounds/contexts the literal matching missed — it
  // never removes anything and never ranks. Safety is deliberately excluded
  // (see redFlags below): a stop-driving alert must trace to the user's words.
  const literalTypes = new Set(literalSounds.map((s) => s.type));
  const inferredSounds: SoundMatch[] = (interpreted?.soundTypes ?? [])
    .filter((t) => !literalTypes.has(t))
    .map((t) => ({ type: t, matchedWord: t, inferred: true }));
  const sounds = [...literalSounds, ...inferredSounds];

  const addedContexts = (interpreted?.contexts ?? []).filter(
    (c) => !req.contexts.includes(c)
  );
  const effReq: DiagnoseRequest =
    addedContexts.length > 0
      ? { ...req, contexts: [...req.contexts, ...addedContexts] }
      : req;

  // Red flags run on the user's LITERAL text and contexts only — the AI
  // interpreter must not be able to manufacture a stop-driving verdict.
  const redFlags = detectRedFlags(text, req.contexts, literalSounds);

  const scoredAll = KNOWLEDGE_BASE.map((issue) =>
    scoreIssue(issue, effReq, text, sounds)
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
