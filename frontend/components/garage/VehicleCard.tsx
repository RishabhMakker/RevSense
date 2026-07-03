"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Car,
  Check,
  ChevronDown,
  Gauge,
  History,
  Pencil,
  ShieldAlert,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import type { EngineType, SafeToDrive } from "@revsense/backend";
import { inputClass, VERDICT_STYLES } from "@/lib/ui";
import type { SavedVehicle, ScanRecord } from "@/lib/storage/types";
import { vehicleDisplayName, vehicleSpecLabel } from "@/lib/storage/vehicles";
import { ScanRecordDetail } from "./ScanRecordDetail";

const ENGINE_LABELS: Record<EngineType, string> = {
  gasoline: "Gasoline",
  diesel: "Diesel",
  hybrid: "Hybrid",
  electric: "Electric",
  unknown: "",
};

function relativeTime(iso: string | null): string {
  if (!iso) return "No scans yet";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) return "Last scan today";
  if (days === 1) return "Last scan yesterday";
  if (days < 7) return `Last scan ${days} days ago`;
  const weeks = Math.round(days / 7);
  if (weeks < 5) return `Last scan ${weeks} week${weeks > 1 ? "s" : ""} ago`;
  const months = Math.round(days / 30);
  return `Last scan ${months} month${months > 1 ? "s" : ""} ago`;
}

function scanDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface VehicleCardProps {
  vehicle: SavedVehicle;
  scans: ScanRecord[];
  onUpdate: (patch: Partial<SavedVehicle>) => Promise<void>;
  onDelete: () => Promise<void>;
}

export function VehicleCard({
  vehicle,
  scans,
  onUpdate,
  onDelete,
}: VehicleCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState(vehicle.nickname ?? "");
  const [mileage, setMileage] = useState(
    vehicle.mileage != null ? String(vehicle.mileage) : ""
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [openScan, setOpenScan] = useState<ScanRecord | null>(null);

  const engineLabel = ENGINE_LABELS[vehicle.engineType];

  const saveEdits = async () => {
    const trimmed = nickname.trim();
    const parsedMileage = mileage.trim() ? Number(mileage) : null;
    await onUpdate({
      nickname: trimmed ? trimmed : null,
      mileage:
        parsedMileage != null &&
        Number.isFinite(parsedMileage) &&
        parsedMileage >= 0
          ? Math.round(parsedMileage)
          : null,
    });
    setEditing(false);
  };

  const cancelEdits = () => {
    setNickname(vehicle.nickname ?? "");
    setMileage(vehicle.mileage != null ? String(vehicle.mileage) : "");
    setEditing(false);
  };

  return (
    <div className="glass rounded-2xl">
      <div className="flex items-start gap-4 p-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
          <Car className="h-5 w-5 text-amber-300" />
        </span>

        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="space-y-3">
              <div>
                <label
                  htmlFor={`nickname-${vehicle.id}`}
                  className="text-xs font-medium text-zinc-400"
                >
                  Nickname
                </label>
                <input
                  id={`nickname-${vehicle.id}`}
                  className={`${inputClass} mt-1`}
                  value={nickname}
                  maxLength={40}
                  placeholder={vehicleSpecLabel(vehicle)}
                  onChange={(e) => setNickname(e.target.value)}
                />
              </div>
              <div>
                <label
                  htmlFor={`mileage-${vehicle.id}`}
                  className="text-xs font-medium text-zinc-400"
                >
                  Mileage
                </label>
                <input
                  id={`mileage-${vehicle.id}`}
                  className={`${inputClass} mt-1`}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={1_500_000}
                  value={mileage}
                  placeholder="e.g. 82000"
                  onChange={(e) => setMileage(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void saveEdits()}
                  className="flex min-h-11 items-center gap-1.5 rounded-xl bg-amber-500/15 px-4 py-2 text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-500/25"
                >
                  <Check className="h-3.5 w-3.5" /> Save
                </button>
                <button
                  type="button"
                  onClick={cancelEdits}
                  className="min-h-11 rounded-xl px-3 py-2 text-xs text-zinc-400 transition-colors hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <h3 className="truncate text-base font-semibold text-white">
                {vehicleDisplayName(vehicle)}
              </h3>
              {vehicle.nickname?.trim() && (
                <p className="truncate text-sm text-zinc-400">
                  {vehicleSpecLabel(vehicle)}
                </p>
              )}
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400">
                {vehicle.mileage != null && (
                  <span className="flex items-center gap-1">
                    <Gauge className="h-3.5 w-3.5" />
                    {vehicle.mileage.toLocaleString()} miles
                  </span>
                )}
                {engineLabel && <span>{engineLabel}</span>}
                <span>{relativeTime(vehicle.lastScanAt)}</span>
              </div>
            </>
          )}
        </div>

        {!editing && (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setEditing(true)}
              aria-label="Rename or update mileage"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              aria-label="Delete vehicle"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {confirmDelete && (
        <div className="flex flex-wrap items-center gap-2.5 border-t border-white/5 px-5 py-3.5 text-xs text-red-200">
          <span>Delete this vehicle and its saved scans?</span>
          <button
            type="button"
            onClick={() => void onDelete()}
            className="min-h-11 rounded-xl border border-red-400/30 bg-red-500/15 px-3.5 py-2 font-semibold text-red-100 transition-colors hover:bg-red-500/25"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(false)}
            className="min-h-11 rounded-xl px-3 py-2 text-zinc-400 transition-colors hover:text-white"
          >
            Cancel
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-2 border-t border-white/5 px-5 py-3 text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-200"
        aria-expanded={expanded}
      >
        <span className="flex items-center gap-1.5">
          <History className="h-3.5 w-3.5" />
          {scans.length === 0
            ? "No past diagnoses"
            : `${scans.length} past ${scans.length === 1 ? "diagnosis" : "diagnoses"}`}
        </span>
        {scans.length > 0 && (
          <ChevronDown
            className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        )}
      </button>

      <AnimatePresence initial={false}>
        {expanded && scans.length > 0 && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            {scans.map((scan) => {
              const verdict =
                VERDICT_STYLES[scan.overall.safeToDrive as SafeToDrive] ??
                VERDICT_STYLES.caution;
              const VerdictIcon =
                scan.overall.safeToDrive === "yes" ? ShieldCheck : ShieldAlert;
              const top = scan.topCauses[0];
              return (
                <li key={scan.id} className="border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setOpenScan(scan)}
                    className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-white/[0.03]"
                  >
                    <span className="w-12 shrink-0 font-mono text-[11px] text-zinc-500">
                      {scanDate(scan.createdAt)}
                    </span>
                    <span
                      className={`flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${verdict.badge}`}
                    >
                      <VerdictIcon className="h-3 w-3" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-zinc-200">
                      {top ? top.title : "No clear cause"}
                    </span>
                    {top && (
                      <span className="shrink-0 font-mono text-[11px] text-zinc-500">
                        {top.confidence}%
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>

      {openScan && (
        <ScanRecordDetail scan={openScan} onClose={() => setOpenScan(null)} />
      )}
    </div>
  );
}
