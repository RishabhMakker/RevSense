"use client";

import Link from "next/link";
import { ArrowRight, BookmarkCheck, BookmarkPlus, Lock } from "lucide-react";
import type { SavedVehicle } from "@/lib/storage/types";
import { vehicleDisplayName } from "@/lib/storage/vehicles";

/**
 * Post-diagnosis affordance to keep this vehicle in the on-device garage. Once
 * saved (or if it was already saved), it flips to a link back to the garage.
 */
export function SaveVehicleCard({
  savedVehicle,
  onSave,
  saving,
}: {
  savedVehicle: SavedVehicle | null;
  onSave: () => void;
  saving: boolean;
}) {
  if (savedVehicle) {
    return (
      <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl p-5">
        <p className="flex items-center gap-2 text-sm text-zinc-200">
          <BookmarkCheck className="h-4 w-4 shrink-0 text-emerald-400" />
          Saved to your garage as{" "}
          <span className="font-semibold text-white">
            {vehicleDisplayName(savedVehicle)}
          </span>
          .
        </p>
        <Link
          href="/garage"
          className="flex min-h-11 items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-medium text-zinc-200 transition-colors hover:bg-white/[0.08]"
        >
          View garage <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="glass flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5">
      <div>
        <p className="text-sm font-semibold text-white">
          Save this vehicle to your garage
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">
          <Lock className="h-3.5 w-3.5 shrink-0" /> Your saved vehicles and scan
          history stay on this device.
        </p>
      </div>
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-amber-400/40 bg-amber-500/15 px-5 py-2.5 text-sm font-semibold text-amber-200 transition-colors hover:bg-amber-500/25 disabled:opacity-50"
      >
        <BookmarkPlus className="h-4 w-4" />
        {saving ? "Saving…" : "Save this vehicle"}
      </button>
    </div>
  );
}
