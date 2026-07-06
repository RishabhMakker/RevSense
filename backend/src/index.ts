/**
 * @revsense/backend — diagnostic core.
 *
 * Pure TypeScript, no server of its own: the Next.js API routes in
 * /frontend/app/api import everything from here.
 */

export * from "./schemas";
export { diagnose } from "./engine";
export { extractAudioFeatures, type AnalyzedAudio } from "./audio/dsp";
export {
  KNOWLEDGE_BASE,
  KNOWN_ISSUE_COUNT,
  type IssueSignals,
  type KnownIssue,
} from "./knowledgeBase";
export {
  extractModifiers,
  hasAffirmedPhrase,
  FREQUENCIES,
  LOAD_DEPS,
  NOISE_LOCATIONS,
  ONSETS,
  RECENT_WORK_AREAS,
  SPEED_DEPENDENCES,
  TEMPERATURE_DEPS,
  type Frequency,
  type LoadDep,
  type NoiseLocation,
  type Onset,
  type RecentWorkArea,
  type SpeedDependence,
  type SymptomModifiers,
  type TemperatureDep,
} from "./modifiers";
export {
  detectSounds,
  matchPhrases,
  normalizeText,
  SOUND_TYPES,
  type SoundMatch,
  type SoundType,
} from "./lexicon";
export { detectRedFlags } from "./redFlags";
export { DEMO_REQUEST } from "./demo";
export { enhanceWithAI, getAIStatus, interpretWithAI } from "./ai/enhance";
export type { InterpretedSignals } from "./ai/interpret";
export { EXPLAIN_CAUSE_LIMIT } from "./ai/prompt";
