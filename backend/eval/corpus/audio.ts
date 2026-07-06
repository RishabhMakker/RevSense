import type { EvalCase } from "../types";
import { audioFeatures, rq } from "../helpers";

/**
 * Cases with synthetic AudioFeatures (hand-authored, schema-valid). They
 * exercise the corroboration path: a recording whose character matches the
 * textual story should strengthen the right cause.
 */
export const AUDIO_CASES: EvalCase[] = [
  {
    id: "audio-cv-ticking-01",
    tags: ["drivetrain", "audio", "clear"],
    request: rq(
      "Clicking from the front when turning at low speed, I managed to record it.",
      ["low_speed_turning"],
      {
        audio: audioFeatures({
          crestFactorDb: 16,
          pulseRateHz: 7.5,
          pulseCount: 42,
          hints: ["rhythmic_ticking", "sharp_transients"],
        }),
      }
    ),
    expect: { top1: ["cv-axle-wear"] },
  },
  {
    id: "audio-bearing-rumble-02",
    tags: ["wheels_tires", "audio", "clear"],
    request: rq(
      "Droning hum at highway speed that shifts when I change lanes, recording attached.",
      ["highway_speed"],
      {
        audio: audioFeatures({
          spectralCentroidHz: 320,
          spectralFlatness: 0.35,
          bandEnergy: { low: 0.55, lowMid: 0.25, mid: 0.15, high: 0.05 },
          hints: ["low_rumble"],
        }),
      }
    ),
    expect: { top1: ["wheel-bearing"] },
  },
  {
    id: "audio-belt-squeal-03",
    tags: ["belts", "audio", "clear"],
    request: rq(
      "Loud squeal on cold start in the morning, here is a recording from the driveway.",
      ["cold_start"],
      {
        audio: audioFeatures({
          spectralCentroidHz: 3600,
          spectralFlatness: 0.12,
          rmsDb: -14,
          peakDb: -1,
          bandEnergy: { low: 0.05, lowMid: 0.1, mid: 0.25, high: 0.6 },
          hints: ["high_pitched", "tonal_whine", "loud_recording"],
        }),
      }
    ),
    expect: { top1: ["serpentine-belt-squeal"] },
  },
  {
    id: "audio-heatshield-rattle-04",
    tags: ["exhaust", "audio", "clear"],
    request: rq(
      "Tinny buzzing rattle from under the car at idle, recorded from underneath.",
      ["idle"],
      {
        audio: audioFeatures({
          crestFactorDb: 15,
          spectralCentroidHz: 2800,
          pulseRateHz: 11,
          pulseCount: 90,
          hints: ["rhythmic_ticking", "high_pitched"],
        }),
      }
    ),
    expect: { top1: ["exhaust-heat-shield"] },
  },
  {
    id: "audio-ps-whine-05",
    tags: ["steering", "audio", "clear"],
    request: rq(
      "Whining when I turn the wheel in the parking garage, recorded with the window down.",
      ["low_speed_turning"],
      {
        audio: audioFeatures({
          spectralCentroidHz: 900,
          spectralFlatness: 0.1,
          hints: ["tonal_whine"],
        }),
      }
    ),
    expect: { top1: ["power-steering-whine"] },
  },
  {
    id: "audio-quiet-recording-06",
    tags: ["audio", "vague"],
    request: rq(
      "I tried to record the noise but it was windy, you can barely hear a faint hum.",
      ["highway_speed"],
      {
        audio: audioFeatures({
          rmsDb: -52,
          peakDb: -30,
          hints: ["quiet_recording"],
        }),
      }
    ),
    // A near-silent clip must not manufacture confidence.
    expect: { maxTopConfidence: 60 },
  },
  {
    id: "audio-vacuum-hiss-07",
    tags: ["engine", "audio", "clear"],
    request: rq(
      "Hissing in the engine bay at idle with a rough idle, recording taken next to the intake.",
      ["idle"],
      {
        audio: audioFeatures({
          spectralFlatness: 0.55,
          spectralCentroidHz: 4200,
          bandEnergy: { low: 0.05, lowMid: 0.1, mid: 0.3, high: 0.55 },
          hints: ["broadband_hiss", "high_pitched"],
        }),
      }
    ),
    expect: { top1: ["vacuum-leak"] },
  },
  {
    id: "audio-rod-knock-08",
    tags: ["engine", "audio", "clear", "red-flag"],
    request: rq(
      "Loud deep knocking from the bottom of the engine at idle, recording sounds scary.",
      ["idle"],
      {
        audio: audioFeatures({
          spectralCentroidHz: 280,
          crestFactorDb: 15,
          rmsDb: -12,
          peakDb: -1,
          pulseRateHz: 12,
          pulseCount: 130,
          bandEnergy: { low: 0.6, lowMid: 0.25, mid: 0.1, high: 0.05 },
          hints: ["rhythmic_ticking", "low_rumble", "loud_recording"],
        }),
      }
    ),
    expect: {
      top1: ["rod-knock"],
      redFlagIds: ["severe-knocking"],
      safeToDrive: "no",
    },
  },
  {
    id: "audio-bearing-drone-09",
    tags: ["wheels_tires", "audio", "clear"],
    request: rq(
      "Droning from the front at highway speed, recorded from inside the cabin.",
      ["highway_speed"],
      {
        audio: audioFeatures({
          spectralCentroidHz: 300,
          bandEnergy: { low: 0.55, lowMid: 0.3, mid: 0.1, high: 0.05 },
          amRateHz: 7,
          periodicityStrength: 0.5,
          harmonicity: 0.3,
          hints: ["low_rumble", "modulated_drone"],
        }),
      }
    ),
    // The pulsing-drone signature is the wheel bearing's own.
    expect: { top1: ["wheel-bearing"] },
  },
  {
    id: "audio-heatshield-irregular-10",
    tags: ["exhaust", "audio", "clear"],
    request: rq(
      "Metallic rattling from under the car at idle, here is a recording from underneath.",
      ["idle"],
      {
        audio: audioFeatures({
          crestFactorDb: 15,
          spectralCentroidHz: 2700,
          pulseRateHz: null,
          pulseCount: 24,
          pulseRegularity: 0.25,
          hints: ["irregular_knocking", "high_pitched", "sharp_transients"],
        }),
      }
    ),
    expect: { top1: ["exhaust-heat-shield"] },
  },
  {
    id: "audio-contradiction-bounded-11",
    tags: ["belts", "audio", "clear"],
    request: rq(
      "Loud squeal on cold morning starts, worse in the rain. The recording came out mostly low rumble from wind.",
      ["cold_start"],
      {
        audio: audioFeatures({
          spectralCentroidHz: 300,
          bandEnergy: { low: 0.6, lowMid: 0.25, mid: 0.1, high: 0.05 },
          hints: ["low_rumble"],
        }),
      }
    ),
    // A wind-swamped recording contradicts the squeal character, but the net
    // audio contribution is bounded: the typed story must still win.
    expect: { top1: ["serpentine-belt-squeal"] },
  },
];
