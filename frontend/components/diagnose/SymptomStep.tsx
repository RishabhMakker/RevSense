"use client";

import {
  SOUND_CONTEXTS,
  SOUND_CONTEXT_LABELS,
  type SoundContext,
} from "@revsense/backend";

const EXAMPLES = [
  "Clicking sound when turning the steering wheel at low speed",
  "Grinding noise when braking",
  "Knocking sound when accelerating up hills",
  "Rattle from the front when driving over bumps",
];

interface SymptomStepProps {
  symptomText: string;
  contexts: SoundContext[];
  onSymptomChange: (text: string) => void;
  onContextsChange: (contexts: SoundContext[]) => void;
}

export function SymptomStep({
  symptomText,
  contexts,
  onSymptomChange,
  onContextsChange,
}: SymptomStepProps) {
  const toggleContext = (ctx: SoundContext) => {
    onContextsChange(
      contexts.includes(ctx)
        ? contexts.filter((c) => c !== ctx)
        : [...contexts, ctx]
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">
          Describe the problem
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
          Be specific: what you notice, where it seems to come from, and what
          makes it better or worse. If there&apos;s a sound, naming it helps —
          clicking, grinding, squealing, knocking, rattling, whining, humming.
        </p>
      </div>

      <div>
        <textarea
          value={symptomText}
          onChange={(e) => onSymptomChange(e.target.value)}
          aria-label="Describe the car problem in your own words"
          rows={4}
          maxLength={2000}
          placeholder='e.g. "I hear a clicking or popping sound when turning the steering wheel at low speed, like pulling out of a parking spot."'
          className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-base leading-relaxed text-white placeholder:text-zinc-400 outline-none transition-colors focus:border-amber-400/50 focus:bg-white/[0.06] sm:text-sm"
        />
        <div className="mt-1 flex items-center justify-between text-xs text-zinc-600">
          <span>{symptomText.trim().length < 10 ? "At least 10 characters" : " "}</span>
          <span>{symptomText.length}/2000</span>
        </div>
        <div className="mt-1 flex flex-wrap gap-2">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => onSymptomChange(example)}
              className="flex min-h-11 items-center rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs text-zinc-400 transition-colors hover:border-amber-400/30 hover:text-amber-200"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-zinc-200">
          When does it happen?{" "}
          <span className="font-normal text-zinc-400">select all that apply</span>
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {SOUND_CONTEXTS.map((ctx) => {
            const active = contexts.includes(ctx);
            return (
              <button
                key={ctx}
                type="button"
                onClick={() => toggleContext(ctx)}
                aria-pressed={active}
                className={`min-h-11 rounded-xl border px-4 py-2 text-sm transition-all ${
                  active
                    ? "border-amber-400/60 bg-amber-500/15 text-amber-200 shadow-[0_0_16px_-6px_rgba(245,158,11,0.5)]"
                    : "border-white/10 bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200"
                }`}
              >
                {SOUND_CONTEXT_LABELS[ctx]}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
