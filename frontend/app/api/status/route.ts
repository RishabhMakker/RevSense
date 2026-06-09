import { NextResponse } from "next/server";
import { getAIStatus, KNOWLEDGE_BASE } from "@revsense/backend";

export const runtime = "nodejs";

export async function GET() {
  const ai = getAIStatus();
  return NextResponse.json({
    ok: true,
    knownIssues: KNOWLEDGE_BASE.length,
    aiConfigured: ai.configured,
    aiProviderLabel: ai.providerLabel,
  });
}
