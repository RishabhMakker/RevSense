import {
  extractAudioFeatures,
  type AnalyzedAudio,
} from "@revsense/backend";

/**
 * Browser shell around the shared DSP: decode the blob, mix to mono, and
 * hand raw samples to the backend package's deterministic feature extractor
 * (which runs right here in the browser — only the small AudioFeatures
 * object ever leaves the device).
 */

export type { AnalyzedAudio };

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
    return extractAudioFeatures(
      mixToMono(buffer),
      buffer.sampleRate,
      source,
      fileName
    );
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
