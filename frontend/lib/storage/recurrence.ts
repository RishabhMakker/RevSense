import type { ScanRecord } from "./types";

const RECURRENCE_WINDOW_DAYS = 90;
const DAY_MS = 86_400_000;

export interface Recurrence {
  priorScan: ScanRecord;
  /** Whole weeks since the prior scan, floored to a minimum of 1. */
  weeksAgo: number;
  /** The top-cause category both scans share, if that's what matched. */
  matchedCategory: string | null;
}

export interface CurrentScanShape {
  createdAt?: string;
  contexts: string[];
  topCauses: { category: string }[];
}

/**
 * Has this vehicle reported a similar noise recently? A prior scan qualifies
 * when it's within the window AND either shares a top-cause category or overlaps
 * on two or more driving contexts. `priorScans` should be newest-first, so the
 * first qualifying hit is the most recent one.
 */
export function detectRecurrence(
  current: CurrentScanShape,
  priorScans: ScanRecord[]
): Recurrence | null {
  const now = current.createdAt ? Date.parse(current.createdAt) : Date.now();
  const currentCategories = new Set(current.topCauses.map((c) => c.category));
  const currentContexts = new Set(current.contexts);

  for (const prior of priorScans) {
    const ageDays = (now - Date.parse(prior.createdAt)) / DAY_MS;
    if (!Number.isFinite(ageDays) || ageDays < 0 || ageDays > RECURRENCE_WINDOW_DAYS) {
      continue;
    }
    const matchedCategory =
      prior.topCauses.find((c) => currentCategories.has(c.category))?.category ??
      null;
    const overlapCount = prior.contexts.filter((c) =>
      currentContexts.has(c)
    ).length;
    if (matchedCategory || overlapCount >= 2) {
      return {
        priorScan: prior,
        weeksAgo: Math.max(1, Math.round(ageDays / 7)),
        matchedCategory,
      };
    }
  }
  return null;
}

function formatMonthDay(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "recently";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

/**
 * A short, factual sentence the AI can weave into its explanation so the write-up
 * acknowledges the history. Capped at 300 chars to match the API contract.
 */
export function buildOwnerContext(rec: Recurrence): string {
  const top = rec.priorScan.topCauses[0];
  const when = formatMonthDay(rec.priorScan.createdAt);
  const tail = top
    ? ` a scan on ${when} ranked ${top.title} first.`
    : ` a similar noise was reported on ${when}.`;
  return `Second report of a similar noise on this vehicle;${tail}`.slice(0, 300);
}
