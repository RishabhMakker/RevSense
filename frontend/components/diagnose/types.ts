import type { AudioFeatures, EngineType } from "@revsense/backend";

export interface AudioState {
  features: AudioFeatures;
  envelope: number[];
  /** Null for the canned demo scenario (features without a real blob). */
  objectUrl: string | null;
  label: string;
}

export interface VehicleFormState {
  make: string;
  model: string;
  year: string;
  mileage: string;
  engineType: EngineType;
}

export const EMPTY_VEHICLE: VehicleFormState = {
  make: "",
  model: "",
  year: "",
  mileage: "",
  engineType: "unknown",
};
