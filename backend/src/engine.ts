import {
  AUDIO_HINT_LABELS,
  DISCLAIMER,
  ISSUE_CATEGORY_LABELS,
  REPAIR_DIFFICULTY_LABELS,
  SOUND_CONTEXT_LABELS,
  URGENCY_LABELS,
  type AudioFeatures,
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

function listToProse(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
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

  // 1. Canonical sound-type matches
  const soundHits = sounds.filter((s) => issue.sounds.includes(s.type));
  if (soundHits.length > 0) {
    score += Math.min(soundHits.length * W.soundMatch, W.soundCap);
    hasDirectEvidence = true;
    const words = soundHits.map((s) => `"${s.matchedWord}"`);
    evidence.push(
      `You described ${listToProse(words)} — a signature sound for this issue.`
    );
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
        `Acoustic clues from your recording (${listToProse(
          hintHits.map((h) => AUDIO_HINT_LABELS[h].toLowerCase())
        )}) fit this issue's sound profile.`
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

  // 6. Prior commonness
  score += issue.baseRate * W.baseRateScale;

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

function buildMechanicScript(
  req: DiagnoseRequest,
  causes: RankedCause[],
  sounds: SoundMatch[]
): string {
  const v = req.vehicle;
  const soundWords =
    sounds.length > 0
      ? `a ${listToProse(sounds.map((s) => s.matchedWord))} sound`
      : "an unusual noise";
  const contexts = listToProse(
    req.contexts
      .filter((c): c is Exclude<SoundContext, "other"> => c !== "other")
      .map((c) => SOUND_CONTEXT_LABELS[c].toLowerCase())
  );
  const mileagePart = v.mileage
    ? ` with ${v.mileage.toLocaleString("en-US")} miles`
    : "";
  const audioPart = req.audio?.hints.length
    ? ` A basic audio analysis flagged: ${listToProse(
        req.audio.hints.map((h) => AUDIO_HINT_LABELS[h].toLowerCase())
      )}.`
    : "";
  const causePart =
    causes.length > 0
      ? ` An online triage suggested checking, in order: ${listToProse(
          causes.slice(0, 3).map((c) => `${c.title.toLowerCase()} (${c.confidence}%)`)
        )}.`
      : "";
  const askPart =
    causes.length > 0
      ? ` Could you start with the ${ISSUE_CATEGORY_LABELS[causes[0]!.category].toLowerCase()} area?`
      : "";
  return `I'm hearing ${soundWords} from my ${v.year} ${v.make} ${v.model}${mileagePart}.${contexts ? ` It happens during ${contexts}.` : ""}${audioPart}${causePart}${askPart}`;
}

/* ------------------------------------------------------------------ */
/* Public API                                                           */
/* ------------------------------------------------------------------ */

export function diagnose(req: DiagnoseRequest): DiagnosisResult {
  const text = normalizeText(req.symptomText);
  const sounds = detectSounds(text);
  const redFlags = detectRedFlags(text, req.contexts, sounds);

  const scoredAll = KNOWLEDGE_BASE.map((issue) =>
    scoreIssue(issue, req, text, sounds)
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
    mechanicScript: buildMechanicScript(req, causes, sounds),
    audioSummary: req.audio ? buildAudioSummary(req.audio) : null,
    inputQuality: {
      soundWordsDetected: sounds.map((s) => s.matchedWord),
      contextCount: req.contexts.length,
      hasAudio: Boolean(req.audio),
      note,
    },
    disclaimer: DISCLAIMER,
  };
}
