"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Car, Plus } from "lucide-react";
import { getGarageRepository } from "@/lib/storage/localRepository";
import type { SavedVehicle, ScanRecord } from "@/lib/storage/types";
import { DataControls } from "./DataControls";
import { VehicleCard } from "./VehicleCard";

export function GarageView() {
  const [vehicles, setVehicles] = useState<SavedVehicle[]>([]);
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(async () => {
    const repo = getGarageRepository();
    const [v, s] = await Promise.all([repo.listVehicles(), repo.listScans()]);
    setVehicles(v);
    setScans(s);
    setLoaded(true);
  }, []);

  useEffect(() => {
    let active = true;
    const repo = getGarageRepository();
    void Promise.all([repo.listVehicles(), repo.listScans()]).then(
      ([v, s]) => {
        if (!active) return;
        setVehicles(v);
        setScans(s);
        setLoaded(true);
      }
    );
    return () => {
      active = false;
    };
  }, []);

  const updateVehicle = async (id: string, patch: Partial<SavedVehicle>) => {
    await getGarageRepository().updateVehicle(id, patch);
    await reload();
  };
  const deleteVehicle = async (id: string) => {
    await getGarageRepository().deleteVehicle(id);
    await reload();
  };
  const eraseAll = async () => {
    await getGarageRepository().eraseAll();
    await reload();
  };
  const exportAll = () => getGarageRepository().exportAll();

  const hasVehicles = vehicles.length > 0;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
            Your garage
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
            Saved vehicles &amp; past diagnoses
          </h1>
        </div>
        <Link
          href="/diagnose"
          className="flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-2.5 text-sm font-semibold text-ink-950 shadow-[0_0_24px_-8px_rgba(245,158,11,0.7)] transition-all hover:brightness-110"
        >
          <Plus className="h-4 w-4" /> New diagnosis
        </Link>
      </div>

      {loaded && !hasVehicles ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong flex flex-col items-center gap-4 rounded-3xl px-6 py-14 text-center"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10">
            <Car className="h-7 w-7 text-amber-300" />
          </span>
          <div className="space-y-1.5">
            <h2 className="text-lg font-semibold text-white">
              No saved vehicles yet
            </h2>
            <p className="mx-auto max-w-sm text-sm leading-relaxed text-zinc-400">
              Run a diagnosis, then save the vehicle to keep its history here and
              get a faster start next time.
            </p>
          </div>
          <Link
            href="/diagnose"
            className="flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/[0.08]"
          >
            Diagnose a car
          </Link>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {vehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              scans={scans.filter((s) => s.vehicleId === vehicle.id)}
              onUpdate={(patch) => updateVehicle(vehicle.id, patch)}
              onDelete={() => deleteVehicle(vehicle.id)}
            />
          ))}
        </div>
      )}

      <DataControls
        hasData={hasVehicles || scans.length > 0}
        onEraseAll={eraseAll}
        onExport={exportAll}
      />
    </div>
  );
}
