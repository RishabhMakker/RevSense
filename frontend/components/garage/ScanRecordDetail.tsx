"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, ShieldCheck, X } from "lucide-react";
import {
  SOUND_CONTEXT_LABELS,
  type SafeToDrive,
  type Severity,
  type SoundContext,
} from "@revsense/backend";
import { confidenceColor, SEVERITY_STYLES, VERDICT_STYLES } from "@/lib/ui";
import type { ScanRecord } from "@/lib/storage/types";

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Re-opens a past diagnosis from the stored summary only — enough to recall the
 * verdict and the top causes, without keeping the full report around.
 */
export function ScanRecordDetail({
  scan,
  onClose,
}: {
  scan: ScanRecord;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const verdict =
    VERDICT_STYLES[scan.overall.safeToDrive as SafeToDrive] ??
    VERDICT_STYLES.caution;
  const severity =
    SEVERITY_STYLES[scan.overall.severity as Severity] ??
    SEVERITY_STYLES.moderate;
  const VerdictIcon =
    scan.overall.safeToDrive === "yes" ? ShieldCheck : ShieldAlert;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Saved diagnosis recap"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong max-h-[85vh] w-full max-w-lg overflow-auto rounded-t-3xl p-6 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
              Saved recap
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              {formatWhen(scan.createdAt)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-300 transition-colors hover:bg-white/[0.08] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span
            className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold ${verdict.badge}`}
          >
            <VerdictIcon className="h-4 w-4" />
            {scan.overall.verdict}
          </span>
          <span
            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${severity.chip}`}
          >
            {severity.label} severity
          </span>
        </div>

        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Your description
          </p>
          <p className="mt-1.5 text-sm italic leading-relaxed text-zinc-200">
            &ldquo;{scan.symptomText}&rdquo;
          </p>
        </div>

        {scan.contexts.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              When it happens
            </p>
            <p className="mt-1.5 text-sm text-zinc-300">
              {scan.contexts
                .map((c) => SOUND_CONTEXT_LABELS[c as SoundContext] ?? c)
                .join(" · ")}
            </p>
          </div>
        )}

        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Likely causes
          </p>
          <ul className="mt-2.5 space-y-3">
            {scan.topCauses.map((cause, i) => (
              <li key={cause.id} className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/5 font-mono text-xs font-bold text-zinc-400">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {cause.title}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2.5">
                    <div className="h-1.5 max-w-40 flex-1 overflow-hidden rounded-full bg-white/5">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${confidenceColor(cause.confidence)}`}
                        style={{ width: `${cause.confidence}%` }}
                      />
                    </div>
                    <span className="shrink-0 font-mono text-[11px] text-zinc-400">
                      {cause.confidence}% match
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-5 text-xs leading-relaxed text-zinc-500">
          This is a short summary of a past diagnosis. Run a new diagnosis for a
          full report and the latest guidance.
        </p>
      </motion.div>
    </div>
  );
}
