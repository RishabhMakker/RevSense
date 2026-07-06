import { describe, expect, it } from "vitest";
import { extractAudioFeatures } from "../src/audio/dsp";
import { diagnose } from "../src/engine";
import { audioFeaturesSchema, type DiagnoseRequest } from "../src/schemas";

const SR = 44_100;

/** Deterministic LCG so synthesized "randomness" is stable across runs. */
function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function sine(freqHz: number, seconds: number, amp = 0.5): Float32Array {
  const out = new Float32Array(Math.floor(seconds * SR));
  for (let i = 0; i < out.length; i++) {
    out[i] = amp * Math.sin((2 * Math.PI * freqHz * i) / SR);
  }
  return out;
}

/** Short damped click bursts at the given inter-click intervals (seconds). */
function clickTrain(intervalsSec: number[], seconds: number): Float32Array {
  const out = new Float32Array(Math.floor(seconds * SR));
  let t = 0.1;
  let k = 0;
  while (t < seconds - 0.05) {
    const start = Math.floor(t * SR);
    const len = Math.floor(0.008 * SR);
    for (let i = 0; i < len && start + i < out.length; i++) {
      const env = Math.exp(-i / (0.002 * SR));
      out[start + i] =
        0.9 * env * Math.sin((2 * Math.PI * 2000 * i) / SR);
    }
    t += intervalsSec[k % intervalsSec.length]!;
    k++;
  }
  return out;
}

function amSine(
  carrierHz: number,
  modHz: number,
  depth: number,
  seconds: number
): Float32Array {
  const out = new Float32Array(Math.floor(seconds * SR));
  for (let i = 0; i < out.length; i++) {
    const mod = 1 - depth * 0.5 * (1 + Math.sin((2 * Math.PI * modHz * i) / SR));
    out[i] = 0.5 * mod * Math.sin((2 * Math.PI * carrierHz * i) / SR);
  }
  return out;
}

function whiteNoise(seconds: number, amp = 0.3): Float32Array {
  const rng = makeRng(42);
  const out = new Float32Array(Math.floor(seconds * SR));
  for (let i = 0; i < out.length; i++) out[i] = amp * (rng() * 2 - 1);
  return out;
}

const extract = (samples: Float32Array) =>
  extractAudioFeatures(samples, SR, "recording").features;

describe("audio DSP (synthesized PCM)", () => {
  it("produces schema-valid features", () => {
    const f = extract(sine(440, 3));
    expect(audioFeaturesSchema.safeParse(f).success).toBe(true);
  });

  it("pure tone → strong harmonics, tonal character, accurate centroid", () => {
    const f = extract(sine(440, 4));
    expect(f.harmonicity ?? 0).toBeGreaterThanOrEqual(0.6);
    expect(f.hints).toContain("strong_harmonics");
    expect(f.hints).toContain("tonal_whine");
    expect(Math.abs(f.spectralCentroidHz - 440)).toBeLessThan(150);
    expect(f.hints).not.toContain("broadband_hiss");
  });

  it("regular click train → rhythmic ticking with the right period", () => {
    const f = extract(clickTrain([1 / 6], 5)); // 6 clicks per second
    expect(f.hints).toContain("rhythmic_ticking");
    expect(f.hints).not.toContain("irregular_knocking");
    expect(f.pulseRegularity ?? 0).toBeGreaterThanOrEqual(0.6);
    const rate = f.periodicityHz ?? f.pulseRateHz ?? 0;
    expect(Math.abs(rate - 6)).toBeLessThan(2);
    expect(f.hints).toContain("sharp_transients");
  });

  it("erratic click train → irregular knocking, not rhythmic", () => {
    // Bimodal, pseudo-random gaps: nothing like a steady beat.
    const rng = makeRng(7);
    const gaps: number[] = [];
    for (let i = 0; i < 60; i++) gaps.push(rng() < 0.5 ? 0.09 : 0.4);
    const f = extract(clickTrain(gaps, 6));
    expect(f.pulseRegularity ?? 1).toBeLessThan(0.4);
    expect(f.hints).toContain("irregular_knocking");
    expect(f.hints).not.toContain("rhythmic_ticking");
  });

  it("amplitude-modulated drone → modulated_drone with the right AM rate", () => {
    const f = extract(amSine(300, 6, 0.9, 5));
    expect(f.hints).toContain("modulated_drone");
    expect(Math.abs((f.amRateHz ?? 0) - 6)).toBeLessThan(2.5);
  });

  it("white noise → broadband hiss, low harmonicity", () => {
    const f = extract(whiteNoise(3));
    expect(f.hints).toContain("broadband_hiss");
    expect(f.harmonicity ?? 1).toBeLessThan(0.5);
    expect(f.hints).not.toContain("strong_harmonics");
    expect(f.hints).not.toContain("tonal_whine");
  });

  it("near-silence → quiet recording", () => {
    const f = extract(sine(440, 2, 0.001));
    expect(f.hints).toContain("quiet_recording");
  });
});

describe("audio contradiction scoring", () => {
  const req = (audio: DiagnoseRequest["audio"]): DiagnoseRequest => ({
    vehicle: {
      make: "Honda",
      model: "Civic",
      year: 2014,
      mileage: 128_000,
      engineType: "gasoline",
    },
    symptomText:
      "A high pitched squealing sound when I brake, especially at low speed.",
    contexts: ["braking", "low_speed"],
    audio,
    priors: null,
  });

  // A recording with the OPPOSITE character of a pad squeal.
  const rumbleAudio = () =>
    audioFeaturesSchema.parse({
      source: "recording",
      durationSec: 10,
      sampleRateHz: 48_000,
      rmsDb: -20,
      peakDb: -6,
      crestFactorDb: 8,
      spectralCentroidHz: 250,
      spectralFlatness: 0.3,
      zeroCrossingRateHz: 400,
      bandEnergy: { low: 0.6, lowMid: 0.25, mid: 0.1, high: 0.05 },
      pulseRateHz: null,
      pulseCount: 0,
      hints: ["low_rumble"],
    });

  it("a conflicting recording lowers confidence but never flips the story", () => {
    const withOut = diagnose(req(null));
    const withAudio = diagnose(req(rumbleAudio()));
    const padsBefore = withOut.causes.find((c) => c.id === "brake-pads-worn")!;
    const padsAfter = withAudio.causes.find((c) => c.id === "brake-pads-worn")!;
    // The rumble contradicts the squeal character → pads demoted a little…
    expect(padsAfter.confidence).toBeLessThan(padsBefore.confidence);
    // …but the typed story still wins: pads remain the top cause (net audio
    // contribution is bounded).
    expect(withAudio.causes[0]?.id).toBe("brake-pads-worn");
    expect(padsAfter.whyLikely.join(" ")).toMatch(/recording/i);
  });

  it("a too-quiet recording is ignored entirely", () => {
    const quiet = { ...rumbleAudio(), rmsDb: -50, hints: ["quiet_recording" as const] };
    const withOut = diagnose(req(null));
    const withQuiet = diagnose(req(quiet));
    expect(withQuiet.causes.map((c) => `${c.id}:${c.confidence}`)).toEqual(
      withOut.causes.map((c) => `${c.id}:${c.confidence}`)
    );
  });
});
