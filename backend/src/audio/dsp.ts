import type { AudioFeatures, AudioHint } from "../schemas";
import { magnitudeSpectrum } from "./fft";

/**
 * Deterministic acoustic feature extraction ("basic acoustic clues", not a
 * trained model). Lives in the backend package so it is unit-testable with
 * synthesized PCM in Node, but it EXECUTES in the browser: the frontend
 * decodes the blob and calls extractAudioFeatures with raw samples. Only the
 * resulting AudioFeatures object ever leaves the device.
 */

const FRAME_SIZE = 2048;
const HOP_SIZE = 1024;
const MAX_ANALYZED_SECONDS = 45;

const dB = (x: number) => 20 * Math.log10(Math.max(x, 1e-7));
const round1 = (x: number) => Math.round(x * 10) / 10;
const round3 = (x: number) => Math.round(x * 1000) / 1000;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export interface AnalyzedAudio {
  features: AudioFeatures;
  /** Downsampled |amplitude| envelope (0..1) for waveform rendering. */
  envelope: number[];
}

export function extractAudioFeatures(
  fullSamples: Float32Array,
  sampleRate: number,
  source: "recording" | "upload",
  fileName?: string
): AnalyzedAudio {
  const samples = fullSamples.subarray(
    0,
    Math.min(fullSamples.length, MAX_ANALYZED_SECONDS * sampleRate)
  );

  /* ---- time-domain: RMS, peak, zero crossings ---- */
  let sumSq = 0;
  let peak = 0;
  let crossings = 0;
  for (let i = 0; i < samples.length; i++) {
    const s = samples[i]!;
    sumSq += s * s;
    const a = Math.abs(s);
    if (a > peak) peak = a;
    if (i > 0 && samples[i - 1]! < 0 !== s < 0) crossings++;
  }
  const rms = Math.sqrt(sumSq / Math.max(samples.length, 1));
  const durationSec = samples.length / sampleRate;
  const zeroCrossingRateHz = crossings / 2 / Math.max(durationSec, 1e-3);

  /* ---- frame loop: spectral stats + energy envelope + flux ---- */
  const frameCount = Math.max(
    1,
    Math.floor((samples.length - FRAME_SIZE) / HOP_SIZE) + 1
  );
  const frameRms = new Float64Array(frameCount);
  let centroidWeighted = 0;
  let centroidEnergy = 0;
  let flatnessSum = 0;
  let flatnessFrames = 0;
  let rolloffSum = 0;
  let rolloffFrames = 0;
  let fluxSum = 0;
  let fluxFrames = 0;
  const bandTotals = { low: 0, lowMid: 0, mid: 0, high: 0 };
  const binHz = sampleRate / FRAME_SIZE;
  // Spectral stats every other frame: half the FFTs, near-identical results.
  const SPECTRAL_STRIDE = 2;
  let prevMags: Float64Array | null = null;

  for (let f = 0; f < frameCount; f++) {
    const start = f * HOP_SIZE;
    const frame = samples.subarray(start, start + FRAME_SIZE);
    let fSumSq = 0;
    for (let i = 0; i < frame.length; i++) fSumSq += frame[i]! * frame[i]!;
    frameRms[f] = Math.sqrt(fSumSq / Math.max(frame.length, 1));

    if (frame.length < FRAME_SIZE || f % SPECTRAL_STRIDE !== 0) continue;
    const mags = magnitudeSpectrum(frame);
    let energy = 0;
    let weighted = 0;
    let logSum = 0;
    let linSum = 0;
    for (let bin = 1; bin < mags.length; bin++) {
      const m = mags[bin]!;
      const e = m * m;
      const freq = bin * binHz;
      energy += e;
      weighted += e * freq;
      logSum += Math.log(m + 1e-9);
      linSum += m;
      if (freq < 250) bandTotals.low += e;
      else if (freq < 800) bandTotals.lowMid += e;
      else if (freq < 2500) bandTotals.mid += e;
      else bandTotals.high += e;
    }
    if (energy > 1e-9) {
      centroidWeighted += weighted;
      centroidEnergy += energy;
      const bins = mags.length - 1;
      const geoMean = Math.exp(logSum / bins);
      const arithMean = linSum / bins;
      flatnessSum += arithMean > 0 ? geoMean / arithMean : 0;
      flatnessFrames++;

      // 85% spectral rolloff for this frame.
      let cum = 0;
      for (let bin = 1; bin < mags.length; bin++) {
        cum += mags[bin]! * mags[bin]!;
        if (cum >= 0.85 * energy) {
          rolloffSum += bin * binHz;
          rolloffFrames++;
          break;
        }
      }

      // Positive spectral flux (onset strength) vs. the previous frame.
      if (prevMags) {
        let flux = 0;
        for (let bin = 1; bin < mags.length; bin++) {
          const d = mags[bin]! - prevMags[bin]!;
          if (d > 0) flux += d;
        }
        fluxSum += linSum > 0 ? Math.min(1, flux / linSum) : 0;
        fluxFrames++;
      }
      prevMags = mags;
    }
  }

  const spectralCentroidHz =
    centroidEnergy > 0 ? centroidWeighted / centroidEnergy : 0;
  const spectralFlatness =
    flatnessFrames > 0 ? Math.min(1, flatnessSum / flatnessFrames) : 0;
  const rolloffHz = rolloffFrames > 0 ? rolloffSum / rolloffFrames : 0;
  const onsetStrength = fluxFrames > 0 ? clamp01(fluxSum / fluxFrames) : 0;
  const bandSum =
    bandTotals.low + bandTotals.lowMid + bandTotals.mid + bandTotals.high;
  const bandEnergy =
    bandSum > 0
      ? {
          low: bandTotals.low / bandSum,
          lowMid: bandTotals.lowMid / bandSum,
          mid: bandTotals.mid / bandSum,
          high: bandTotals.high / bandSum,
        }
      : { low: 0.25, lowMid: 0.25, mid: 0.25, high: 0.25 };

  const framesPerSecond = sampleRate / HOP_SIZE;

  /* ---- pulse detection + regularity on the energy envelope ---- */
  const { pulseCount, pulseRateHz, pulseRegularity } = detectPulses(
    frameRms,
    framesPerSecond,
    durationSec
  );

  /* ---- envelope autocorrelation: periodicity + AM rate ---- */
  const envAc = envelopeAutocorr(frameRms);
  const periodicity = bestLag(
    envAc,
    framesPerSecond,
    0.5,
    12 /* Hz: mechanical tick range */
  );
  const am = bestLag(envAc, framesPerSecond, 2, 30 /* Hz: modulation range */);

  /* ---- time-domain harmonicity (tonal vs. noisy) ---- */
  const harmonicity = estimateHarmonicity(samples, sampleRate, frameRms);

  const rmsDb = dB(rms);
  const peakDb = dB(peak);
  const crestFactorDb = peakDb - rmsDb;

  /* ---- derive honest, coarse hints ---- */
  const hints: AudioHint[] = [];
  const regular = pulseRegularity === null || pulseRegularity >= 0.6;
  if (
    (periodicity.strength >= 0.45 && periodicity.hz !== null) ||
    (pulseRateHz !== null && pulseCount >= 3 && regular)
  ) {
    hints.push("rhythmic_ticking");
  }
  if (
    pulseCount >= 4 &&
    pulseRegularity !== null &&
    pulseRegularity < 0.4 &&
    !hints.includes("rhythmic_ticking")
  ) {
    hints.push("irregular_knocking");
  }
  if (crestFactorDb >= 14) hints.push("sharp_transients");
  if (spectralCentroidHz >= 2500) hints.push("high_pitched");
  if (spectralCentroidHz > 0 && spectralCentroidHz <= 400 && bandEnergy.low >= 0.45)
    hints.push("low_rumble");
  if (
    spectralFlatness < 0.18 &&
    spectralCentroidHz >= 400 &&
    spectralCentroidHz <= 4000 &&
    crestFactorDb < 14
  )
    hints.push("tonal_whine");
  if (
    harmonicity >= 0.6 &&
    spectralCentroidHz >= 200 &&
    spectralCentroidHz <= 4000
  )
    hints.push("strong_harmonics");
  if (
    am.hz !== null &&
    am.hz >= 2 &&
    am.hz <= 15 &&
    am.strength >= 0.35 &&
    spectralCentroidHz > 0 &&
    spectralCentroidHz <= 800
  )
    hints.push("modulated_drone");
  if (spectralFlatness >= 0.4 && bandEnergy.high >= 0.35)
    hints.push("broadband_hiss");
  if (rmsDb < -45) hints.push("quiet_recording");
  if (peakDb > -1.5) hints.push("loud_recording");

  /* ---- waveform envelope for the UI (max-|amp| per bucket) ---- */
  const BUCKETS = 160;
  const perBucket = Math.max(1, Math.floor(samples.length / BUCKETS));
  const envelope: number[] = [];
  for (let b = 0; b < BUCKETS; b++) {
    let m = 0;
    const start = b * perBucket;
    const end = Math.min(start + perBucket, samples.length);
    for (let i = start; i < end; i++) {
      const a = Math.abs(samples[i]!);
      if (a > m) m = a;
    }
    envelope.push(peak > 0 ? m / peak : 0);
  }

  return {
    features: {
      source,
      fileName,
      durationSec: Math.round(durationSec * 10) / 10,
      sampleRateHz: sampleRate,
      rmsDb: round1(rmsDb),
      peakDb: round1(peakDb),
      crestFactorDb: round1(Math.max(0, crestFactorDb)),
      spectralCentroidHz: Math.round(spectralCentroidHz),
      spectralFlatness: round3(spectralFlatness),
      zeroCrossingRateHz: Math.round(zeroCrossingRateHz),
      bandEnergy: {
        low: round3(bandEnergy.low),
        lowMid: round3(bandEnergy.lowMid),
        mid: round3(bandEnergy.mid),
        high: round3(bandEnergy.high),
      },
      pulseRateHz: pulseRateHz !== null ? round1(pulseRateHz) : null,
      pulseCount,
      periodicityHz: periodicity.hz !== null ? round1(periodicity.hz) : null,
      periodicityStrength: round3(periodicity.strength),
      harmonicity: round3(harmonicity),
      rolloffHz: Math.round(rolloffHz),
      amRateHz: am.hz !== null ? round1(am.hz) : null,
      pulseRegularity: pulseRegularity !== null ? round3(pulseRegularity) : null,
      onsetStrength: round3(onsetStrength),
      hints,
    },
    envelope,
  };
}

/* ------------------------------------------------------------------ */
/* Pulse detection (envelope peaks) + inter-pulse regularity            */
/* ------------------------------------------------------------------ */

function detectPulses(
  frameRms: Float64Array,
  framesPerSecond: number,
  durationSec: number
): {
  pulseCount: number;
  pulseRateHz: number | null;
  pulseRegularity: number | null;
} {
  const n = frameRms.length;
  if (n < 8) return { pulseCount: 0, pulseRateHz: null, pulseRegularity: null };

  let mean = 0;
  for (let i = 0; i < n; i++) mean += frameRms[i]!;
  mean /= n;
  let variance = 0;
  for (let i = 0; i < n; i++) variance += (frameRms[i]! - mean) ** 2;
  const std = Math.sqrt(variance / n);
  const threshold = mean + Math.max(0.6 * std, mean * 0.25);

  const minSpacing = Math.max(2, Math.round(framesPerSecond / 12)); // ≤ ~12 pulses/s
  const peaks: number[] = [];
  let last = -minSpacing;
  for (let i = 1; i < n - 1; i++) {
    if (
      frameRms[i]! > threshold &&
      frameRms[i]! >= frameRms[i - 1]! &&
      frameRms[i]! >= frameRms[i + 1]! &&
      i - last >= minSpacing
    ) {
      peaks.push(i);
      last = i;
    }
  }

  // Regularity: 1 − coefficient of variation of inter-peak intervals.
  let pulseRegularity: number | null = null;
  if (peaks.length >= 4) {
    const intervals: number[] = [];
    for (let i = 1; i < peaks.length; i++) intervals.push(peaks[i]! - peaks[i - 1]!);
    const iMean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const iVar =
      intervals.reduce((a, b) => a + (b - iMean) ** 2, 0) / intervals.length;
    const cv = iMean > 0 ? Math.sqrt(iVar) / iMean : 1;
    pulseRegularity = clamp01(1 - cv);
  }

  if (peaks.length < 3 || durationSec < 1) {
    return { pulseCount: peaks.length, pulseRateHz: null, pulseRegularity };
  }
  const spanSec = (peaks[peaks.length - 1]! - peaks[0]!) / framesPerSecond;
  if (spanSec <= 0.4) {
    return { pulseCount: peaks.length, pulseRateHz: null, pulseRegularity };
  }
  const rate = (peaks.length - 1) / spanSec;
  return {
    pulseCount: peaks.length,
    pulseRateHz: rate >= 0.5 && rate <= 30 ? rate : null,
    pulseRegularity,
  };
}

/* ------------------------------------------------------------------ */
/* Envelope autocorrelation (periodicity + amplitude modulation)        */
/* ------------------------------------------------------------------ */

/** Mean-removed, lag-0-normalized autocorrelation of the frame envelope. */
function envelopeAutocorr(frameRms: Float64Array): Float64Array {
  const n = frameRms.length;
  const ac = new Float64Array(n);
  if (n < 8) return ac;
  let mean = 0;
  for (let i = 0; i < n; i++) mean += frameRms[i]!;
  mean /= n;
  const centered = new Float64Array(n);
  for (let i = 0; i < n; i++) centered[i] = frameRms[i]! - mean;
  let norm = 0;
  for (let i = 0; i < n; i++) norm += centered[i]! * centered[i]!;
  if (norm <= 1e-12) return ac;
  const maxLag = Math.floor(n / 2);
  for (let lag = 1; lag <= maxLag; lag++) {
    let sum = 0;
    for (let i = 0; i + lag < n; i++) sum += centered[i]! * centered[i + lag]!;
    ac[lag] = sum / norm;
  }
  return ac;
}

/** Strongest autocorrelation peak within a rate band, as {hz, strength}. */
function bestLag(
  ac: Float64Array,
  framesPerSecond: number,
  minHz: number,
  maxHz: number
): { hz: number | null; strength: number } {
  const minLag = Math.max(1, Math.floor(framesPerSecond / maxHz));
  const maxLag = Math.min(ac.length - 1, Math.ceil(framesPerSecond / minHz));
  let best = 0;
  let bestIdx = -1;
  for (let lag = minLag; lag <= maxLag; lag++) {
    const v = ac[lag]!;
    // Require a local peak so a slowly-decaying envelope doesn't fake a period.
    if (
      v > best &&
      v >= (ac[lag - 1] ?? 0) &&
      v >= (ac[lag + 1] ?? 0)
    ) {
      best = v;
      bestIdx = lag;
    }
  }
  if (bestIdx === -1 || best < 0.2) return { hz: null, strength: clamp01(best) };
  return { hz: framesPerSecond / bestIdx, strength: clamp01(best) };
}

/* ------------------------------------------------------------------ */
/* Harmonicity: median per-frame normalized autocorr in the pitch band  */
/* ------------------------------------------------------------------ */

function estimateHarmonicity(
  samples: Float32Array,
  sampleRate: number,
  frameRms: Float64Array
): number {
  const minLag = Math.max(2, Math.floor(sampleRate / 1000)); // ≤ 1000 Hz
  const maxLag = Math.min(FRAME_SIZE - 1, Math.ceil(sampleRate / 60)); // ≥ 60 Hz
  if (maxLag <= minLag) return 0;

  // Energy gate: only analyze frames that carry real signal.
  let meanRms = 0;
  for (let i = 0; i < frameRms.length; i++) meanRms += frameRms[i]!;
  meanRms /= Math.max(frameRms.length, 1);
  const gate = meanRms * 0.5;

  const values: number[] = [];
  const FRAME_STRIDE = 4; // every 4th frame keeps this O(fast enough)
  const LAG_STRIDE = 3;
  for (let f = 0; f < frameRms.length; f += FRAME_STRIDE) {
    if (frameRms[f]! < gate) continue;
    const start = f * HOP_SIZE;
    if (start + FRAME_SIZE > samples.length) break;

    let energy = 0;
    for (let i = 0; i < FRAME_SIZE; i++) {
      const s = samples[start + i]!;
      energy += s * s;
    }
    if (energy <= 1e-9) continue;

    // Coarse scan, then refine around the best coarse lag.
    let bestR = 0;
    let bestL = -1;
    for (let lag = minLag; lag <= maxLag; lag += LAG_STRIDE) {
      const r = lagCorr(samples, start, lag, energy);
      if (r > bestR) {
        bestR = r;
        bestL = lag;
      }
    }
    if (bestL !== -1) {
      for (
        let lag = Math.max(minLag, bestL - LAG_STRIDE + 1);
        lag <= Math.min(maxLag, bestL + LAG_STRIDE - 1);
        lag++
      ) {
        const r = lagCorr(samples, start, lag, energy);
        if (r > bestR) bestR = r;
      }
    }
    values.push(clamp01(bestR));
    if (values.length >= 40) break; // plenty for a median
  }
  if (values.length === 0) return 0;
  values.sort((a, b) => a - b);
  return values[Math.floor((values.length - 1) / 2)]!;
}

function lagCorr(
  samples: Float32Array,
  start: number,
  lag: number,
  energy: number
): number {
  let sum = 0;
  const n = FRAME_SIZE - lag;
  for (let i = 0; i < n; i++) {
    sum += samples[start + i]! * samples[start + i + lag]!;
  }
  return sum / energy;
}
