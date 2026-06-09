"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  AlertOctagon,
  AudioWaveform,
  Check,
  ClipboardCopy,
  Cpu,
  Info,
  ListChecks,
  MessageSquareQuote,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { DiagnosisResult } from "@revsense/backend";
import { SEVERITY_STYLES, VERDICT_STYLES } from "@/lib/ui";
import { CauseCard } from "./CauseCard";

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
  onReset,
}: {
  result: DiagnosisResult;
  onReset: () => void;
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
            Triage report
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
            {result.vehicleLabel}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-300">
            {result.mode === "ai-enhanced" ? (
              <>
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                AI-enhanced{result.aiProviderLabel ? ` · ${result.aiProviderLabel}` : ""}
              </>
            ) : (
              <>
                <Cpu className="h-3.5 w-3.5 text-amber-400" /> Rule engine
              </>
            )}
          </span>
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-white/[0.08] hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" /> New diagnosis
          </button>
        </div>
      </div>

      {/* Verdict banner */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className={`glass-strong rounded-2xl border p-6 ${verdict.border} ${verdict.glow}`}
      >
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold ${verdict.badge}`}
          >
            <VerdictIcon className="h-4 w-4" />
            {result.overall.verdict}
          </span>
          <span
            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${severity.chip}`}
          >
            Severity: {severity.label}
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-300">
            {result.overall.urgencyLabel}
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
          className="space-y-3 rounded-2xl border border-red-400/25 bg-red-500/[0.07] p-5"
        >
          <p className="flex items-center gap-2 text-sm font-semibold text-red-200">
            <AlertOctagon className="h-4.5 w-4.5" /> Safety alerts from your description
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
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Likely causes, ranked
          </h2>
          {result.causes.map((cause) => (
            <CauseCard
              key={cause.id}
              cause={cause}
              defaultOpen={cause.rank === 1}
            />
          ))}
        </div>

        {/* Side rail */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Your action plan
          </h2>

          <SideCard icon={ListChecks} title="What to check first">
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
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-medium text-zinc-200 transition-colors hover:bg-white/[0.08]"
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

          {result.audioSummary && (
            <SideCard icon={AudioWaveform} title="Acoustic clues">
              {result.audioSummary.hintLabels.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {result.audioSummary.hintLabels.map((label) => (
                    <span
                      key={label}
                      className="rounded-full border border-amber-400/25 bg-amber-500/10 px-2.5 py-1 text-[11px] text-amber-200"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              )}
              <ul className="space-y-1.5 text-xs text-zinc-400">
                {result.audioSummary.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </SideCard>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
        <p className="text-xs leading-relaxed text-zinc-500">
          {result.disclaimer}
        </p>
      </div>
    </motion.div>
  );
}
