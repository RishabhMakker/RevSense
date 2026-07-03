import type {
  AudioFeatures,
  DiagnoseRequest,
  EngineType,
  SoundContext,
  VehicleInfo,
} from "../src/schemas";

/** Default corpus vehicle: old enough and high-mileage enough that wear
 *  boosts apply, matching the most common real-world submission. */
const DEFAULT_VEHICLE: VehicleInfo = {
  make: "Honda",
  model: "Civic",
  year: 2014,
  mileage: 128_000,
  engineType: "gasoline",
};

export function veh(
  make: string,
  model: string,
  year: number,
  mileage: number | null,
  engineType: EngineType = "gasoline"
): VehicleInfo {
  return { make, model, year, mileage, engineType };
}

export function rq(
  symptomText: string,
  contexts: SoundContext[],
  overrides: Partial<DiagnoseRequest> = {}
): DiagnoseRequest {
  return {
    vehicle: DEFAULT_VEHICLE,
    symptomText,
    contexts,
    audio: null,
    priors: null,
    ...overrides,
  };
}

/** Hand-authored synthetic AudioFeatures, valid under audioFeaturesSchema.
 *  Defaults describe an unremarkable phone recording; override what matters. */
export function audioFeatures(
  partial: Partial<AudioFeatures> = {}
): AudioFeatures {
  return {
    source: "recording",
    durationSec: 12,
    sampleRateHz: 48_000,
    rmsDb: -28,
    peakDb: -6,
    crestFactorDb: 10,
    spectralCentroidHz: 1200,
    spectralFlatness: 0.3,
    zeroCrossingRateHz: 1800,
    bandEnergy: { low: 0.25, lowMid: 0.3, mid: 0.3, high: 0.15 },
    pulseRateHz: null,
    pulseCount: 0,
    hints: [],
    ...partial,
  };
}
