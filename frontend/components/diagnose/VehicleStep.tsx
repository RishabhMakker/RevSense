"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ENGINE_TYPES, type EngineType } from "@revsense/backend";
import { Combobox } from "@/components/ui/Combobox";
import { inputClass } from "@/lib/ui";
import { MAKES } from "@/lib/vehicles/makes";
import { getStaticModels } from "@/lib/vehicles/models";
import {
  getOpenYears,
  getStaticYearRange,
  yearsFromRange,
} from "@/lib/vehicles/years";
import type { VehicleFormState } from "./types";

const ENGINE_TYPE_LABELS: Record<EngineType, string> = {
  gasoline: "Gasoline",
  diesel: "Diesel",
  hybrid: "Hybrid",
  electric: "Electric (EV)",
  unknown: "Not sure",
};

function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      {htmlFor ? (
        <label htmlFor={htmlFor} className="text-sm font-medium text-zinc-200">
          {label}
        </label>
      ) : (
        <span className="text-sm font-medium text-zinc-200">{label}</span>
      )}
      {hint && <span className="ml-2 text-xs text-zinc-400">{hint}</span>}
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

interface VehicleStepProps {
  vehicle: VehicleFormState;
  onChange: (vehicle: VehicleFormState) => void;
}

export function VehicleStep({ vehicle, onChange }: VehicleStepProps) {
  const set = (patch: Partial<VehicleFormState>) =>
    onChange({ ...vehicle, ...patch });
  const currentYear = new Date().getFullYear();

  // Model suggestions follow the selected make: the curated static bundle is
  // available instantly (derived, not stored), and /api/models enriches the
  // long tail from NHTSA. Enrichment is keyed to the make it was fetched for,
  // so a make change falls back to the static list with no extra reset. A
  // failed fetch changes nothing — the field still accepts free text.
  const make = vehicle.make.trim();
  const model = vehicle.model.trim();
  const staticModels = useMemo(() => getStaticModels(make), [make]);
  const [enriched, setEnriched] = useState<{
    make: string;
    models: string[];
  } | null>(null);
  const [modelsLoading, setModelsLoading] = useState(false);

  const modelOptions =
    enriched && enriched.make === make && enriched.models.length > 0
      ? enriched.models
      : staticModels;
  // Only surface the spinner once the make is long enough to query.
  const showModelsLoading = modelsLoading && make.length >= 2;

  useEffect(() => {
    if (make.length < 2) return;
    let active = true;
    const controller = new AbortController();
    const debounce = setTimeout(() => {
      setModelsLoading(true);
      fetch(`/api/models?make=${encodeURIComponent(make)}`, {
        signal: controller.signal,
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data: { models?: string[] } | null) => {
          if (active && data?.models?.length) {
            setEnriched({ make, models: data.models });
          }
        })
        .catch(() => {
          /* keep static options; the field works as free text regardless */
        })
        .finally(() => {
          if (active) setModelsLoading(false);
        });
    }, 300);
    return () => {
      active = false;
      controller.abort();
      clearTimeout(debounce);
    };
  }, [make]);

  // Year options follow make + model. A curated range resolves instantly and
  // authoritatively client-side (newest-first, clamped to the schema's 1960..
  // currentYear+1). Anything not in the bundle falls back to the full open
  // range, so the field is never empty and never blocks a legitimate entry.
  const staticYearRange = useMemo(
    () => getStaticYearRange(make, model),
    [make, model],
  );
  const baseYears = useMemo(
    () =>
      (staticYearRange
        ? yearsFromRange(staticYearRange.start, staticYearRange.end)
        : getOpenYears()
      ).map(String),
    [staticYearRange],
  );

  // Long tail only: mirror /api/models and let the server refine the list.
  // Curated pairings already have the authoritative answer, so they skip the
  // network entirely. /api/years returns the open range today; this is the seam
  // for a future year dataset and is fully optional — any failure keeps the
  // instant client list, and it never narrows a curated range.
  const [enrichedYears, setEnrichedYears] = useState<{
    key: string;
    years: string[];
  } | null>(null);
  const yearKey = `${make}|${model}`;
  const yearOptions =
    enrichedYears && enrichedYears.key === yearKey && enrichedYears.years.length
      ? enrichedYears.years
      : baseYears;

  useEffect(() => {
    if (staticYearRange || make.length < 2 || model.length < 1) return;
    let active = true;
    const controller = new AbortController();
    const debounce = setTimeout(() => {
      fetch(
        `/api/years?make=${encodeURIComponent(make)}&model=${encodeURIComponent(
          model,
        )}`,
        { signal: controller.signal },
      )
        .then((r) => (r.ok ? r.json() : null))
        .then((data: { years?: number[] } | null) => {
          if (active && data?.years?.length) {
            setEnrichedYears({
              key: `${make}|${model}`,
              years: data.years.map(String),
            });
          }
        })
        .catch(() => {
          /* keep the instant client list; the field works regardless */
        });
    }, 300);
    return () => {
      active = false;
      controller.abort();
      clearTimeout(debounce);
    };
  }, [make, model, staticYearRange]);

  // Clear the year ONLY when a new make/model genuinely can't have it — i.e. we
  // hold a precise curated range and the entered year falls outside it. Unknown
  // pairings (open-range fallback) never trigger a wipe, and a still-valid year
  // is always kept (e.g. switching Civic → Accord with a shared year).
  const prevMakeModel = useRef(yearKey);
  useEffect(() => {
    const key = `${make}|${model}`;
    if (key === prevMakeModel.current) return;
    prevMakeModel.current = key;
    if (!vehicle.year) return;
    const range = getStaticYearRange(make, model);
    if (!range) return;
    const y = Number(vehicle.year);
    if (Number.isInteger(y) && (y < range.start || y > range.end)) {
      onChange({ ...vehicle, year: "" });
    }
  }, [make, model, vehicle, onChange]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-white">About your vehicle</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
          A few details about your car help us narrow down what&apos;s most
          likely. Mileage is optional, but it sharpens the result.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Make" htmlFor="vehicle-make">
          <Combobox
            id="vehicle-make"
            value={vehicle.make}
            onChange={(value) =>
              set(
                value === vehicle.make
                  ? { make: value }
                  : { make: value, model: "" },
              )
            }
            options={MAKES}
            placeholder="e.g. Honda"
            ariaLabel="Vehicle make"
            maxLength={40}
          />
        </Field>
        <Field label="Model" htmlFor="vehicle-model">
          <Combobox
            id="vehicle-model"
            value={vehicle.model}
            onChange={(value) => set({ model: value })}
            options={modelOptions}
            placeholder="e.g. Civic"
            ariaLabel="Vehicle model"
            maxLength={60}
            loading={showModelsLoading}
          />
        </Field>
        <Field label="Year" htmlFor="vehicle-year">
          <Combobox
            id="vehicle-year"
            value={vehicle.year}
            onChange={(year) => set({ year })}
            options={yearOptions}
            placeholder={`e.g. ${currentYear}`}
            ariaLabel="Vehicle year"
            maxLength={4}
            inputMode="numeric"
            filterMode="contains"
            suggestCorrections={false}
          />
        </Field>
        <Field label="Mileage" hint="helps accuracy" htmlFor="vehicle-mileage">
          <input
            id="vehicle-mileage"
            className={inputClass}
            type="number"
            inputMode="numeric"
            placeholder="e.g. 128000"
            min={0}
            max={1_500_000}
            value={vehicle.mileage}
            onChange={(e) => set({ mileage: e.target.value })}
          />
        </Field>
      </div>

      <Field label="Engine type" hint="if known">
        <div role="group" aria-label="Engine type" className="flex flex-wrap gap-2">
          {ENGINE_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => set({ engineType: type })}
              className={`min-h-11 rounded-xl border px-4 py-2 text-sm transition-colors ${
                vehicle.engineType === type
                  ? "border-amber-400/60 bg-amber-500/15 text-amber-200"
                  : "border-white/10 bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200"
              }`}
            >
              {ENGINE_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </Field>
    </div>
  );
}
