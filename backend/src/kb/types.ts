import type {
  AudioHint,
  EngineType,
  IssueCategory,
  RepairDifficulty,
  SafeToDrive,
  Severity,
  SoundContext,
  Urgency,
} from "../schemas";
import type { SoundType } from "../lexicon";
import type { NoiseLocation } from "../modifiers";

/**
 * Physical behavior of an issue, matched against the structured symptom
 * modifiers extracted from the description (deterministically, optionally
 * AI-enriched). Only set a field when the physics is clear-cut — a wheel
 * bearing tracks road speed; a lifter tick tracks the engine and fades warm.
 */
export interface IssueSignals {
  speed?: "tracks_road_speed" | "tracks_engine_rpm" | "either";
  temperature?: "cold_only" | "warm_only";
  load?: "worse_under_load" | "worse_coasting";
  onset?: "sudden" | "gradual";
  /** Where the noise plausibly lives (coarse; corners imply their sides). */
  locations?: NoiseLocation[];
}

export interface KnownIssue {
  id: string;
  title: string;
  category: IssueCategory;
  description: string;
  /** Canonical sound types this issue typically produces. */
  sounds: SoundType[];
  /** High-weight phrase stems (word-boundary prefix matched). */
  strongPhrases: string[];
  /** Lower-weight phrase stems. */
  supportingPhrases: string[];
  /** Phrase stems that make this cause less likely. */
  negativePhrases?: string[];
  contexts: {
    strong: SoundContext[];
    weak: SoundContext[];
    /** Contexts this issue essentially can't produce (e.g. a brake-pad
     *  squeal while parked at idle) — scored as counter-evidence. */
    exclude?: SoundContext[];
  };
  /** Structured behavior matched against extracted symptom modifiers. */
  signals?: IssueSignals;
  audioHints: AudioHint[];
  /** Wear-item boosts when the vehicle is old / high-mileage. */
  wear?: { mileageFrom?: number; ageFrom?: number };
  /** Engine types for which this issue is impossible (e.g. belt squeal on an EV). */
  notFor?: EngineType[];
  /** Engine types for which this issue is much less diagnostic (score halved). */
  dampFor?: EngineType[];
  /** Prior commonness, 0–1. Brake pads are common; rod knock is not. */
  baseRate: number;
  severity: Severity;
  urgency: Urgency;
  safeToDrive: SafeToDrive;
  checksFirst: string[];
  confirmRuleOut: string[];
  repairDirection: string;
  repairDifficulty: RepairDifficulty;
  mechanicSummary: string;
}

