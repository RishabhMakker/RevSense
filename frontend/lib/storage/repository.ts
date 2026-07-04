import type { SavedVehicle, ScanRecord } from "./types";

/**
 * The one interface every garage/history UI surface talks to. The current
 * implementation persists to `localStorage` (see `localRepository.ts`), but
 * nothing in the UI knows that — swapping in a database-backed implementation
 * later means changing a single factory line, not rewriting screens.
 */
export interface GarageRepository {
  listVehicles(): Promise<SavedVehicle[]>;
  saveVehicle(v: Omit<SavedVehicle, "id" | "createdAt">): Promise<SavedVehicle>;
  updateVehicle(id: string, patch: Partial<SavedVehicle>): Promise<void>;
  /** Also deletes every scan belonging to the vehicle. */
  deleteVehicle(id: string): Promise<void>;
  appendScan(s: Omit<ScanRecord, "id" | "createdAt">): Promise<ScanRecord>;
  /** Patch a stored scan — used to link a scan to a vehicle saved just after it. */
  updateScan(id: string, patch: Partial<ScanRecord>): Promise<void>;
  /** Newest first. Pass a `vehicleId` to scope to one vehicle. */
  listScans(vehicleId?: string): Promise<ScanRecord[]>;
  eraseAll(): Promise<void>;
  /** A JSON blob the owner can keep for themselves. */
  exportAll(): Promise<string>;
}
