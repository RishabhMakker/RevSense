import Link from "next/link";
import { KNOWN_ISSUE_COUNT } from "@revsense/backend";
import {
  AlertTriangle,
  AudioWaveform,
  BrainCircuit,
  ClipboardList,
  Cpu,
  Gauge,
  Lock,
  Mic,
  Stethoscope,
  Wrench,
} from "lucide-react";

function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-balance text-base leading-relaxed text-zinc-400">
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function HowItWorks() {
  const steps = [
    {
      icon: Mic,
      step: "01",
      title: "Capture the sound",
      body: "Record the noise right from your browser (or upload a clip). RevSense extracts acoustic clues — pitch, rhythm, sharpness — on your device. The audio itself never leaves your phone.",
    },
    {
      icon: ClipboardList,
      step: "02",
      title: "Describe the symptom",
      body: "Tell us about your car and the noise in plain language — \"clicking when I turn left at low speed\" — then tag exactly when it happens.",
    },
    {
      icon: Stethoscope,
      step: "03",
      title: "Get a ranked triage",
      body: `A diagnostic engine scores ${KNOWN_ISSUE_COUNT} known failure patterns against your report and returns likely causes, what to check first, safety guidance, and a script for your mechanic.`,
    },
  ];
  return (
    <section id="how-it-works" className="px-6 py-24">
      <SectionHeading
        eyebrow="How it works"
        title="From mystery noise to action plan in a minute"
      />
      <div className="mx-auto mt-14 grid max-w-5xl gap-5 sm:grid-cols-3">
        {steps.map(({ icon: Icon, step, title, body }) => (
          <div
            key={step}
            className="glass group relative overflow-hidden rounded-2xl p-6 transition-colors hover:bg-white/[0.06]"
          >
            <span className="absolute right-5 top-4 font-mono text-4xl font-bold text-white/[0.06] transition-colors group-hover:text-amber-400/10">
              {step}
            </span>
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-500/20">
              <Icon className="h-5 w-5 text-amber-300" />
            </span>
            <h3 className="mt-5 text-lg font-semibold text-white">{title}</h3>
            <p className="mt-2.5 text-sm leading-relaxed text-zinc-400">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Features() {
  const features = [
    {
      icon: AudioWaveform,
      title: "Real audio analysis",
      body: "FFT-based feature extraction in your browser: spectral centroid, crest factor, pulse rate, band energy. Honest acoustic clues — not a pretend ML model.",
    },
    {
      icon: Cpu,
      title: "Transparent rule engine",
      body: `${KNOWN_ISSUE_COUNT} curated failure patterns with weighted scoring across sounds, phrases, driving context, vehicle age, and mileage. Every ranking comes with its evidence.`,
    },
    {
      icon: BrainCircuit,
      title: "Optional AI explanations",
      body: "Add an Anthropic or OpenAI key and Claude rewrites the result into a deeper, case-specific explanation. No key? The engine works fully offline.",
    },
    {
      icon: AlertTriangle,
      title: "Safety-first red flags",
      body: "Brake grinding, engine knock, smoke, overheating, wheel wobble — high-risk symptoms trigger explicit stop-driving alerts that AI can never soften.",
    },
    {
      icon: Wrench,
      title: "Mechanic-ready output",
      body: "A word-for-word script of what to tell your shop, what to check first, repair direction, and difficulty — so you walk in informed.",
    },
    {
      icon: Lock,
      title: "Nothing stored",
      body: "No accounts, no database, no uploads. Audio is analyzed on-device; only a handful of numeric features are sent with your form, then discarded.",
    },
  ];
  return (
    <section id="features" className="px-6 py-24">
      <SectionHeading
        eyebrow="Features"
        title="A serious triage tool, not a magic 8-ball"
        subtitle="RevSense is built to be useful and honest: ranked possibilities with evidence and confidence — never fake certainty."
      />
      <div className="mx-auto mt-14 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="glass rounded-2xl p-6 transition-colors hover:bg-white/[0.06]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
              <Icon className="h-5 w-5 text-amber-300" />
            </span>
            <h3 className="mt-4 font-semibold text-white">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function DemoCallout() {
  return (
    <section className="px-6 py-12">
      <div className="glass-strong relative mx-auto max-w-5xl overflow-hidden rounded-3xl p-8 sm:p-12">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="relative flex flex-col items-start gap-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
              <Gauge className="h-4 w-4" /> Try it in 10 seconds
            </p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              &ldquo;Clicking when I turn the wheel at low speed&rdquo;
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:text-base">
              Load the classic CV-joint scenario — a 2014 Honda Civic with 128k
              miles — and watch the engine rank causes, surface evidence, and
              draft the mechanic script.
            </p>
          </div>
          <Link
            href="/diagnose?demo=1"
            className="shrink-0 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3 font-semibold text-ink-950 shadow-[0_0_30px_-8px_rgba(245,158,11,0.8)] transition-all hover:brightness-110"
          >
            Load demo scenario
          </Link>
        </div>
      </div>
    </section>
  );
}

export function SafetySection() {
  return (
    <section id="safety" className="px-6 py-24">
      <div className="mx-auto max-w-3xl rounded-3xl border border-red-400/15 bg-red-500/[0.04] p-8 sm:p-10">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/15">
            <AlertTriangle className="h-5 w-5 text-red-300" />
          </span>
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Safety first — and a clear disclaimer
          </h2>
        </div>
        <div className="mt-5 space-y-4 text-sm leading-relaxed text-zinc-300">
          <p>
            RevSense is a <strong className="text-white">triage assistant</strong>,
            not a certified mechanic. It ranks possibilities from your
            description and basic acoustic clues — it cannot inspect your car
            and cannot guarantee a diagnosis. Treat every result as a starting
            point for a conversation with a qualified technician.
          </p>
          <p>
            Stop driving and get a professional inspection immediately if you
            experience any of the following:
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {[
              "Grinding while braking",
              "Loud or deep engine knocking",
              "Smoke or burning smells",
              "Overheating or steam",
              "Oil-pressure warning light",
              "Wheel wobble or violent shaking",
              "Steering that feels loose or unresponsive",
              "Heavy fluid leaks",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-zinc-300">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                {item}
              </li>
            ))}
          </ul>
          <p className="text-zinc-400">
            RevSense detects these patterns in your description and will tell
            you, plainly, when it thinks you should stop driving.
          </p>
        </div>
      </div>
    </section>
  );
}
