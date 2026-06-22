import Anthropic from "@anthropic-ai/sdk";
import {
  SOUND_CONTEXTS,
  SOUND_CONTEXT_LABELS,
  type DiagnoseRequest,
  type SoundContext,
} from "../schemas";
import { SOUND_TYPES, type SoundType } from "../lexicon";

/**
 * AI symptom interpreter — the *input* layer.
 *
 * The rule-based engine scores a fixed vocabulary of sound types and driving
 * contexts, matched from the user's text by prefix-stem regexes. Real people
 * describe noises in ways the lexicon misses ("a pack of cards in bike
 * spokes" = clicking). This layer translates free text into the engine's
 * controlled vocabulary so good matches aren't lost to wording.
 *
 * It is strictly a translator: it may only emit sound types / contexts from
 * the allowed enums, never diagnoses, never ranks, and never touches safety.
 * The engine still does all scoring. If it fails, the engine runs on the
 * user's literal words exactly as before.
 */

export interface InterpretedSignals {
  soundTypes: SoundType[];
  contexts: SoundContext[];
  rationale: string;
}

type ProviderName = "anthropic" | "openai" | "openrouter";

const OPENAI_COMPAT_BASE: Record<"openai" | "openrouter", string> = {
  openai: "https://api.openai.com/v1",
  openrouter: "https://openrouter.ai/api/v1",
};

const DEFAULT_MODELS: Record<ProviderName, string> = {
  anthropic: "claude-opus-4-8",
  openai: "gpt-4o-mini",
  openrouter: "nvidia/nemotron-3-super-120b-a12b:free",
};

const SYSTEM_PROMPT = `You are the input-understanding layer of RevSense, a car-noise triage tool. A rule-based engine scores a FIXED vocabulary of sound types and driving contexts. Your only job is to read a car owner's free-text description and map it onto that controlled vocabulary, so the engine doesn't miss matches when people use unusual or figurative wording.

Hard rules:
- Choose sound types ONLY from the allowed list. Choose contexts ONLY from the allowed list. Never output anything not on the lists.
- Include a sound type or context only if the description genuinely implies it. Favor precision over recall — when unsure, leave it out.
- Do NOT diagnose, name parts, guess causes, or rank anything. You only label what the noise sounds like and when it happens.
- "rationale" is ONE short sentence describing how you read the description (e.g. "Read 'whirring that rises with speed' as a whine during acceleration.").`;

function buildUserPrompt(req: DiagnoseRequest): string {
  const soundList = SOUND_TYPES.join(", ");
  const contextList = SOUND_CONTEXTS.map(
    (c) => `${c} (${SOUND_CONTEXT_LABELS[c]})`
  ).join(", ");
  const alreadyPicked =
    req.contexts.length > 0 ? req.contexts.join(", ") : "(none)";
  const v = req.vehicle;
  return `Vehicle: ${v.year} ${v.make} ${v.model}${
    v.mileage ? `, ${v.mileage.toLocaleString("en-US")} mi` : ""
  }, engine: ${v.engineType ?? "unknown"}.

Owner's description of the noise:
"""
${req.symptomText}
"""

Contexts the owner already selected (you may confirm and ADD any the text implies but they missed): ${alreadyPicked}

Allowed sound types: ${soundList}
Allowed contexts: ${contextList}

Return the sound types and contexts the description implies, plus your one-sentence rationale.`;
}

function buildSchema(): Record<string, unknown> {
  return {
    type: "object",
    additionalProperties: false,
    required: ["soundTypes", "contexts", "rationale"],
    properties: {
      soundTypes: {
        type: "array",
        items: { type: "string", enum: [...SOUND_TYPES] },
        description: "Canonical sound types the description implies.",
      },
      contexts: {
        type: "array",
        items: { type: "string", enum: [...SOUND_CONTEXTS] },
        description: "Driving contexts the description implies.",
      },
      rationale: {
        type: "string",
        description: "One short sentence on how the description was read.",
      },
    },
  };
}

/** Free models sometimes wrap JSON in fences/prose — salvage the object. */
function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced?.[1] ?? text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end <= start) return candidate.trim();
  return candidate.slice(start, end + 1);
}

/** Keep only values that are valid members of the engine's enums. */
function sanitize(raw: unknown): InterpretedSignals {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const validSounds = new Set<string>(SOUND_TYPES);
  const validContexts = new Set<string>(SOUND_CONTEXTS);
  const soundTypes = Array.isArray(obj.soundTypes)
    ? (obj.soundTypes.filter(
        (s) => typeof s === "string" && validSounds.has(s)
      ) as SoundType[])
    : [];
  const contexts = Array.isArray(obj.contexts)
    ? (obj.contexts.filter(
        (c) => typeof c === "string" && validContexts.has(c)
      ) as SoundContext[])
    : [];
  const rationale =
    typeof obj.rationale === "string" ? obj.rationale.slice(0, 300) : "";
  return {
    soundTypes: [...new Set(soundTypes)],
    contexts: [...new Set(contexts)],
    rationale,
  };
}

async function interpretViaAnthropic(
  apiKey: string,
  req: DiagnoseRequest,
  model?: string
): Promise<unknown> {
  const client = new Anthropic({ apiKey, timeout: 20_000, maxRetries: 1 });
  const response = await client.messages.create({
    model: model || DEFAULT_MODELS.anthropic,
    max_tokens: 1024,
    output_config: {
      effort: "low",
      format: { type: "json_schema", schema: buildSchema() },
    },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserPrompt(req) }],
  });
  const text = response.content.find((b) => b.type === "text")?.text;
  if (!text) throw new Error("Anthropic interpret response had no text block");
  return JSON.parse(text);
}

async function interpretViaOpenAICompat(
  provider: "openai" | "openrouter",
  apiKey: string,
  req: DiagnoseRequest,
  model?: string
): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    const res = await fetch(
      `${OPENAI_COMPAT_BASE[provider]}/chat/completions`,
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          ...(provider === "openrouter" ? { "X-Title": "RevSense" } : {}),
        },
        body: JSON.stringify({
          model: model || DEFAULT_MODELS[provider],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "revsense_interpretation",
              strict: true,
              schema: buildSchema(),
            },
          },
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: buildUserPrompt(req) },
          ],
        }),
      }
    );
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `${provider} interpret error ${res.status}: ${body.slice(0, 200)}`
      );
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error(`${provider} interpret response had no content`);
    return JSON.parse(extractJson(text));
  } finally {
    clearTimeout(timer);
  }
}

export async function interpretSymptom(
  provider: { name: ProviderName; apiKey: string; model?: string },
  req: DiagnoseRequest
): Promise<InterpretedSignals> {
  const raw =
    provider.name === "anthropic"
      ? await interpretViaAnthropic(provider.apiKey, req, provider.model)
      : await interpretViaOpenAICompat(
          provider.name,
          provider.apiKey,
          req,
          provider.model
        );
  return sanitize(raw);
}
