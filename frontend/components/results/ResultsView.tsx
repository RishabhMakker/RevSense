"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  AlertOctagon,
  Check,
  ClipboardCopy,
  Info,
  ListChecks,
  MessageSquareQuote,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { type DiagnosisResult } from "@revsense/backend";
import { SEVERITY_STYLES, VERDICT_STYLES } from "@/lib/ui";
import type { SavedVehicle } from "@/lib/storage/types";
import type { Recurrence } from "@/lib/storage/recurrence";
import { CauseCard } from "./CauseCard";
import { RecurrenceBanner } from "./RecurrenceBanner";
import { SaveVehicleCard } from "./SaveVehicleCard";

/** Personalization the wizard threads in — all optional, all fail-silent. */
export interface ResultsPersonalization {
  savedVehicle: SavedVehicle | null;
  onSaveVehicle: () => void;
  saving: boolean;
  recurrence: Recurrence | null;
}

function SideCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass rounded-2xl p-5">
      <p className="flex items-center gap-2 text-sm font-semibold text-white">
        <Icon className="h-4 w-4 text-amber-400" /> {title}
      </p>
      <div className="mt-3 text-sm leading-relaxed text-zinc-300">{children}</div>
    </div>
  );
}

export function ResultsView({
  result,
  explaining = false,
  onReset,
  personalization,
}: {
  result: DiagnosisResult;
  explaining?: boolean;
  onReset: () => void;
  personalization?: ResultsPersonalization;
}) {
  const [copied, setCopied] = useState(false);
  const verdict = VERDICT_STYLES[result.overall.safeToDrive];
  const severity = SEVERITY_STYLES[result.overall.severity];
  const VerdictIcon =
    result.overall.safeToDrive === "yes" ? ShieldCheck : ShieldAlert;

  const copyScript = async () => {
    try {
      await navigator.clipboard.writeText(result.mechanicScript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — ignore
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
            Your diagnosis
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
            {result.vehicleLabel}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {explaining && (
            <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-300">
              <Sparkles className="h-3.5 w-3.5 animate-pulse text-amber-400" />
              Adding detail…
            </span>
          )}
          <button
            type="button"
            onClick={onReset}
            className="flex min-h-11 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-white/[0.08] hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" /> New diagnosis
          </button>
        </div>
      </div>

      {/* Verdict banner */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        role={result.overall.safeToDrive === "no" ? "alert" : "status"}
        aria-live={result.overall.safeToDrive === "no" ? "assertive" : "polite"}
        className={`glass-strong rounded-2xl border p-6 ${verdict.border} ${verdict.glow}`}
      >
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold ${verdict.badge}`}
          >
            <VerdictIcon className="h-4 w-4" />
            {result.overall.verdict}
          </span>
          {/* Complementary detail, not a second copy of the verdict. The
              urgency label used to sit here too, but it just restated the
              verdict's action — so we keep severity (how serious) and drop it. */}
          <span
            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${severity.chip}`}
          >
            {severity.label} severity
          </span>
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-zinc-200 sm:text-base">
          {result.overall.summary}
        </p>
        {result.aiSafetyAdvice && (
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-400">
            {result.aiSafetyAdvice}
          </p>
        )}
      </motion.div>

      {/* Red flags */}
      {result.redFlags.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          role="alert"
          className="space-y-3 rounded-2xl border border-red-400/25 bg-red-500/[0.07] p-5"
        >
          <p className="flex items-center gap-2 text-sm font-semibold text-red-200">
            <AlertOctagon className="h-4.5 w-4.5" /> Safety alerts
          </p>
          {result.redFlags.map((flag) => (
            <div key={flag.id} className="rounded-xl bg-red-500/[0.08] p-3.5">
              <p className="text-sm font-medium text-red-100">{flag.label}</p>
              <p className="mt-1 text-sm leading-relaxed text-red-200/80">
                {flag.message}
              </p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Recurring-noise heads-up (saved vehicles only) */}
      {personalization?.recurrence && (
        <RecurrenceBanner recurrence={personalization.recurrence} />
      )}

      {/* Input-quality note */}
      {result.inputQuality.note && (
        <div className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-400">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          {result.inputQuality.note}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Ranked causes */}
        <div className="space-y-4 lg:col-span-2">
          <div className="space-y-3">
            <h2 className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xl font-semibold tracking-tight text-white underline decoration-amber-400/70 decoration-2 underline-offset-4 sm:text-2xl">
              Likely causes, ranked
            </h2>
            <div className="rounded-xl border border-amber-400/25 bg-amber-500/[0.05] px-4 py-3.5">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-300">
                <Info className="h-3.5 w-3.5" aria-hidden="true" /> How to read this
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-zinc-300">
                Higher % means your symptoms matched that issue more closely, which
                drives the ranking. Use it to compare causes, not as odds that the part
                is broken. Your mechanic confirms what&apos;s actually wrong.
              </p>
            </div>
          </div>
          {result.causes.map((cause) => (
            <CauseCard
              key={cause.id}
              cause={cause}
              defaultOpen={cause.rank === 1}
              explaining={explaining}
            />
          ))}
        </div>

        {/* Side rail */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Your action plan
          </h2>

          <SideCard icon={ListChecks} title="What to check first">
            <p className="mb-3 text-xs leading-relaxed text-zinc-400">
              Quick checks, in priority order, that you or your mechanic can run
              to help confirm or narrow down the likely cause — before paying
              for a full diagnosis.
            </p>
            <ol className="space-y-2.5">
              {result.whatToCheckFirst.map((check, i) => (
                <li key={check} className="flex gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/15 font-mono text-[11px] font-bold text-amber-300">
                    {i + 1}
                  </span>
                  {check}
                </li>
              ))}
            </ol>
          </SideCard>

          <SideCard icon={MessageSquareQuote} title="What to tell your mechanic">
            <p className="rounded-xl bg-black/30 p-3.5 font-mono text-xs leading-relaxed text-zinc-300">
              &ldquo;{result.mechanicScript}&rdquo;
            </p>
            <button
              type="button"
              onClick={() => void copyScript()}
              className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-medium text-zinc-200 transition-colors hover:bg-white/[0.08]"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" /> Copied
                </>
              ) : (
                <>
                  <ClipboardCopy className="h-3.5 w-3.5" /> Copy script
                </>
              )}
            </button>
          </SideCard>
        </div>
      </div>

      {/* Keep this vehicle for a faster, more personal start next time */}
      {personalization && (
        <SaveVehicleCard
          savedVehicle={personalization.savedVehicle}
          onSave={personalization.onSaveVehicle}
          saving={personalization.saving}
        />
      )}

      {/* Disclaimer */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
        <p className="text-xs leading-relaxed text-zinc-400">
          {result.disclaimer}
        </p>
      </div>
    </motion.div>
  );
}
