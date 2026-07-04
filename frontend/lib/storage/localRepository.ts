import type { GarageRepository } from "./repository";
import type { SavedVehicle, ScanRecord } from "./types";

/**
 * Device-local garage + scan history.
 *
 * Everything lives under one versioned key so a future migration only has to
 * reason about a single blob. Reads are defensive: any corruption resets to an
 * empty garage rather than crashing the app, and every access is guarded for
 * server-side rendering (this repository is only ever used from client
 * components, but the guards keep it import-safe anywhere).
 */

const STORAGE_KEY = "revsense.garage.v1";
const CURRENT_VERSION = 1;
const MAX_SCANS = 50;

interface GarageData {
  version: number;
  vehicles: SavedVehicle[];
  scans: ScanRecord[];
}

function emptyData(): GarageData {
  return { version: CURRENT_VERSION, vehicles: [], scans: [] };
}

function genId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    // Fall through to the non-crypto id below (e.g. insecure context).
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Bring an older blob up to the current schema. Empty for v1 — this is the seam
 * every future schema bump plugs into, so no UI code ever sees a stale shape.
 */
function migrate(data: GarageData): GarageData {
  let current = data;
  while (current.version < CURRENT_VERSION) {
    switch (current.version) {
      // case 1: current = migrateV1toV2(current); break;
      default:
        current = { ...current, version: CURRENT_VERSION };
    }
  }
  return current;
}

function read(): GarageData {
  if (typeof window === "undefined") return emptyData();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData();
    const parsed = JSON.parse(raw) as Partial<GarageData> | null;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !Array.isArray(parsed.vehicles) ||
      !Array.isArray(parsed.scans)
    ) {
      return emptyData();
    }
    const data: GarageData = {
      version: typeof parsed.version === "number" ? parsed.version : CURRENT_VERSION,
      vehicles: parsed.vehicles as SavedVehicle[],
      scans: parsed.scans as ScanRecord[],
    };
    return data.version < CURRENT_VERSION ? migrate(data) : data;
  } catch {
    // Corrupted JSON or storage error — start clean rather than crash.
    return emptyData();
  }
}

function write(data: GarageData): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Quota exceeded or storage disabled — degrade silently.
  }
}

class LocalGarageRepository implements GarageRepository {
  async listVehicles(): Promise<SavedVehicle[]> {
    return read().vehicles;
  }

  async saveVehicle(
    v: Omit<SavedVehicle, "id" | "createdAt">
  ): Promise<SavedVehicle> {
    const data = read();
    const vehicle: SavedVehicle = {
      ...v,
      id: genId(),
      createdAt: new Date().toISOString(),
    };
    data.vehicles.push(vehicle);
    write(data);
    return vehicle;
  }

  async updateVehicle(id: string, patch: Partial<SavedVehicle>): Promise<void> {
    const data = read();
    const idx = data.vehicles.findIndex((veh) => veh.id === id);
    if (idx === -1) return;
    const current = data.vehicles[idx]!;
    data.vehicles[idx] = {
      ...current,
      ...patch,
      // Identity fields stay immutable regardless of the patch.
      id: current.id,
      createdAt: current.createdAt,
    };
    write(data);
  }

  async deleteVehicle(id: string): Promise<void> {
    const data = read();
    data.vehicles = data.vehicles.filter((veh) => veh.id !== id);
    data.scans = data.scans.filter((scan) => scan.vehicleId !== id);
    write(data);
  }

  async appendScan(
    s: Omit<ScanRecord, "id" | "createdAt">
  ): Promise<ScanRecord> {
    const data = read();
    const scan: ScanRecord = {
      ...s,
      id: genId(),
      createdAt: new Date().toISOString(),
    };
    data.scans.unshift(scan);
    if (data.scans.length > MAX_SCANS) {
      data.scans = data.scans.slice(0, MAX_SCANS);
    }
    if (scan.vehicleId) {
      const idx = data.vehicles.findIndex((veh) => veh.id === scan.vehicleId);
      if (idx !== -1) {
        data.vehicles[idx] = {
          ...data.vehicles[idx]!,
          lastScanAt: scan.createdAt,
        };
      }
    }
    write(data);
    return scan;
  }

  async updateScan(id: string, patch: Partial<ScanRecord>): Promise<void> {
    const data = read();
    const idx = data.scans.findIndex((scan) => scan.id === id);
    if (idx === -1) return;
    const current = data.scans[idx]!;
    data.scans[idx] = {
      ...current,
      ...patch,
      // Identity fields stay immutable regardless of the patch.
      id: current.id,
      createdAt: current.createdAt,
    };
    // Keep the linked vehicle's lastScanAt in step when a scan is (re)linked.
    if (patch.vehicleId) {
      const vIdx = data.vehicles.findIndex((veh) => veh.id === patch.vehicleId);
      if (vIdx !== -1) {
        data.vehicles[vIdx] = {
          ...data.vehicles[vIdx]!,
          lastScanAt: current.createdAt,
        };
      }
    }
    write(data);
  }

  async listScans(vehicleId?: string): Promise<ScanRecord[]> {
    const scans = [...read().scans].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
    return vehicleId ? scans.filter((scan) => scan.vehicleId === vehicleId) : scans;
  }

  async eraseAll(): Promise<void> {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing more we can do — treat as already gone.
    }
  }

  async exportAll(): Promise<string> {
    return JSON.stringify(read(), null, 2);
  }
}

let instance: GarageRepository | null = null;

/**
 * The single seam a database implementation swaps in at. Everything else in the
 * app depends on the {@link GarageRepository} interface, never on this class.
 */
export function getGarageRepository(): GarageRepository {
  if (!instance) instance = new LocalGarageRepository();
  return instance;
}
