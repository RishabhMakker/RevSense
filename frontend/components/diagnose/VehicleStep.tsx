"use client";

import { ENGINE_TYPES, type EngineType } from "@revsense/backend";
import type { VehicleFormState } from "./types";

const ENGINE_TYPE_LABELS: Record<EngineType, string> = {
  gasoline: "Gasoline",
  diesel: "Diesel",
  hybrid: "Hybrid",
  electric: "Electric (EV)",
  unknown: "Not sure",
};

const MAKES = [
  "Toyota", "Honda", "Ford", "Chevrolet", "Nissan", "Hyundai", "Kia", "Subaru",
  "Volkswagen", "BMW", "Mercedes-Benz", "Audi", "Mazda", "Jeep", "Ram", "GMC",
  "Lexus", "Tesla", "Dodge", "Acura",
];

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-200">{label}</span>
      {hint && <span className="ml-2 text-xs text-zinc-400">{hint}</span>}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-zinc-400 outline-none transition-colors focus:border-amber-400/50 focus:bg-white/[0.06]";

interface VehicleStepProps {
  vehicle: VehicleFormState;
  onChange: (vehicle: VehicleFormState) => void;
}

export function VehicleStep({ vehicle, onChange }: VehicleStepProps) {
  const set = (patch: Partial<VehicleFormState>) =>
    onChange({ ...vehicle, ...patch });
  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-white">About your vehicle</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
          Age and mileage matter: a 12-year-old car with 130k miles wears
          differently than a 3-year-old one, and that changes what&apos;s likely.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Make">
          <input
            className={inputClass}
            list="vehicle-makes"
            placeholder="e.g. Honda"
            value={vehicle.make}
            onChange={(e) => set({ make: e.target.value })}
            maxLength={40}
          />
          <datalist id="vehicle-makes">
            {MAKES.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </Field>
        <Field label="Model">
          <input
            className={inputClass}
            placeholder="e.g. Civic"
            value={vehicle.model}
            onChange={(e) => set({ model: e.target.value })}
            maxLength={60}
          />
        </Field>
        <Field label="Year">
          <input
            className={inputClass}
            type="number"
            inputMode="numeric"
            placeholder={`1960 – ${currentYear + 1}`}
            min={1960}
            max={currentYear + 1}
            value={vehicle.year}
            onChange={(e) => set({ year: e.target.value })}
          />
        </Field>
        <Field label="Mileage" hint="optional">
          <input
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
        <div className="flex flex-wrap gap-2">
          {ENGINE_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => set({ engineType: type })}
              className={`rounded-xl border px-4 py-2 text-sm transition-colors ${
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
