import { NextResponse } from "next/server";
import { type IssueCategory } from "@revsense/backend";
import {
  buildCategoryWeights,
  mapRecallCategories,
} from "@/lib/priors/mapComponents";

export const runtime = "nodejs";
// Recall/complaint data for a given make/model/year barely moves day to day.
export const revalidate = 86400;

const NHTSA_TIMEOUT_MS = 3500;
const CLIP_LEN = 200;

interface ComplaintResult {
  components?: string;
}

interface RecallResult {
  Component?: string;
  Summary?: string;
  Consequence?: string;
  Remedy?: string;
  ReportReceivedDate?: string;
}

/**
 * Vehicle-specific priors from the free NHTSA complaint + recall APIs. Both are
 * fetched in parallel and every failure path (timeout, network, non-200, empty)
 * degrades to `{ priors: null, recalls: [] }` — this endpoint never returns 5xx,
 * so it can never break or slow a diagnosis.
 *
 * NOTE: the `priors` object is built to match the `VehiclePriors` contract in
 * `@revsense/backend`; it will be annotated with that type once the engine agent
 * exports it.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const make = params.get("make")?.trim() ?? "";
  const model = params.get("model")?.trim() ?? "";
  const year = params.get("year")?.trim() ?? "";

  if (!make || !model || !year) {
    return NextResponse.json({ priors: null, recalls: [] });
  }

  const query = `make=${encodeURIComponent(make)}&model=${encodeURIComponent(
    model
  )}&modelYear=${encodeURIComponent(year)}`;

  const [complaints, recalls] = await Promise.allSettled([
    fetchJson(`https://api.nhtsa.gov/complaints/complaintsByVehicle?${query}`),
    fetchJson(`https://api.nhtsa.gov/recalls/recallsByVehicle?${query}`),
  ]);

  // Complaints → per-category density.
  const complaintComponents: string[] = [];
  if (complaints.status === "fulfilled" && complaints.value) {
    for (const result of (complaints.value.results ?? []) as ComplaintResult[]) {
      if (result.components) complaintComponents.push(result.components);
    }
  }

  // Recalls → categories with an open recall, plus a display list.
  const recallResults: RecallResult[] =
    recalls.status === "fulfilled" && recalls.value
      ? ((recalls.value.results ?? []) as RecallResult[])
      : [];
  const recallComponents = recallResults
    .map((r) => r.Component ?? "")
    .filter(Boolean);

  const categoryWeights = buildCategoryWeights(complaintComponents);
  const recallCategories: IssueCategory[] = mapRecallCategories(recallComponents);

  const hasPriors =
    Object.keys(categoryWeights).length > 0 || recallCategories.length > 0;
  const priors = hasPriors
    ? {
        categoryWeights,
        recallCategories,
        source: "nhtsa" as const,
        fetchedAt: new Date().toISOString(),
      }
    : null;

  const recallsDisplay = recallResults
    .slice()
    .sort(
      (a, b) =>
        parseNhtsaDate(b.ReportReceivedDate) - parseNhtsaDate(a.ReportReceivedDate)
    )
    .slice(0, 3)
    .map((r) => ({
      component: humanizeComponent(r.Component ?? "Recall"),
      summary: clip(r.Summary ?? ""),
      consequence: clip(r.Consequence ?? ""),
    }));

  return NextResponse.json(
    { priors, recalls: recallsDisplay },
    {
      headers: {
        "Cache-Control":
          "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    }
  );
}

async function fetchJson(
  url: string
): Promise<{ results?: unknown[] } | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(NHTSA_TIMEOUT_MS),
      next: { revalidate },
    });
    if (!res.ok) return null;
    return (await res.json()) as { results?: unknown[] };
  } catch {
    // Timeout, network error, or bad JSON — treated as "no data".
    return null;
  }
}

function clip(text: string): string {
  const trimmed = text.trim();
  return trimmed.length <= CLIP_LEN
    ? trimmed
    : `${trimmed.slice(0, CLIP_LEN - 1).trimEnd()}…`;
}

/** "POWER TRAIN:AUTOMATIC TRANSMISSION:..." → "Power train". */
function humanizeComponent(component: string): string {
  const segment = (component.split(/[:,]/)[0] ?? "").trim();
  if (!segment) return "Recall";
  return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase();
}

/** NHTSA dates are DD/MM/YYYY; fall back to Date.parse, then to 0. */
function parseNhtsaDate(value?: string): number {
  if (!value) return 0;
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) {
    const [, dd, mm, yyyy] = match;
    return new Date(Number(yyyy), Number(mm) - 1, Number(dd)).getTime();
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}
