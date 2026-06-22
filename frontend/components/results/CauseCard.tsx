"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronDown,
  ListChecks,
  Search,
  Sparkles,
  Wrench,
} from "lucide-react";
import type { RankedCause } from "@revsense/backend";
import { confidenceColor, SEVERITY_STYLES } from "@/lib/ui";

function DetailBlock({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
        <Icon className="h-3.5 w-3.5 text-amber-400" /> {title}
      </p>
      <div className="mt-2 text-sm leading-relaxed text-zinc-300">{children}</div>
    </div>
  );
}

export function CauseCard({
  cause,
  defaultOpen = false,
  explaining = false,
}: {
  cause: RankedCause;
  defaultOpen?: boolean;
  explaining?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const severity = SEVERITY_STYLES[cause.severity];

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: cause.rank * 0.08 }}
      className="glass overflow-hidden rounded-2xl"
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-white/[0.03]"
        aria-expanded={open}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 font-mono text-sm font-bold text-amber-300">
          {cause.rank}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-white">{cause.title}</h3>
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${severity.chip}`}
            >
              {severity.label}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[11px] text-zinc-400">
              {cause.categoryLabel}
            </span>
          </div>
          <div className="mt-2.5 flex items-center gap-3">
            <div className="h-1.5 max-w-64 flex-1 overflow-hidden rounded-full bg-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${cause.confidence}%` }}
                transition={{ duration: 0.9, delay: 0.2 + cause.rank * 0.08, ease: "easeOut" }}
                className={`h-full rounded-full bg-gradient-to-r ${confidenceColor(cause.confidence)}`}
              />
            </div>
            <span className="shrink-0 font-mono text-xs text-amber-300">
              {cause.confidence}% match
            </span>
          </div>
        </div>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="space-y-5 border-t border-white/5 p-5">
              <p className="text-sm leading-relaxed text-zinc-300">
                {cause.description}
              </p>

              {cause.aiNote ? (
                <div className="rounded-xl border border-amber-400/20 bg-amber-500/[0.06] p-4">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-300">
                    <Sparkles className="h-3.5 w-3.5" /> AI explanation
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-200">
                    {cause.aiNote}
                  </p>
                </div>
              ) : explaining ? (
                <div className="rounded-xl border border-amber-400/20 bg-amber-500/[0.06] p-4">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-300">
                    <Sparkles className="h-3.5 w-3.5 animate-pulse" /> AI explanation
                  </p>
                  <div className="mt-3 space-y-2">
                    <div className="h-2.5 w-full animate-pulse rounded bg-white/10" />
                    <div className="h-2.5 w-11/12 animate-pulse rounded bg-white/10" />
                    <div className="h-2.5 w-3/4 animate-pulse rounded bg-white/10" />
                  </div>
                </div>
              ) : null}

              <DetailBlock icon={CheckCircle2} title="Why this fits your report">
                <ul className="space-y-1.5">
                  {cause.whyLikely.map((reason) => (
                    <li key={reason} className="flex gap-2">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </DetailBlock>

              <DetailBlock icon={Search} title="How to confirm or rule out">
                <ul className="space-y-1.5">
                  {cause.confirmRuleOut.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-zinc-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </DetailBlock>

              <DetailBlock icon={ListChecks} title="Check first">
                <ul className="space-y-1.5">
                  {cause.checksFirst.map((check) => (
                    <li key={check} className="flex gap-2">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-emerald-400" />
                      {check}
                    </li>
                  ))}
                </ul>
              </DetailBlock>

              <DetailBlock icon={Wrench} title="Likely repair">
                <p>{cause.repairDirection}</p>
                <div className="mt-2.5 flex flex-wrap gap-2 text-[11px]">
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-zinc-300">
                    {cause.repairDifficultyLabel}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-zinc-300">
                    Urgency: {cause.urgencyLabel}
                  </span>
                </div>
              </DetailBlock>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
