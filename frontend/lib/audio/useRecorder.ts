"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const MAX_RECORDING_SECONDS = 30;

export type RecorderState = "idle" | "requesting" | "recording" | "error";

interface UseRecorderResult {
  state: RecorderState;
  elapsed: number;
  error: string | null;
  /** Live analyser for waveform rendering while recording. */
  analyser: AnalyserNode | null;
  start: () => Promise<void>;
  stop: () => void;
}

/**
 * MediaRecorder wrapper tuned for car sounds: browser voice processing
 * (echo cancellation, noise suppression, auto gain) is disabled because it
 * actively removes the mechanical noises we're trying to capture.
 */
export function useRecorder(
  onComplete: (blob: Blob) => void
): UseRecorderResult {
  const [state, setState] = useState<RecorderState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    void audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    setAnalyser(null);
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      streamRef.current = stream;

      const AudioCtor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new AudioCtor();
      audioCtxRef.current = ctx;
      const sourceNode = ctx.createMediaStreamSource(stream);
      const analyserNode = ctx.createAnalyser();
      analyserNode.fftSize = 1024;
      sourceNode.connect(analyserNode);
      setAnalyser(analyserNode);

      const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find(
        (t) => MediaRecorder.isTypeSupported(t)
      );
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined
      );
      recorderRef.current = recorder;
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        cleanup();
        setState("idle");
        setElapsed(0);
        const blob = new Blob(chunks, {
          type: recorder.mimeType || "audio/webm",
        });
        if (blob.size > 0) onCompleteRef.current(blob);
      };

      recorder.start();
      setState("recording");
      const startedAt = Date.now();
      timerRef.current = setInterval(() => {
        const seconds = (Date.now() - startedAt) / 1000;
        setElapsed(seconds);
        if (seconds >= MAX_RECORDING_SECONDS) stop();
      }, 100);
    } catch (err) {
      cleanup();
      setState("error");
      setError(
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Microphone access was denied. You can upload an audio file instead."
          : "Couldn't start recording on this device. You can upload an audio file instead."
      );
    }
  }, [cleanup, stop]);

  return { state, elapsed, error, analyser, start, stop };
}
