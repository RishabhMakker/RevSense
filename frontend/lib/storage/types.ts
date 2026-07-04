import type { EngineType, SoundContext } from "@revsense/backend";

/**
 * A vehicle the owner chose to keep in their on-device garage. Identity fields
 * (`id`, `createdAt`) are assigned by the repository and never edited after.
 */
export interface SavedVehicle {
  id: string; // crypto.randomUUID()
  make: string;
  model: string;
  year: number;
  mileage: number | null;
  engineType: EngineType;
  nickname: string | null; // e.g. "Dad's Civic"
  createdAt: string; // ISO
  lastScanAt: string | null;
}

/**
 * A condensed record of one completed diagnosis — the summary only, never the
 * full result object. Enough to re-open a read-only recap and to spot a noise
 * that keeps coming back on the same vehicle.
 */
export interface ScanRecord {
  id: string;
  vehicleId: string | null; // null when the vehicle wasn't saved
  createdAt: string;
  symptomText: string;
  contexts: SoundContext[];
  topCauses: {
    id: string;
    title: string;
    category: string;
    confidence: number;
  }[]; // top 3
  overall: {
    severity: string;
    urgency: string;
    safeToDrive: string;
    verdict: string;
  };
  mode: "heuristic" | "ai-enhanced";
}
