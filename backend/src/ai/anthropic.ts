import Anthropic from "@anthropic-ai/sdk";
import type { DiagnoseRequest, DiagnosisResult } from "../schemas";
import {
  buildResponseSchema,
  buildUserPrompt,
  causesToExplain,
  SYSTEM_PROMPT,
  type AIEnhancement,
} from "./prompt";

const DEFAULT_MODEL = "claude-opus-4-8";

export async function enhanceWithAnthropic(
  apiKey: string,
  req: DiagnoseRequest,
  result: DiagnosisResult,
  model?: string
): Promise<AIEnhancement> {
  const client = new Anthropic({
    apiKey,
    timeout: 40_000,
    maxRetries: 1,
  });

  const causeIds = causesToExplain(result.causes).map((c) => c.id);
  const response = await client.messages.create({
    model: model || DEFAULT_MODEL,
    max_tokens: 4096,
    thinking: { type: "adaptive" },
    // The heuristic engine already did the ranking; this is a focused rewrite,
    // so medium effort keeps latency acceptable inside a serverless route.
    output_config: {
      effort: "medium",
      format: {
        type: "json_schema",
        schema: buildResponseSchema(causeIds),
      },
    },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserPrompt(req, result) }],
  });

  const text = response.content.find((b) => b.type === "text")?.text;
  if (!text) throw new Error("Anthropic response contained no text block");
  return JSON.parse(text) as AIEnhancement;
}
