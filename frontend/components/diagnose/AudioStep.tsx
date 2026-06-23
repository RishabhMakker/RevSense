"use client";

import { useRef, useState } from "react";
import { AlertCircle, Loader2, Mic, Square, Trash2, Upload } from "lucide-react";
import { AUDIO_HINT_LABELS } from "@revsense/backend";
import { analyzeAudioBlob } from "@/lib/audio/analyze";
import {
  MAX_RECORDING_SECONDS,
  useRecorder,
} from "@/lib/audio/useRecorder";
import { formatClock } from "@/lib/ui";
import { EnvelopeWaveform, LiveWaveform } from "@/components/audio/Waveforms";
import type { AudioState } from "./types";

interface AudioStepProps {
  audio: AudioState | null;
  onAudioChange: (audio: AudioState | null) => void;
}

export function AudioStep({ audio, onAudioChange }: AudioStepProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = async (
    blob: Blob,
    source: "recording" | "upload",
    fileName?: string
  ) => {
    setAnalyzing(true);
    setAnalysisError(null);
    try {
      const { features, envelope } = await analyzeAudioBlob(
        blob,
        source,
        fileName
      );
      if (audio?.objectUrl) URL.revokeObjectURL(audio.objectUrl);
      onAudioChange({
        features,
        envelope,
        objectUrl: URL.createObjectURL(blob),
        label:
          source === "recording"
            ? `Recording · ${features.durationSec.toFixed(1)}s`
            : `${fileName ?? "Uploaded clip"} · ${features.durationSec.toFixed(1)}s`,
      });
    } catch {
      setAnalysisError(
        "Couldn't decode that audio. Try a different file format (wav, mp3, m4a, webm) or re-record."
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const recorder = useRecorder((blob) => void handleCapture(blob, "recording"));

  const removeAudio = () => {
    if (audio?.objectUrl) URL.revokeObjectURL(audio.objectUrl);
    onAudioChange(null);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-white">
          Add a recording{" "}
          <span className="ml-1 text-sm font-normal text-zinc-400">
            optional, improves accuracy
          </span>
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
          Hold your phone near the noise with the engine running (parked,
          parking brake on). We don&apos;t save your recording.
        </p>
      </div>

      {recorder.state === "recording" ? (
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
              </span>
              <span className="font-mono text-sm text-zinc-200">
                {formatClock(recorder.elapsed)} / {formatClock(MAX_RECORDING_SECONDS)}
              </span>
            </div>
            <button
              type="button"
              onClick={recorder.stop}
              className="flex min-h-11 items-center gap-2 rounded-xl bg-red-500/90 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-500"
            >
              <Square className="h-4 w-4 fill-current" /> Stop
            </button>
          </div>
          <div className="mt-4">
            {recorder.analyser && <LiveWaveform analyser={recorder.analyser} />}
          </div>
        </div>
      ) : audio ? (
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-sm font-medium text-zinc-200">
              {audio.label}
            </p>
            <button
              type="button"
              onClick={removeAudio}
              className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-white/5 hover:text-red-300"
            >
              <Trash2 className="h-3.5 w-3.5" /> Remove
            </button>
          </div>
          <EnvelopeWaveform envelope={audio.envelope} className="mt-3" />
          {audio.objectUrl && (
            <audio
              controls
              src={audio.objectUrl}
              className="mt-3 h-10 w-full"
              preload="metadata"
            />
          )}
          {audio.features.hints.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                What we noticed
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {audio.features.hints.map((hint) => (
                  <span
                    key={hint}
                    className="rounded-full border border-amber-400/25 bg-amber-500/10 px-3 py-1 text-xs text-amber-200"
                  >
                    {AUDIO_HINT_LABELS[hint]}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => void recorder.start()}
            disabled={recorder.state === "requesting" || analyzing}
            className="glass group flex flex-col items-center gap-3 rounded-2xl px-6 py-9 transition-colors hover:bg-white/[0.06] disabled:opacity-60"
          >
            <span className="pulse-ring relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-orange-500 shadow-[0_0_32px_-8px_rgba(239,91,43,0.8)]">
              {recorder.state === "requesting" ? (
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              ) : (
                <Mic className="h-6 w-6 text-white" />
              )}
            </span>
            <span className="text-sm font-semibold text-white">
              Record with microphone
            </span>
            <span className="text-xs text-zinc-400">
              up to {MAX_RECORDING_SECONDS} seconds
            </span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={analyzing}
            className="glass group flex flex-col items-center gap-3 rounded-2xl border-dashed px-6 py-9 transition-colors hover:bg-white/[0.06] disabled:opacity-60"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
              {analyzing ? (
                <Loader2 className="h-6 w-6 animate-spin text-amber-300" />
              ) : (
                <Upload className="h-6 w-6 text-amber-300" />
              )}
            </span>
            <span className="text-sm font-semibold text-white">
              {analyzing ? "Analyzing audio…" : "Upload an audio file"}
            </span>
            <span className="text-xs text-zinc-400">wav · mp3 · m4a · webm</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleCapture(file, "upload", file.name);
              e.target.value = "";
            }}
          />
        </div>
      )}

      {(recorder.error || analysisError) && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {recorder.error ?? analysisError}
        </div>
      )}

      <p className="text-xs leading-relaxed text-zinc-400">
        No recording? No problem — describe the problem in words instead. It
        works either way.
      </p>
    </div>
  );
}
