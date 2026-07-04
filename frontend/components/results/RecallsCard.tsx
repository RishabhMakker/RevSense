"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ShieldQuestion } from "lucide-react";
import type { RecallNotice } from "@/lib/api";

/**
 * Open recalls for the vehicle (NHTSA data). Deliberately calm — this is
 * safety-adjacent context, not an alarm — and always makes the practical point
 * that recall repairs are free at a dealer. `notice` is the engine's one-line
 * summary when present; the list is a collapsible detail.
 */
export function RecallsCard({
  recalls,
  notice,
}: {
  recalls: RecallNotice[];
  notice?: string | null;
}) {
  const [open, setOpen] = useState(false);
  if (recalls.length === 0 && !notice) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-amber-400/25 bg-amber-500/[0.05] p-5"
    >
      <p className="flex items-center gap-2 text-sm font-semibold text-amber-200">
        <ShieldQuestion className="h-4.5 w-4.5 shrink-0" aria-hidden />
        Open recalls for your vehicle
      </p>
      <p className="mt-2 text-sm leading-relaxed text-zinc-300">
        {notice
          ? notice
          : "Reported open recalls for your make, model, and year (NHTSA data). These may be unrelated to your noise, but recall repairs are always free at a dealer — worth booking regardless."}
      </p>

      {recalls.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="mt-3 flex items-center gap-1.5 text-xs font-medium text-amber-300 transition-colors hover:text-amber-200"
          >
            {open ? "Hide" : "See"} {recalls.length} recall
            {recalls.length > 1 ? "s" : ""}
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
            />
          </button>

          {open && (
            <ul className="mt-3 space-y-3">
              {recalls.map((recall, i) => (
                <li
                  key={`${recall.component}-${i}`}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5"
                >
                  <p className="text-sm font-medium text-white">
                    {recall.component}
                  </p>
                  {recall.summary && (
                    <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                      {recall.summary}
                    </p>
                  )}
                  {recall.consequence && (
                    <p className="mt-1.5 text-xs leading-relaxed text-zinc-300">
                      <span className="font-medium text-zinc-200">
                        What can happen:{" "}
                      </span>
                      {recall.consequence}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-zinc-500">
            The fix for an open recall is free at a franchised dealer.
          </p>
        </>
      )}
    </motion.div>
  );
}
