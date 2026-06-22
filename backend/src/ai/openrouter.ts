import type { DiagnoseRequest, DiagnosisResult } from "../schemas";
import {
  buildResponseSchema,
  buildUserPrompt,
  causesToExplain,
  SYSTEM_PROMPT,
  type AIEnhancement,
} from "./prompt";

const DEFAULT_MODEL = "nvidia/nemotron-3-super-120b-a12b:free";

/** Free-tier models sometimes wrap JSON in markdown fences or add prose
 *  around it despite response_format — salvage the object before parsing. */
function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced?.[1] ?? text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end <= start) return candidate.trim();
  return candidate.slice(start, end + 1);
}

/**
 * Fetch-based OpenRouter provider (OpenAI-compatible API). Lets the app run
 * AI enhancement on free models (model ids ending in ":free") with no spend.
 */
export async function enhanceWithOpenRouter(
  apiKey: string,
  req: DiagnoseRequest,
  result: DiagnosisResult,
  model?: string
): Promise<AIEnhancement> {
  const causeIds = causesToExplain(result.causes).map((c) => c.id);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 40_000);

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "X-Title": "RevSense",
      },
      body: JSON.stringify({
        model: model || DEFAULT_MODEL,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "revsense_enhancement",
            strict: true,
            schema: buildResponseSchema(causeIds),
          },
        },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(req, result) },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `OpenRouter API error ${res.status}: ${body.slice(0, 300)}`
      );
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error("OpenRouter response contained no content");
    return JSON.parse(extractJson(text)) as AIEnhancement;
  } finally {
    clearTimeout(timer);
  }
}
