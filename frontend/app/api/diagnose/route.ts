import { NextResponse } from "next/server";
import {
  diagnose,
  diagnoseRequestSchema,
  interpretWithAI,
} from "@revsense/backend";

export const runtime = "nodejs";
// Allow headroom for the optional interpret LLM call on Vercel. The heavier
// explanation step runs in a separate /api/explain request so the two AI
// calls never share one serverless time budget.
export const maxDuration = 60;

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

  const parsed = diagnoseRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid diagnosis request.",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }

  // Nothing is persisted: the request is scored in-memory and discarded.
  // AI (optional) first translates the free text into the engine's vocabulary
  // so the *ranking* benefits from it; the engine still does all the scoring.
  // The prose-explanation step is deferred to /api/explain so this response
  // returns the moment the diagnosis is ready.
  const interpreted = await interpretWithAI(parsed.data);
  const result = diagnose(parsed.data, interpreted);
  return NextResponse.json(result);
}
