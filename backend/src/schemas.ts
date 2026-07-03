import { z } from "zod";

/* ------------------------------------------------------------------ */
/* Shared vocabulary                                                    */
/* ------------------------------------------------------------------ */

export const SOUND_CONTEXTS = [
  "cold_start",
  "idle",
  "acceleration",
  "braking",
  "turning_left",
  "turning_right",
  "low_speed_turning",
  "over_bumps",
  "highway_speed",
  "low_speed",
  "reversing",
  "other",
] as const;
export type SoundContext = (typeof SOUND_CONTEXTS)[number];

export const SOUND_CONTEXT_LABELS: Record<SoundContext, string> = {
  cold_start: "Cold start",
  idle: "Idling",
  acceleration: "Accelerating",
  braking: "Braking",
  turning_left: "Turning left",
  turning_right: "Turning right",
  low_speed_turning: "Low-speed turning",
  over_bumps: "Over bumps",
  highway_speed: "Highway speed",
  low_speed: "Low speed",
  reversing: "Reversing",
  other: "Other",
};

export const ENGINE_TYPES = [
  "gasoline",
  "diesel",
  "hybrid",
  "electric",
  "unknown",
] as const;
export type EngineType = (typeof ENGINE_TYPES)[number];

export const SEVERITIES = ["low", "moderate", "high", "critical"] as const;
export type Severity = (typeof SEVERITIES)[number];

export const URGENCIES = ["monitor", "soon", "prompt", "immediate"] as const;
export type Urgency = (typeof URGENCIES)[number];

export const URGENCY_LABELS: Record<Urgency, string> = {
  monitor: "Keep an eye on it",
  soon: "Look into it within a few weeks",
  prompt: "Get it checked within days",
  immediate: "Address before driving again",
};

export const SAFE_TO_DRIVE = ["yes", "caution", "no"] as const;
export type SafeToDrive = (typeof SAFE_TO_DRIVE)[number];

export const REPAIR_DIFFICULTIES = [
  "diy-easy",
  "diy-moderate",
  "pro",
  "pro-major",
] as const;
export type RepairDifficulty = (typeof REPAIR_DIFFICULTIES)[number];

export const REPAIR_DIFFICULTY_LABELS: Record<RepairDifficulty, string> = {
  "diy-easy": "Easy DIY check",
  "diy-moderate": "Doable DIY with tools",
  pro: "Typical shop job",
  "pro-major": "Major shop repair",
};

export const ISSUE_CATEGORIES = [
  "brakes",
  "steering",
  "suspension",
  "engine",
  "belts",
  "exhaust",
  "cooling",
  "drivetrain",
  "electrical",
  "wheels_tires",
] as const;
export type IssueCategory = (typeof ISSUE_CATEGORIES)[number];

export const ISSUE_CATEGORY_LABELS: Record<IssueCategory, string> = {
  brakes: "Brakes",
  steering: "Steering",
  suspension: "Suspension",
  engine: "Engine",
  belts: "Belts & pulleys",
  exhaust: "Exhaust",
  cooling: "Cooling system",
  drivetrain: "Transmission & drivetrain",
  electrical: "Electrical & starting",
  wheels_tires: "Wheels & tires",
};

/* ------------------------------------------------------------------ */
/* Audio features (extracted client-side with the Web Audio API)       */
/* ------------------------------------------------------------------ */

export const AUDIO_HINTS = [
  "rhythmic_ticking",
  "sharp_transients",
  "high_pitched",
  "low_rumble",
  "tonal_whine",
  "broadband_hiss",
  "quiet_recording",
  "loud_recording",
] as const;
export type AudioHint = (typeof AUDIO_HINTS)[number];

export const AUDIO_HINT_LABELS: Record<AudioHint, string> = {
  rhythmic_ticking: "Rhythmic, repeating pulses",
  sharp_transients: "Sharp impact-like transients",
  high_pitched: "High-pitched energy",
  low_rumble: "Low-frequency rumble",
  tonal_whine: "Steady tonal whine",
  broadband_hiss: "Broadband hiss",
  quiet_recording: "Very quiet recording",
  loud_recording: "Very loud / clipped recording",
};

export const audioFeaturesSchema = z.object({
  source: z.enum(["recording", "upload"]),
  fileName: z.string().max(200).optional(),
  durationSec: z.number().min(0.1).max(300),
  sampleRateHz: z.number().min(4000).max(192000),
  rmsDb: z.number().min(-120).max(0),
  peakDb: z.number().min(-120).max(0),
  crestFactorDb: z.number().min(0).max(80),
  spectralCentroidHz: z.number().min(0).max(96000),
  spectralFlatness: z.number().min(0).max(1),
  zeroCrossingRateHz: z.number().min(0).max(96000),
  bandEnergy: z.object({
    low: z.number().min(0).max(1), // < 250 Hz
    lowMid: z.number().min(0).max(1), // 250–800 Hz
    mid: z.number().min(0).max(1), // 800–2500 Hz
    high: z.number().min(0).max(1), // > 2500 Hz
  }),
  pulseRateHz: z.number().min(0).max(50).nullable(),
  pulseCount: z.number().int().min(0).max(10000),
  hints: z.array(z.enum(AUDIO_HINTS)).max(8),
});
export type AudioFeatures = z.infer<typeof audioFeaturesSchema>;

/* ------------------------------------------------------------------ */
/* Request                                                              */
/* ------------------------------------------------------------------ */

const CURRENT_YEAR = new Date().getFullYear();

/**
 * Vehicle-specific priors derived from external per-model reliability data
 * (NHTSA complaints/recalls, fetched client-side by /api/vehicle-history).
 * The engine uses them only as a bounded base-rate boost: they can break ties
 * between plausible causes, never manufacture a top cause, and never touch
 * red flags or the safety verdict.
 */
export const vehiclePriorsSchema = z.object({
  /** Relative complaint density per category for this make/model/year, 0..1. */
  categoryWeights: z.partialRecord(
    z.enum(ISSUE_CATEGORIES),
    z.number().min(0).max(1)
  ),
  /** Categories with at least one open recall — stronger prior, surfaced to the user. */
  recallCategories: z.array(z.enum(ISSUE_CATEGORIES)).max(ISSUE_CATEGORIES.length),
  source: z.literal("nhtsa"),
  fetchedAt: z.string().max(40),
});
export type VehiclePriors = z.infer<typeof vehiclePriorsSchema>;

export const vehicleSchema = z.object({
  make: z.string().trim().min(1).max(40),
  model: z.string().trim().min(1).max(60),
  year: z.number().int().min(1960).max(CURRENT_YEAR + 1),
  mileage: z.number().int().min(0).max(1_500_000).nullish(),
  engineType: z.enum(ENGINE_TYPES).default("unknown"),
});
export type VehicleInfo = z.infer<typeof vehicleSchema>;

export const diagnoseRequestSchema = z.object({
  vehicle: vehicleSchema,
  symptomText: z
    .string()
    .trim()
    .min(10, "Please describe the sound in at least a few words.")
    .max(2000),
  contexts: z.array(z.enum(SOUND_CONTEXTS)).min(1).max(12),
  audio: audioFeaturesSchema.nullish(),
  priors: vehiclePriorsSchema.nullish(),
});
export type DiagnoseRequest = z.infer<typeof diagnoseRequestSchema>;

/* ------------------------------------------------------------------ */
/* Result                                                               */
/* ------------------------------------------------------------------ */

export interface RankedCause {
  id: string;
  rank: number;
  title: string;
  category: IssueCategory;
  categoryLabel: string;
  /** 0–100, deliberately capped well below 100 — this is triage, not certainty. */
  confidence: number;
  severity: Severity;
  urgency: Urgency;
  urgencyLabel: string;
  safeToDrive: SafeToDrive;
  description: string;
  /** Evidence from this submission that made the cause rank highly. */
  whyLikely: string[];
  /** What would confirm or rule the cause out. */
  confirmRuleOut: string[];
  checksFirst: string[];
  repairDirection: string;
  repairDifficulty: RepairDifficulty;
  repairDifficultyLabel: string;
  mechanicSummary: string;
  /** Case-specific explanation written by the LLM in AI-enhanced mode. */
  aiNote?: string | null;
}

export interface RedFlag {
  id: string;
  label: string;
  message: string;
  stopDriving: boolean;
}

export interface DiagnosisOverall {
  severity: Severity;
  urgency: Urgency;
  urgencyLabel: string;
  safeToDrive: SafeToDrive;
  verdict: string;
  summary: string;
}

export interface AudioSummary {
  hints: AudioHint[];
  hintLabels: string[];
  notes: string[];
}

export interface InputQuality {
  soundWordsDetected: string[];
  contextCount: number;
  hasAudio: boolean;
  /** Present when the engine wants the user to know results are weak. */
  note: string | null;
}

/**
 * How the optional AI interpreter read the free-text description into the
 * engine's controlled vocabulary before scoring. Shown to the user for
 * transparency; the engine still does all ranking and the safety verdict.
 */
/**
 * How vehicle-specific priors (if any were sent) affected this result.
 * Presentation-level only: the underlying boost is already reflected in the
 * cause ranking, and red flags / safety verdicts ignore priors entirely.
 */
export interface DiagnosisPersonalization {
  priorsApplied: boolean;
  /** Plain-language nudge when the vehicle has open recalls in a relevant area. */
  recallNotice: string | null;
}

export interface SymptomInterpretation {
  /** Canonical sound types inferred from the text the lexicon didn't catch. */
  soundTypes: string[];
  /** Driving contexts inferred from the text beyond what the user selected. */
  contexts: SoundContext[];
  rationale: string;
}

export interface DiagnosisResult {
  requestId: string;
  generatedAt: string;
  /** "heuristic" = rule engine only; "ai-enhanced" = LLM refined the explanation. */
  mode: "heuristic" | "ai-enhanced";
  aiProviderLabel: string | null;
  vehicleLabel: string;
  overall: DiagnosisOverall;
  redFlags: RedFlag[];
  causes: RankedCause[];
  whatToCheckFirst: string[];
  mechanicScript: string;
  audioSummary: AudioSummary | null;
  inputQuality: InputQuality;
  /**
   * Present only when the AI interpreter added sound types or contexts the
   * literal text matching missed. null in heuristic mode or when the AI
   * found nothing beyond the user's own words.
   */
  interpretation: SymptomInterpretation | null;
  /** Present only when the request carried vehicle priors. */
  personalization?: DiagnosisPersonalization | null;
  /**
   * Extra safety guidance from the LLM in AI-enhanced mode. The overall
   * verdict (severity / safe-to-drive) is always computed by the rule engine
   * and never delegated to the LLM.
   */
  aiSafetyAdvice?: string | null;
  disclaimer: string;
}

export const DISCLAIMER =
  "RevSense is a triage assistant, not a certified mechanic. It ranks possible causes from what you describe and any recording you add — it cannot inspect your car and cannot guarantee a diagnosis. Treat results as a starting point for a conversation with a qualified technician. If you notice braking or steering problems, smoke, a burning smell, overheating, an oil-pressure warning, or severe knocking, stop driving and have the vehicle inspected.";
