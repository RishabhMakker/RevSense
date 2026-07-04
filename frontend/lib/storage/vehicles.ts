import type { SavedVehicle } from "./types";

export interface VehicleIdentity {
  make: string;
  model: string;
  year: number;
}

function norm(s: string): string {
  return s.trim().toLowerCase();
}

/** Two vehicles are "the same" when make + model (case-insensitive) and year match. */
export function sameVehicle(a: VehicleIdentity, b: VehicleIdentity): boolean {
  return (
    a.year === b.year &&
    norm(a.make) === norm(b.make) &&
    norm(a.model) === norm(b.model)
  );
}

/** The saved vehicle matching a make/model/year, if the owner already has one. */
export function findSavedVehicle(
  vehicles: SavedVehicle[],
  identity: VehicleIdentity
): SavedVehicle | null {
  return vehicles.find((v) => sameVehicle(v, identity)) ?? null;
}

/** "2014 Honda Civic" — the plain spec, always shown. */
export function vehicleSpecLabel(v: VehicleIdentity): string {
  return `${v.year} ${v.make} ${v.model}`.trim();
}

/** The owner's chosen nickname when set, otherwise the plain spec. */
export function vehicleDisplayName(v: SavedVehicle): string {
  return v.nickname?.trim() ? v.nickname.trim() : vehicleSpecLabel(v);
}
