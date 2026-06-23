import type { SafeToDrive, Severity } from "@revsense/backend";

export const SEVERITY_STYLES: Record<
  Severity,
  { label: string; chip: string; bar: string }
> = {
  low: {
    label: "Low",
    chip: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
    bar: "bg-emerald-400",
  },
  moderate: {
    label: "Moderate",
    chip: "bg-amber-500/15 text-amber-300 border-amber-400/30",
    bar: "bg-amber-400",
  },
  high: {
    label: "High",
    chip: "bg-orange-500/15 text-orange-300 border-orange-400/30",
    bar: "bg-orange-400",
  },
  critical: {
    label: "Critical",
    chip: "bg-red-500/15 text-red-300 border-red-400/40",
    bar: "bg-red-400",
  },
};

export const VERDICT_STYLES: Record<
  SafeToDrive,
  { badge: string; border: string; glow: string }
> = {
  yes: {
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
    border: "border-emerald-400/25",
    glow: "shadow-[0_0_60px_-18px_rgba(52,211,153,0.45)]",
  },
  caution: {
    badge: "bg-amber-500/15 text-amber-300 border-amber-400/30",
    border: "border-amber-400/25",
    glow: "shadow-[0_0_60px_-18px_rgba(251,191,36,0.45)]",
  },
  no: {
    badge: "bg-red-500/15 text-red-300 border-red-400/40",
    border: "border-red-400/30",
    glow: "shadow-[0_0_60px_-18px_rgba(248,113,113,0.5)]",
  },
};

/**
 * Shared text-input style. `min-h-11` keeps a 44px tap target on mobile without
 * changing desktop density; `text-base sm:text-sm` uses 16px on small screens
 * so iOS doesn't auto-zoom on focus, then tightens to 14px from `sm` up.
 */
export const inputClass =
  "w-full min-h-11 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-base text-white placeholder:text-zinc-400 outline-none transition-colors focus:border-amber-400/50 focus:bg-white/[0.06] sm:text-sm";

export function confidenceColor(confidence: number): string {
  if (confidence >= 55) return "from-amber-400 to-orange-500";
  if (confidence >= 35) return "from-amber-500/80 to-orange-500/80";
  return "from-zinc-400/70 to-zinc-500/70";
}

export function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
