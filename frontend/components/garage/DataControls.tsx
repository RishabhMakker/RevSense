"use client";

import { useState } from "react";
import { AlertTriangle, Download, Lock, Trash2 } from "lucide-react";

interface DataControlsProps {
  hasData: boolean;
  onEraseAll: () => Promise<void> | void;
  onExport?: () => Promise<string>;
}

/**
 * The trust footer for any garage/history surface: the one-line privacy promise
 * plus the owner's controls over their own data (download, erase). Erase asks
 * for a second click rather than a modal — clear intent, no accidental wipes.
 */
export function DataControls({ hasData, onEraseAll, onExport }: DataControlsProps) {
  const [confirming, setConfirming] = useState(false);
  const [working, setWorking] = useState(false);

  const erase = async () => {
    setWorking(true);
    try {
      await onEraseAll();
    } finally {
      setWorking(false);
      setConfirming(false);
    }
  };

  const download = async () => {
    if (!onExport) return;
    const json = await onExport();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "revsense-garage.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glass rounded-2xl p-5">
      <p className="flex items-center gap-2 text-sm text-zinc-300">
        <Lock className="h-4 w-4 shrink-0 text-amber-400" />
        Your saved vehicles and scan history stay on this device.
      </p>

      {hasData && (
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          {onExport && (
            <button
              type="button"
              onClick={() => void download()}
              className="flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-medium text-zinc-200 transition-colors hover:bg-white/[0.08]"
            >
              <Download className="h-3.5 w-3.5" /> Download my data
            </button>
          )}

          {confirming ? (
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="flex items-center gap-1.5 text-xs text-red-200">
                <AlertTriangle className="h-3.5 w-3.5" /> Erase everything? This
                can&apos;t be undone.
              </span>
              <button
                type="button"
                onClick={() => void erase()}
                disabled={working}
                className="min-h-11 rounded-xl border border-red-400/30 bg-red-500/15 px-4 py-2.5 text-xs font-semibold text-red-100 transition-colors hover:bg-red-500/25 disabled:opacity-50"
              >
                {working ? "Erasing…" : "Yes, erase all"}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={working}
                className="min-h-11 rounded-xl px-3 py-2.5 text-xs text-zinc-400 transition-colors hover:text-white"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-medium text-zinc-300 transition-colors hover:border-red-400/30 hover:text-red-200"
            >
              <Trash2 className="h-3.5 w-3.5" /> Erase all saved data
            </button>
          )}
        </div>
      )}
    </div>
  );
}
