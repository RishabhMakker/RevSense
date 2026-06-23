"use client";

import { AudioWaveform, Car, MessageSquareText, Tags } from "lucide-react";
import { SOUND_CONTEXT_LABELS, type SoundContext } from "@revsense/backend";
import type { AudioState, VehicleFormState } from "./types";

interface ReviewStepProps {
  audio: AudioState | null;
  vehicle: VehicleFormState;
  symptomText: string;
  contexts: SoundContext[];
}

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3.5 rounded-xl border border-white/5 bg-white/[0.02] p-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
        <Icon className="h-4.5 w-4.5 text-amber-300" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
          {label}
        </p>
        <div className="mt-1 text-sm leading-relaxed text-zinc-200">
          {children}
        </div>
      </div>
    </div>
  );
}

export function ReviewStep({
  audio,
  vehicle,
  symptomText,
  contexts,
}: ReviewStepProps) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-white">Review &amp; run</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
          We&apos;ll match this against common car problems and rank the most
          likely causes. We don&apos;t save anything.
        </p>
      </div>

      <div className="space-y-3">
        <Row icon={Car} label="Vehicle">
          {vehicle.year} {vehicle.make} {vehicle.model}
          {vehicle.mileage && ` · ${Number(vehicle.mileage).toLocaleString()} miles`}
          {vehicle.engineType !== "unknown" && ` · ${vehicle.engineType}`}
        </Row>
        <Row icon={MessageSquareText} label="Your description">
          <span className="italic">&ldquo;{symptomText.trim()}&rdquo;</span>
        </Row>
        <Row icon={Tags} label="When it happens">
          {contexts.map((c) => SOUND_CONTEXT_LABELS[c]).join(" · ")}
        </Row>
        <Row icon={AudioWaveform} label="Audio">
          {audio ? (
            <>
              {audio.label}
              {audio.features.hints.length > 0 && (
                <span className="text-zinc-400">
                  {" "}
                  — {audio.features.hints.length} details from the recording
                </span>
              )}
            </>
          ) : (
            <span className="text-zinc-400">
              No recording added — we&apos;ll diagnose from your description.
            </span>
          )}
        </Row>
      </div>
    </div>
  );
}
