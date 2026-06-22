/**
 * @revsense/backend — diagnostic core.
 *
 * Pure TypeScript, no server of its own: the Next.js API routes in
 * /frontend/app/api import everything from here.
 */

export * from "./schemas";
export { diagnose } from "./engine";
export {
  KNOWLEDGE_BASE,
  KNOWN_ISSUE_COUNT,
  type KnownIssue,
} from "./knowledgeBase";
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
