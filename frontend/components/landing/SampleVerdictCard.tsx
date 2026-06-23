import { ShieldCheck } from "lucide-react";

const ROWS = [
  { label: "Worn CV joint / axle", value: 72 },
  { label: "Steering column / intermediate shaft", value: 48 },
  { label: "Worn strut mount / bearing", value: 41 },
];

/**
 * Static sample of a RevSense result. Shown beside the demo callout so visitors
 * see the kind of ranked, safety-aware diagnosis the demo scenario produces.
 */
export function SampleVerdictCard() {
  return (
    <div className="glass-float w-full rounded-2xl p-5 text-left shadow-[0_24px_80px_-32px_rgba(0,0,0,0.9)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15">
            <ShieldCheck className="h-5 w-5 text-amber-300" />
          </span>
          <div>
            <p className="text-sm font-semibold text-white">Worn CV joint / axle</p>
            <p className="text-xs text-zinc-400">
              2014 Honda Civic · clicking on low-speed turns
            </p>
          </div>
        </div>
        <span className="rounded-full border border-amber-400/30 bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-300">
          Drive gently — get it checked soon
        </span>
      </div>
      <div className="mt-4 space-y-2.5">
        {ROWS.map((row) => (
          <div key={row.label} className="flex items-center gap-3">
            <span className="w-56 shrink-0 truncate text-xs text-zinc-400">
              {row.label}
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                style={{ width: `${row.value}%` }}
              />
            </div>
            <span className="w-9 text-right font-mono text-xs text-amber-300">
              {row.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
