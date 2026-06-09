import type { AudioFeatures, AudioHint } from "@revsense/backend";
import { magnitudeSpectrum } from "./fft";

/**
 * Client-side acoustic feature extraction ("basic acoustic clues", not a
 * trained model). Only these few numbers ever leave the browser — the raw
 * audio stays on the device.
 */

const FRAME_SIZE = 2048;
const HOP_SIZE = 1024;
const MAX_ANALYZED_SECONDS = 45;

const dB = (x: number) => 20 * Math.log10(Math.max(x, 1e-7));

export interface AnalyzedAudio {
  features: AudioFeatures;
  /** Downsampled |amplitude| envelope (0..1) for waveform rendering. */
  envelope: number[];
}

export async function analyzeAudioBlob(
  blob: Blob,
  source: "recording" | "upload",
  fileName?: string
): Promise<AnalyzedAudio> {
  const arrayBuffer = await blob.arrayBuffer();
  const AudioCtor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  const ctx = new AudioCtor();
  try {
    const buffer = await ctx.decodeAudioData(arrayBuffer);
    return analyzeBuffer(buffer, source, fileName);
  } finally {
    void ctx.close();
  }
}

function mixToMono(buffer: AudioBuffer): Float32Array {
  if (buffer.numberOfChannels === 1) return buffer.getChannelData(0);
  const out = new Float32Array(buffer.length);
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < data.length; i++) out[i] += data[i];
  }
  for (let i = 0; i < out.length; i++) out[i] /= buffer.numberOfChannels;
  return out;
}

function analyzeBuffer(
  buffer: AudioBuffer,
  source: "recording" | "upload",
  fileName?: string
): AnalyzedAudio {
  const sampleRate = buffer.sampleRate;
  const fullSamples = mixToMono(buffer);
  const samples = fullSamples.subarray(
    0,
    Math.min(fullSamples.length, MAX_ANALYZED_SECONDS * sampleRate)
  );

  /* ---- time-domain: RMS, peak, zero crossings, frame envelope ---- */
  let sumSq = 0;
  let peak = 0;
  let crossings = 0;
  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    sumSq += s * s;
    const a = Math.abs(s);
    if (a > peak) peak = a;
    if (i > 0 && samples[i - 1] < 0 !== s < 0) crossings++;
  }
  const rms = Math.sqrt(sumSq / Math.max(samples.length, 1));
  const durationSec = samples.length / sampleRate;
  const zeroCrossingRateHz = crossings / 2 / Math.max(durationSec, 1e-3);

  /* ---- frame loop: spectral stats + energy envelope ---- */
  const frameCount = Math.max(
    1,
    Math.floor((samples.length - FRAME_SIZE) / HOP_SIZE) + 1
  );
  const frameRms = new Float64Array(frameCount);
  let centroidWeighted = 0;
  let centroidEnergy = 0;
  let flatnessSum = 0;
  let flatnessFrames = 0;
  const bandTotals = { low: 0, lowMid: 0, mid: 0, high: 0 };
  const binHz = sampleRate / FRAME_SIZE;
  // Spectral stats every other frame: half the FFTs, visually identical results.
  const SPECTRAL_STRIDE = 2;

  for (let f = 0; f < frameCount; f++) {
    const start = f * HOP_SIZE;
    const frame = samples.subarray(start, start + FRAME_SIZE);
    let fSumSq = 0;
    for (let i = 0; i < frame.length; i++) fSumSq += frame[i] * frame[i];
    frameRms[f] = Math.sqrt(fSumSq / Math.max(frame.length, 1));

    if (frame.length < FRAME_SIZE || f % SPECTRAL_STRIDE !== 0) continue;
    const mags = magnitudeSpectrum(frame);
    let energy = 0;
    let weighted = 0;
    let logSum = 0;
    let linSum = 0;
    for (let bin = 1; bin < mags.length; bin++) {
      const m = mags[bin];
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
    }
  }

  const spectralCentroidHz =
    centroidEnergy > 0 ? centroidWeighted / centroidEnergy : 0;
  const spectralFlatness =
    flatnessFrames > 0 ? Math.min(1, flatnessSum / flatnessFrames) : 0;
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

  /* ---- pulse detection on the smoothed energy envelope ---- */
  const { pulseCount, pulseRateHz } = detectPulses(
    frameRms,
    sampleRate / HOP_SIZE,
    durationSec
  );

  const rmsDb = dB(rms);
  const peakDb = dB(peak);
  const crestFactorDb = peakDb - rmsDb;

  /* ---- derive honest, coarse hints ---- */
  const hints: AudioHint[] = [];
  if (pulseRateHz !== null && pulseCount >= 3) hints.push("rhythmic_ticking");
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
      const a = Math.abs(samples[i]);
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
      spectralFlatness: Math.round(spectralFlatness * 1000) / 1000,
      zeroCrossingRateHz: Math.round(zeroCrossingRateHz),
      bandEnergy: {
        low: round3(bandEnergy.low),
        lowMid: round3(bandEnergy.lowMid),
        mid: round3(bandEnergy.mid),
        high: round3(bandEnergy.high),
      },
      pulseRateHz: pulseRateHz !== null ? round1(pulseRateHz) : null,
      pulseCount,
      hints,
    },
    envelope,
  };
}

const round1 = (x: number) => Math.round(x * 10) / 10;
const round3 = (x: number) => Math.round(x * 1000) / 1000;

/**
 * Count energy bursts: peaks in the frame-RMS envelope that stand out from a
 * local baseline with minimum spacing. Coarse, but it reliably separates
 * "click-click-click" from steady drones.
 */
function detectPulses(
  frameRms: Float64Array,
  framesPerSecond: number,
  durationSec: number
): { pulseCount: number; pulseRateHz: number | null } {
  const n = frameRms.length;
  if (n < 8) return { pulseCount: 0, pulseRateHz: null };

  let mean = 0;
  for (let i = 0; i < n; i++) mean += frameRms[i];
  mean /= n;
  let variance = 0;
  for (let i = 0; i < n; i++) variance += (frameRms[i] - mean) ** 2;
  const std = Math.sqrt(variance / n);
  const threshold = mean + Math.max(0.6 * std, mean * 0.25);

  const minSpacing = Math.max(2, Math.round(framesPerSecond / 12)); // ≤ ~12 pulses/s
  const peaks: number[] = [];
  let last = -minSpacing;
  for (let i = 1; i < n - 1; i++) {
    if (
      frameRms[i] > threshold &&
      frameRms[i] >= frameRms[i - 1] &&
      frameRms[i] >= frameRms[i + 1] &&
      i - last >= minSpacing
    ) {
      peaks.push(i);
      last = i;
    }
  }

  if (peaks.length < 3 || durationSec < 1) {
    return { pulseCount: peaks.length, pulseRateHz: null };
  }
  const spanFrames = peaks[peaks.length - 1] - peaks[0];
  const spanSec = spanFrames / framesPerSecond;
  if (spanSec <= 0.4) return { pulseCount: peaks.length, pulseRateHz: null };
  const rate = (peaks.length - 1) / spanSec;
  return {
    pulseCount: peaks.length,
    pulseRateHz: rate >= 0.5 && rate <= 30 ? rate : null,
  };
}
