import Anthropic from "@anthropic-ai/sdk";
import {
  SOUND_CONTEXTS,
  SOUND_CONTEXT_LABELS,
  type DiagnoseRequest,
  type SoundContext,
} from "../schemas";
import { SOUND_TYPES, type SoundType } from "../lexicon";
import {
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
  type TemperatureDep,
} from "../modifiers";

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
  /** Sounds the text explicitly rules OUT ("it's not a grinding sound"). */
  negatedSoundTypes?: SoundType[];
  /** Contexts the text explicitly rules OUT ("never when braking"). */
  negatedContexts?: SoundContext[];
  onset?: Onset;
  frequency?: Frequency;
  speedDependence?: SpeedDependence;
  temperature?: TemperatureDep;
  load?: LoadDep;
  location?: NoiseLocation;
  /** Recent repairs/service the owner mentions — suggestive, not diagnostic. */
  recentWork?: RecentWorkArea[];
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

const SYSTEM_PROMPT = `You are the input-understanding layer of RevSense, a car-noise triage tool. A rule-based engine scores a FIXED vocabulary of sound types, driving contexts, and symptom modifiers. Your only job is to read a car owner's free-text description and map it onto that controlled vocabulary, so the engine doesn't miss signals when people use unusual or figurative wording.

Hard rules:
- Every field is enum-closed: choose values ONLY from the allowed lists. Never output anything not on the lists.
- Include a value only if the description genuinely implies it. Favor precision over recall — when unsure, use "unknown" or leave arrays empty.
- negatedSoundTypes / negatedContexts: ONLY for things the text EXPLICITLY rules out ("it is not a grind", "never happens when braking"). Absence of a mention is NOT a negation.
- recentWork: ONLY for work the owner says was actually done recently ("just had new tires fitted"). A wish or a plan is not recent work.
- speedDependence: tracks_road_speed = pitch/pace follows how fast the CAR moves (continues coasting in neutral); tracks_engine_rpm = follows the ENGINE (changes when revving in place); independent = explicitly tied to neither.
- Do NOT diagnose, name parts, guess causes, or rank anything. You only label what the noise sounds like, when it happens, and how it behaves.
- "rationale" is ONE short sentence describing how you read the description (e.g. "Read 'whirring that rises with speed' as a whine tracking road speed.").`;

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

Return the sound types and contexts the description implies, any EXPLICIT negations, the symptom modifiers (onset, frequency, speed dependence, temperature, load, location — "unknown" when not stated), any recent work mentioned, plus your one-sentence rationale.`;
}

function buildSchema(): Record<string, unknown> {
  return {
    type: "object",
    additionalProperties: false,
    required: [
      "soundTypes",
      "contexts",
      "negatedSoundTypes",
      "negatedContexts",
      "onset",
      "frequency",
      "speedDependence",
      "temperature",
      "load",
      "location",
      "recentWork",
      "rationale",
    ],
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
      negatedSoundTypes: {
        type: "array",
        items: { type: "string", enum: [...SOUND_TYPES] },
        description:
          "Sound types the text EXPLICITLY rules out. Empty unless stated.",
      },
      negatedContexts: {
        type: "array",
        items: { type: "string", enum: [...SOUND_CONTEXTS] },
        description:
          "Contexts the text EXPLICITLY rules out. Empty unless stated.",
      },
      onset: {
        type: "string",
        enum: [...ONSETS],
        description: "How the noise started, if stated.",
      },
      frequency: {
        type: "string",
        enum: [...FREQUENCIES],
        description: "How often it happens, if stated.",
      },
      speedDependence: {
        type: "string",
        enum: [...SPEED_DEPENDENCES],
        description: "Whether it tracks road speed or engine RPM, if stated.",
      },
      temperature: {
        type: "string",
        enum: [...TEMPERATURE_DEPS],
        description: "Cold-only / warm-only behavior, if stated.",
      },
      load: {
        type: "string",
        enum: [...LOAD_DEPS],
        description: "Load dependence (worse under power / coasting), if stated.",
      },
      location: {
        type: "string",
        enum: [...NOISE_LOCATIONS],
        description: "Where the noise seems to come from, if stated.",
      },
      recentWork: {
        type: "array",
        items: { type: "string", enum: [...RECENT_WORK_AREAS] },
        description:
          "Areas where the owner says work was RECENTLY done. Empty unless stated.",
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

function enumArray<T extends string>(
  value: unknown,
  allowed: readonly T[]
): T[] {
  const valid = new Set<string>(allowed);
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value.filter((v): v is T => typeof v === "string" && valid.has(v))
    ),
  ];
}

function enumValue<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T
): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

/** Keep only values that are valid members of the engine's enums. */
function sanitize(raw: unknown): InterpretedSignals {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const rationale =
    typeof obj.rationale === "string" ? obj.rationale.slice(0, 300) : "";
  return {
    soundTypes: enumArray(obj.soundTypes, SOUND_TYPES),
    contexts: enumArray(obj.contexts, SOUND_CONTEXTS),
    negatedSoundTypes: enumArray(obj.negatedSoundTypes, SOUND_TYPES),
    negatedContexts: enumArray(obj.negatedContexts, SOUND_CONTEXTS),
    onset: enumValue(obj.onset, ONSETS, "unknown"),
    frequency: enumValue(obj.frequency, FREQUENCIES, "unknown"),
    speedDependence: enumValue(obj.speedDependence, SPEED_DEPENDENCES, "unknown"),
    temperature: enumValue(obj.temperature, TEMPERATURE_DEPS, "unknown"),
    load: enumValue(obj.load, LOAD_DEPS, "unknown"),
    location: enumValue(obj.location, NOISE_LOCATIONS, "unknown"),
    recentWork: enumArray(obj.recentWork, RECENT_WORK_AREAS),
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
