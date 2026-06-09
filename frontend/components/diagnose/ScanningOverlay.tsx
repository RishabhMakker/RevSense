"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Gauge } from "lucide-react";
import { KNOWN_ISSUE_COUNT } from "@revsense/backend";

interface ScanningOverlayProps {
  aiConfigured: boolean;
  aiProviderLabel: string | null;
}

export function ScanningOverlay({
  aiConfigured,
  aiProviderLabel,
}: ScanningOverlayProps) {
  const stages = [
    "Extracting acoustic features…",
    `Matching against ${KNOWN_ISSUE_COUNT} known failure patterns…`,
    "Weighing vehicle age and mileage…",
    "Scanning for safety red flags…",
    ...(aiConfigured
      ? [`Asking ${aiProviderLabel ?? "AI"} for a clearer explanation…`]
      : ["Compiling triage report…"]),
  ];
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex((i) => Math.min(i + 1, stages.length - 1));
    }, aiConfigured ? 2400 : 900);
    return () => clearInterval(interval);
  }, [aiConfigured, stages.length]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-strong mx-auto w-full max-w-xl rounded-3xl p-10 text-center"
    >
      <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
        <div className="absolute inset-0 animate-spin-slow rounded-full border border-dashed border-amber-400/40" />
        <div className="absolute inset-2 rounded-full border border-white/5" />
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-[0_0_36px_-8px_rgba(245,158,11,0.9)]">
          <Gauge className="h-7 w-7 text-ink-950" />
        </span>
      </div>

      <h2 className="mt-7 text-lg font-semibold text-white">
        Running diagnosis
      </h2>

      <div className="relative mx-auto mt-5 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-white/5">
        <div className="scan-sweep absolute inset-y-0 w-1/3 rounded-full bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
      </div>

      <div className="mt-5 h-6">
        <motion.p
          key={stageIndex}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-mono text-sm text-zinc-400"
        >
          {stages[stageIndex]}
        </motion.p>
      </div>
    </motion.div>
  );
}
