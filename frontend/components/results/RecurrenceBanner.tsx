"use client";

import { motion } from "framer-motion";
import { History } from "lucide-react";
import type { Recurrence } from "@/lib/storage/recurrence";

/**
 * A calm heads-up when the same vehicle reported a similar noise recently.
 * Informational, not alarming — the point is that intermittent noises still
 * deserve a look.
 */
export function RecurrenceBanner({ recurrence }: { recurrence: Recurrence }) {
  const when =
    recurrence.weeksAgo <= 1
      ? "in the past week"
      : `about ${recurrence.weeksAgo} weeks ago`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="flex items-start gap-3 rounded-2xl border border-amber-400/25 bg-amber-500/[0.06] p-5"
    >
      <History className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" aria-hidden />
      <div>
        <p className="text-sm font-semibold text-amber-200">
          You reported a similar noise on this vehicle {when}.
        </p>
        <p className="mt-1 text-sm leading-relaxed text-zinc-300">
          Recurring noises are worth a mechanic visit even if they come and go.
          It&apos;s worth mentioning that this has happened before.
        </p>
      </div>
    </motion.div>
  );
}
