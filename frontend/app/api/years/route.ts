import { NextResponse } from "next/server";
import {
  getOpenYears,
  getStaticYearRange,
  yearsFromRange,
} from "@/lib/vehicles/years";

export const runtime = "nodejs";
// Year ranges effectively only change once a year — cache aggressively.
export const revalidate = 86400;

/**
 * Resolve selectable production years for a make + model. Mirrors /api/models:
 * the curated static bundle is the authoritative source, and anything outside
 * it (long tail, unknown make/model, missing data) degrades to the permissive
 * open range so the field is never empty and submission is never blocked.
 *
 * Deliberately NO NHTSA call here. vPIC has no "years for a make+model"
 * endpoint — deriving one means enumerating GetModelsForMakeYear across every
 * year (slow, sometimes times out) and vPIC only covers model years >= 1995,
 * so it can't confirm the classic range the schema allows. Narrowing the list
 * from incomplete NHTSA data would risk wrongly excluding a valid year, so the
 * route stays curated-first + permissive-fallback. It's the clean seam for a
 * real long-tail year dataset later. This handler never throws to the client.
 */
export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const make = params.get("make")?.trim() ?? "";
    const model = params.get("model")?.trim() ?? "";

    if (make && model) {
      const range = getStaticYearRange(make, model);
      if (range) {
        return years(
          yearsFromRange(range.start, range.end),
          range,
          "static"
        );
      }
    }

    // Long tail / unknown / missing — permissive open range, never blocking.
    return years(getOpenYears(), null, "fallback");
  } catch {
    return years(getOpenYears(), null, "fallback");
  }
}

function years(
  list: number[],
  range: { start: number; end: number } | null,
  source: "static" | "fallback"
) {
  return NextResponse.json(
    { years: list, range, source },
    {
      headers: {
        "Cache-Control":
          "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    }
  );
}
