"use client";

import { useEffect, useRef } from "react";

/** Live oscilloscope-style waveform driven by an AnalyserNode while recording. */
export function LiveWaveform({ analyser }: { analyser: AnalyserNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const data = new Uint8Array(analyser.fftSize);
    let frame = 0;

    const draw = () => {
      frame = requestAnimationFrame(draw);
      const { width, height } = canvas;
      analyser.getByteTimeDomainData(data);
      ctx.clearRect(0, 0, width, height);

      ctx.beginPath();
      ctx.lineWidth = 2;
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, "#fbbf24");
      gradient.addColorStop(1, "#ef5b2b");
      ctx.strokeStyle = gradient;

      const slice = width / data.length;
      for (let i = 0; i < data.length; i++) {
        const v = data[i] / 128 - 1;
        const y = height / 2 + v * (height / 2.2);
        if (i === 0) ctx.moveTo(0, y);
        else ctx.lineTo(i * slice, y);
      }
      ctx.stroke();
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, [analyser]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={96}
      className="h-24 w-full rounded-lg"
      aria-label="Live audio waveform"
    />
  );
}

/** Static bar waveform rendered from a precomputed amplitude envelope. */
export function EnvelopeWaveform({
  envelope,
  className = "",
}: {
  envelope: number[];
  className?: string;
}) {
  return (
    <div
      className={`flex h-14 items-center gap-[2px] ${className}`}
      aria-hidden="true"
    >
      {envelope.map((value, i) => (
        <div
          key={i}
          className="w-full flex-1 rounded-full bg-gradient-to-t from-amber-500/80 to-orange-400/80"
          style={{ height: `${Math.max(6, value * 100)}%` }}
        />
      ))}
    </div>
  );
}
