import type { CaseOutcome, Summary } from "./metrics";

function line(label: string, value: string): string {
  return `  ${label.padEnd(26)} ${value}`;
}

/** Plain-text benchmark report: overall metrics, per-tag table, worst misses. */
export function formatReport(
  label: string,
  summary: Summary,
  outcomes: CaseOutcome[],
  maxMisses = 10
): string {
  const out: string[] = [];
  out.push(`\n══ RevSense engine benchmark — ${label} ══`);
  out.push(line("cases", String(summary.cases)));
  out.push(
    line(
      "top-1 accuracy",
      `${summary.top1.pct}%  (${summary.top1.hits}/${summary.top1.total})`
    )
  );
  out.push(
    line(
      "top-3 accuracy",
      `${summary.top3.pct}%  (${summary.top3.hits}/${summary.top3.total})`
    )
  );
  out.push(line("MRR", String(summary.mrr)));
  out.push(line("median top confidence", `${summary.medianTopConfidence}%`));
  out.push(line("cases with violations", String(summary.violationCases)));
  out.push(line("safety violations", String(summary.safetyViolationCases)));

  const tags = Object.entries(summary.perTag).sort(([a], [b]) =>
    a.localeCompare(b)
  );
  out.push("\n  per-tag (top-1 hits / pinned · violation cases · cases):");
  for (const [tag, t] of tags) {
    const acc =
      t.top1Total > 0 ? `${t.top1Hits}/${t.top1Total}` : "  -  ";
    out.push(
      `    ${tag.padEnd(20)} ${acc.padEnd(8)} viol ${String(
        t.violationCases
      ).padEnd(4)} n=${t.cases}`
    );
  }

  const misses = outcomes
    .filter((o) => o.violations.length > 0)
    .sort(
      (a, b) =>
        b.safetyViolations.length - a.safetyViolations.length ||
        (a.reciprocalRank ?? 1) - (b.reciprocalRank ?? 1)
    )
    .slice(0, maxMisses);
  if (misses.length > 0) {
    out.push(`\n  worst misses (${misses.length} shown):`);
    for (const m of misses) {
      out.push(`    ✗ ${m.evalCase.id} [${m.evalCase.tags.join(",")}]`);
      for (const v of m.violations) out.push(`        ${v}`);
      const top = m.result.causes
        .slice(0, 3)
        .map((c) => `${c.id}(${c.confidence})`)
        .join(", ");
      out.push(`        top-3: ${top}`);
    }
  }
  return out.join("\n");
}
