import { NextResponse } from "next/server";
import { getStaticModels } from "@/lib/vehicles/models";

export const runtime = "nodejs";
// The model catalog barely changes — cache resolved lists for a day.
export const revalidate = 86400;

const NHTSA_TIMEOUT_MS = 3500;

interface NhtsaResult {
  Model_Name?: string;
}

/**
 * Resolve models for a make: the curated static bundle first (instant, always
 * available), enriched with NHTSA's long tail when reachable. NHTSA failures
 * (timeout, network, non-200) degrade silently to the static list — the Model
 * field stays usable as free text and submission is never blocked.
 */
export async function GET(request: Request) {
  const make = new URL(request.url).searchParams.get("make")?.trim() ?? "";
  if (!make) {
    return NextResponse.json({ models: [], source: "none" });
  }

  const staticModels = getStaticModels(make);

  let nhtsaModels: string[] = [];
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), NHTSA_TIMEOUT_MS);
    const res = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/${encodeURIComponent(
        make
      )}?format=json`,
      { signal: controller.signal, next: { revalidate } }
    );
    clearTimeout(timeout);
    if (res.ok) {
      const data = (await res.json()) as { Results?: NhtsaResult[] };
      nhtsaModels = (data.Results ?? [])
        .map((r) => r.Model_Name?.trim())
        .filter((m): m is string => Boolean(m));
    }
  } catch {
    // Network error, timeout, or abort — fall back to the static bundle.
  }

  // Curated, popular-first models lead; NHTSA names not already present follow.
  const seen = new Set(staticModels.map((m) => m.toLowerCase()));
  const merged = [...staticModels];
  for (const m of nhtsaModels.sort((a, b) => a.localeCompare(b))) {
    const key = m.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(m);
    }
  }

  const source =
    staticModels.length && nhtsaModels.length
      ? "static+nhtsa"
      : nhtsaModels.length
        ? "nhtsa"
        : staticModels.length
          ? "static"
          : "none";

  return NextResponse.json(
    { models: merged, source },
    {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    }
  );
}
