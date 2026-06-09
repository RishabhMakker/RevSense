import type { DiagnoseRequest, DiagnosisResult } from "../schemas";
import { SOUND_CONTEXT_LABELS } from "../schemas";

/**
 * Shared prompt + response contract for all AI providers.
 *
 * Design principle: the LLM rewrites and deepens the heuristic result — it
 * never invents certainty, never overrides the engine's safety verdict, and
 * may only comment on causes the engine already ranked.
 */

export interface AIEnhancement {
  summary: string;
  safetyAdvice: string;
  mechanicScript: string;
  causes: {
    id: string;
    explanation: string;
    evidenceFor: string[];
    confirmOrRuleOut: string[];
  }[];
}

export const SYSTEM_PROMPT = `You are the explanation layer of RevSense, a car-noise triage assistant. A rule-based engine has already ranked likely causes for a user's car sound. Your job is to rewrite and deepen the explanation for a non-mechanic — NOT to diagnose from scratch.

Hard rules:
- Only discuss the causes the engine ranked. Never introduce new causes.
- Phrase everything as probability and possibility ("most consistent with", "would explain"), never certainty.
- Never tell the user it is safe to drive if the engine's verdict says otherwise. You may add caution; you may not remove it.
- Be concrete and specific to THIS vehicle and THIS description. No generic filler.
- Plain language; explain jargon in parentheses the first time it appears.
- The mechanicScript should read like something the owner can say verbatim at a repair shop: symptoms, conditions, vehicle, and what to check first.`;

/** JSON schema for the structured response (used directly by the Anthropic provider). */
export function buildResponseSchema(causeIds: string[]): Record<string, unknown> {
  return {
    type: "object",
    additionalProperties: false,
    required: ["summary", "safetyAdvice", "mechanicScript", "causes"],
    properties: {
      summary: {
        type: "string",
        description:
          "2-4 sentences. What is most likely going on and why, written for the vehicle owner.",
      },
      safetyAdvice: {
        type: "string",
        description:
          "1-3 sentences of practical safety guidance consistent with (or more cautious than) the engine verdict.",
      },
      mechanicScript: {
        type: "string",
        description:
          "A short first-person paragraph the owner can say to a mechanic.",
      },
      causes: {
        type: "array",
        description: "One entry per ranked cause, same order as given.",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["id", "explanation", "evidenceFor", "confirmOrRuleOut"],
          properties: {
            id: { type: "string", enum: causeIds },
            explanation: {
              type: "string",
              description:
                "2-3 sentences: why this cause fits this specific report.",
            },
            evidenceFor: {
              type: "array",
              items: { type: "string" },
              description:
                "2-4 short bullets of evidence from the user's report supporting this cause.",
            },
            confirmOrRuleOut: {
              type: "array",
              items: { type: "string" },
              description:
                "2-3 short bullets: what would confirm or rule this cause out.",
            },
          },
        },
      },
    },
  };
}

export function buildUserPrompt(
  req: DiagnoseRequest,
  result: DiagnosisResult
): string {
  const v = req.vehicle;
  const contexts = req.contexts
    .map((c) => SOUND_CONTEXT_LABELS[c])
    .join(", ");
  const audio = req.audio
    ? [
        `- duration: ${req.audio.durationSec.toFixed(1)}s, RMS ${req.audio.rmsDb.toFixed(0)} dBFS, peak ${req.audio.peakDb.toFixed(0)} dBFS`,
        `- spectral centroid ~${Math.round(req.audio.spectralCentroidHz)} Hz, flatness ${req.audio.spectralFlatness.toFixed(2)}`,
        req.audio.pulseRateHz
          ? `- repeating pulses at ~${req.audio.pulseRateHz.toFixed(1)} Hz (${req.audio.pulseCount} detected)`
          : `- no clear repeating pulse detected`,
        `- derived hints: ${req.audio.hints.join(", ") || "none"}`,
      ].join("\n")
    : "(no audio provided)";

  const causes = result.causes
    .map(
      (c) =>
        `${c.rank}. [id: ${c.id}] ${c.title} — ${c.confidence}% confidence, severity ${c.severity}, category ${c.categoryLabel}.\n   Engine evidence: ${c.whyLikely.join(" | ") || "weak match"}`
    )
    .join("\n");

  return `VEHICLE: ${v.year} ${v.make} ${v.model}, ${v.mileage != null ? `${v.mileage.toLocaleString("en-US")} miles` : "mileage unknown"}, engine type: ${v.engineType ?? "unknown"}.

OWNER'S DESCRIPTION: "${req.symptomText}"

WHEN IT HAPPENS: ${contexts}

BASIC AUDIO ANALYSIS (from a short recording, not a trained model):
${audio}

ENGINE-RANKED CAUSES:
${causes}

ENGINE VERDICT: severity ${result.overall.severity}, urgency "${result.overall.urgencyLabel}", safe to drive: ${result.overall.safeToDrive}.
${result.redFlags.length > 0 ? `RED FLAGS DETECTED: ${result.redFlags.map((f) => f.label).join("; ")}` : "No red flags detected."}

Rewrite the explanation per your instructions. Respond with JSON only.`;
}
