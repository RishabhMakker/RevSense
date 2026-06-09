import { NextResponse } from "next/server";
import { DEMO_REQUEST, diagnose } from "@revsense/backend";

export const runtime = "nodejs";

/**
 * Deterministic sample response (heuristic engine only, no AI call) so the
 * backend can be verified independently:
 *
 *   curl http://localhost:3000/api/demo
 */
export async function GET() {
  return NextResponse.json({
    request: DEMO_REQUEST,
    result: diagnose(DEMO_REQUEST),
  });
}
