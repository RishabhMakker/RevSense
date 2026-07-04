import type { DiagnoseRequest, DiagnosisResult } from "../schemas";
import type { AIEnhancement } from "./prompt";
import { enhanceWithAnthropic } from "./anthropic";
import { enhanceWithOpenAI } from "./openai";
import { enhanceWithOpenRouter } from "./openrouter";
import { interpretSymptom, type InterpretedSignals } from "./interpret";

/**
 * Provider resolution from environment variables — no key, no AI, no error:
 *
 *   AI_PROVIDER         "anthropic" | "openai" | "openrouter" | "none"
 *                       (default: auto-detect)
 *   ANTHROPIC_API_KEY   enables the Anthropic provider
 *   OPENAI_API_KEY      enables the OpenAI provider
 *   OPENROUTER_API_KEY  enables the OpenRouter provider (free models)
 *   AI_MODEL            optional model override for the active provider
 */

interface ResolvedProvider {
  name: "anthropic" | "openai" | "openrouter";
  label: string;
  apiKey: string;
  model?: string;
}

function resolveProvider(): ResolvedProvider | null {
  const requested = (process.env.AI_PROVIDER ?? "").toLowerCase().trim();
  if (requested === "none") return null;
  const model = process.env.AI_MODEL?.trim() || undefined;
  const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  const openrouterKey = process.env.OPENROUTER_API_KEY?.trim();

  if (requested === "anthropic") {
    return anthropicKey
      ? { name: "anthropic", label: "Claude", apiKey: anthropicKey, model }
      : null;
  }
  if (requested === "openai") {
    return openaiKey
      ? { name: "openai", label: "OpenAI", apiKey: openaiKey, model }
      : null;
  }
  if (requested === "openrouter") {
    return openrouterKey
      ? { name: "openrouter", label: "OpenRouter", apiKey: openrouterKey, model }
      : null;
  }
  // Auto-detect: prefer Anthropic, then OpenAI, then OpenRouter.
  if (anthropicKey)
    return { name: "anthropic", label: "Claude", apiKey: anthropicKey, model };
  if (openaiKey)
    return { name: "openai", label: "OpenAI", apiKey: openaiKey, model };
  if (openrouterKey)
    return {
      name: "openrouter",
      label: "OpenRouter",
      apiKey: openrouterKey,
      model,
    };
  return null;
}

export function getAIStatus(): {
  configured: boolean;
  providerLabel: string | null;
} {
  const provider = resolveProvider();
  return {
    configured: provider !== null,
    providerLabel: provider?.label ?? null,
  };
}

/**
 * Translate the user's free-text symptom into the engine's controlled
 * vocabulary BEFORE scoring, so unusual wording doesn't lose good matches.
 * No key, failure, or empty result → null, and the engine runs on the
 * user's literal words exactly as before.
 */
export async function interpretWithAI(
  req: DiagnoseRequest
): Promise<InterpretedSignals | null> {
  const provider = resolveProvider();
  if (!provider) return null;
  try {
    const signals = await interpretSymptom(
      { name: provider.name, apiKey: provider.apiKey, model: provider.model },
      req
    );
    const informative =
      signals.soundTypes.length > 0 ||
      signals.contexts.length > 0 ||
      (signals.negatedSoundTypes?.length ?? 0) > 0 ||
      (signals.negatedContexts?.length ?? 0) > 0 ||
      (signals.recentWork?.length ?? 0) > 0 ||
      [
        signals.onset,
        signals.frequency,
        signals.speedDependence,
        signals.temperature,
        signals.load,
        signals.location,
      ].some((v) => v !== undefined && v !== "unknown");
    return informative ? signals : null;
  } catch (err) {
    console.error(
      `[revsense] AI interpretation failed (${provider.name}), using literal text only:`,
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

const clip = (s: string, max: number) =>
  s.length > max ? `${s.slice(0, max - 1)}…` : s;

/** Defensive merge: only accept fields that are present, sane, and on-topic. */
function mergeEnhancement(
  result: DiagnosisResult,
  ai: AIEnhancement,
  providerLabel: string
): DiagnosisResult {
  const validIds = new Set(result.causes.map((c) => c.id));
  const byId = new Map(
    (Array.isArray(ai.causes) ? ai.causes : [])
      .filter((c) => c && validIds.has(c.id))
      .map((c) => [c.id, c])
  );

  const causes = result.causes.map((cause) => {
    const enhanced = byId.get(cause.id);
    if (!enhanced) return cause;
    return {
      ...cause,
      aiNote:
        typeof enhanced.explanation === "string" && enhanced.explanation
          ? clip(enhanced.explanation, 800)
          : null,
      whyLikely:
        Array.isArray(enhanced.evidenceFor) && enhanced.evidenceFor.length > 0
          ? enhanced.evidenceFor.slice(0, 4).map((s) => clip(String(s), 300))
          : cause.whyLikely,
      confirmRuleOut:
        Array.isArray(enhanced.confirmOrRuleOut) &&
        enhanced.confirmOrRuleOut.length > 0
          ? enhanced.confirmOrRuleOut
              .slice(0, 4)
              .map((s) => clip(String(s), 300))
          : cause.confirmRuleOut,
    };
  });

  return {
    ...result,
    mode: "ai-enhanced",
    aiProviderLabel: providerLabel,
    causes,
    overall: {
      ...result.overall,
      summary:
        typeof ai.summary === "string" && ai.summary
          ? clip(ai.summary, 1200)
          : result.overall.summary,
    },
    mechanicScript:
      typeof ai.mechanicScript === "string" && ai.mechanicScript
        ? clip(ai.mechanicScript, 1500)
        : result.mechanicScript,
    aiSafetyAdvice:
      typeof ai.safetyAdvice === "string" && ai.safetyAdvice
        ? clip(ai.safetyAdvice, 800)
        : null,
  };
}

/**
 * Try to enhance the heuristic result with the configured LLM provider.
 * Any failure (no key, timeout, bad response) falls back to the heuristic
 * result untouched — the app must never depend on the AI path.
 */
export async function enhanceWithAI(
  req: DiagnoseRequest,
  result: DiagnosisResult,
  opts?: {
    /**
     * One short sentence of device-local scan history (e.g. "Second report of
     * a similar noise on this vehicle"), supplied by the client. Prompt-only:
     * it personalizes the prose and never touches ranking or safety.
     */
    ownerContext?: string | null;
  }
): Promise<DiagnosisResult> {
  const provider = resolveProvider();
  if (!provider || result.causes.length === 0) return result;
  const ownerContext = opts?.ownerContext ?? null;

  try {
    const enhancement =
      provider.name === "anthropic"
        ? await enhanceWithAnthropic(
            provider.apiKey,
            req,
            result,
            provider.model,
            ownerContext
          )
        : provider.name === "openrouter"
          ? await enhanceWithOpenRouter(
              provider.apiKey,
              req,
              result,
              provider.model,
              ownerContext
            )
          : await enhanceWithOpenAI(
              provider.apiKey,
              req,
              result,
              provider.model,
              ownerContext
            );
    return mergeEnhancement(result, enhancement, provider.label);
  } catch (err) {
    console.error(
      `[revsense] AI enhancement failed (${provider.name}), serving heuristic result:`,
      err instanceof Error ? err.message : err
    );
    return result;
  }
}
