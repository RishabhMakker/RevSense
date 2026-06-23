"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronDown,
  Info,
  Search,
  Sparkles,
  Star,
  Wrench,
} from "lucide-react";
import { EXPLAIN_CAUSE_LIMIT, type RankedCause } from "@revsense/backend";
import { confidenceColor, SEVERITY_STYLES } from "@/lib/ui";

/**
 * Tiers turn the deliberately-capped "% match" into plain, progressive language.
 * Only rank 1 is "Most likely" — every other cause steps down by confidence band.
 */
type TierKey = "most_likely" | "likely" | "possible" | "less_likely";

const TIER_STYLES: Record<
  TierKey,
  { label: string; card: string; pill: string; title: string; star: boolean }
> = {
  most_likely: {
    label: "Most likely",
    card: "ring-1 ring-amber-400/40 shadow-[0_0_40px_-22px_rgba(251,191,36,0.55)]",
    pill: "border border-amber-400/60 bg-amber-500/15 text-amber-200",
    title: "text-lg text-white",
    star: true,
  },
  likely: {
    label: "Likely",
    card: "ring-1 ring-amber-400/20",
    pill: "border border-amber-400/30 bg-amber-500/10 text-amber-300",
    title: "text-base text-white",
    star: false,
  },
  possible: {
    label: "Possible",
    card: "ring-1 ring-white/5",
    pill: "border border-white/15 bg-white/[0.06] text-zinc-300",
    title: "text-base text-white",
    star: false,
  },
  less_likely: {
    label: "Less likely",
    card: "",
    pill: "border border-white/10 bg-white/[0.02] text-zinc-400",
    title: "text-base text-zinc-100",
    star: false,
  },
};

function tierFor(cause: RankedCause): TierKey {
  if (cause.rank === 1) return "most_likely";
  if (cause.confidence >= 45) return "likely";
  if (cause.confidence >= 30) return "possible";
  return "less_likely";
}

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
  const tier = TIER_STYLES[tierFor(cause)];

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: cause.rank * 0.08 }}
      className={`glass overflow-hidden rounded-2xl ${tier.card}`}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-white/[0.03]"
        aria-expanded={open}
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-mono text-sm font-bold ${
            cause.rank === 1
              ? "bg-amber-500/20 text-amber-200 ring-1 ring-amber-400/40"
              : "bg-white/5 text-zinc-400"
          }`}
        >
          {cause.rank}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${tier.pill}`}
            >
              {tier.star && (
                <Star
                  className="h-3 w-3 fill-amber-300 text-amber-300"
                  aria-hidden="true"
                />
              )}
              {tier.label}
            </span>
            <h3 className={`font-semibold ${tier.title}`}>{cause.title}</h3>
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${severity.chip}`}
            >
              {severity.label}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[11px] text-zinc-400">
              {cause.categoryLabel}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div className="h-1.5 max-w-64 flex-1 overflow-hidden rounded-full bg-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${cause.confidence}%` }}
                transition={{
                  duration: 0.9,
                  delay: 0.2 + cause.rank * 0.08,
                  ease: "easeOut",
                }}
                className={`h-full rounded-full bg-gradient-to-r ${confidenceColor(cause.confidence)}`}
              />
            </div>
            <span
              className="flex shrink-0 items-center gap-1 font-mono text-[11px] text-zinc-400"
              title="Higher % = your symptoms matched this issue more closely. It's not how likely that part is broken."
            >
              {cause.confidence}% match
              <Info className="h-3 w-3" aria-hidden="true" />
            </span>
          </div>
        </div>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
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
                    <Sparkles className="h-3.5 w-3.5" /> More detail
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-200">
                    {cause.aiNote}
                  </p>
                </div>
              ) : explaining && cause.rank <= EXPLAIN_CAUSE_LIMIT ? (
                <div className="rounded-xl border border-amber-400/20 bg-amber-500/[0.06] p-4">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-300">
                    <Sparkles className="h-3.5 w-3.5 animate-pulse" /> More detail
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
