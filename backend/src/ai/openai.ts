import type { DiagnoseRequest, DiagnosisResult } from "../schemas";
import {
  buildResponseSchema,
  buildUserPrompt,
  causesToExplain,
  SYSTEM_PROMPT,
  type AIEnhancement,
} from "./prompt";

const DEFAULT_MODEL = "gpt-4o-mini";

/**
 * Minimal fetch-based OpenAI provider (kept dependency-free; the Anthropic
 * provider is the primary, SDK-backed path).
 */
export async function enhanceWithOpenAI(
  apiKey: string,
  req: DiagnoseRequest,
  result: DiagnosisResult,
  model?: string
): Promise<AIEnhancement> {
  const causeIds = causesToExplain(result.causes).map((c) => c.id);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 40_000);

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
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
      throw new Error(`OpenAI API error ${res.status}: ${body.slice(0, 300)}`);
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error("OpenAI response contained no content");
    return JSON.parse(text) as AIEnhancement;
  } finally {
    clearTimeout(timer);
  }
}
