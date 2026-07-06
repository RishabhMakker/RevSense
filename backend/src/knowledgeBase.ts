/**
 * Re-export shim: the knowledge base now lives in ./kb/<category>.ts so it
 * can grow without this file becoming unmanageable. Nothing else changes —
 * all existing imports keep working.
 */
export { KNOWLEDGE_BASE, KNOWN_ISSUE_COUNT } from "./kb/index";
export type { IssueSignals, KnownIssue } from "./kb/index";
