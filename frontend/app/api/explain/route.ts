import { NextResponse } from "next/server";
import {
  diagnoseRequestSchema,
  enhanceWithAI,
  type DiagnosisResult,
} from "@revsense/backend";

export const runtime = "nodejs";
// The explanation LLM call gets its own time budget, separate from the
// interpret call in /api/diagnose, so neither can starve the other.
export const maxDuration = 60;

/**
 * Deferred AI explanation: takes the request + the already-ranked heuristic
 * result and returns it with LLM-written explanations merged in. Kept separate
 * from /api/diagnose so the diagnosis renders instantly and the (slower) prose
 * fills in afterward. No key / failure → the heuristic result is returned
 * unchanged.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const {
    request: reqData,
    result,
    ownerContext: rawOwnerContext,
  } = (body ?? {}) as {
    request?: unknown;
    result?: DiagnosisResult;
    ownerContext?: unknown;
  };
  // Optional device-local history sentence — personalizes the AI prose only.
  const ownerContext =
    typeof rawOwnerContext === "string" && rawOwnerContext.trim()
      ? rawOwnerContext.trim().slice(0, 300)
      : null;

  const parsed = diagnoseRequestSchema.safeParse(reqData);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid diagnosis request." },
      { status: 400 }
    );
  }
  if (!result || !Array.isArray(result.causes)) {
    return NextResponse.json(
      { error: "Missing or malformed diagnosis result." },
      { status: 400 }
    );
  }

  const enhanced = await enhanceWithAI(parsed.data, result, { ownerContext });
  return NextResponse.json(enhanced);
}
