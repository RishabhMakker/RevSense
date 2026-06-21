import { NextResponse } from "next/server";
import {
  diagnose,
  diagnoseRequestSchema,
  enhanceWithAI,
  interpretWithAI,
} from "@revsense/backend";

export const runtime = "nodejs";
// Allow headroom for the optional LLM call on Vercel.
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
  const interpreted = await interpretWithAI(parsed.data);
  const heuristic = diagnose(parsed.data, interpreted);
  // Then AI (optional) rewrites the explanations for the ranked causes.
  const result = await enhanceWithAI(parsed.data, heuristic);
  return NextResponse.json(result);
}
