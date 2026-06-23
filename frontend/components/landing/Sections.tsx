import Link from "next/link";
import {
  AlertTriangle,
  AudioWaveform,
  ClipboardList,
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
      icon: ClipboardList,
      step: "01",
      title: "Describe the problem",
      body: "Tell us about your car and what it's doing, in plain language — \"clicking when I turn at low speed\" — and tag when it happens.",
    },
    {
      icon: Mic,
      step: "02",
      title: "Add a recording (optional)",
      body: "Got the noise on your phone? Add a clip and RevSense factors it in. No clip? It works from your description alone. We don't save your recording.",
    },
    {
      icon: Stethoscope,
      step: "03",
      title: "Get a ranked diagnosis",
      body: "RevSense ranks the likely causes, tells you what to check first, whether it's safe to drive, and exactly what to say at the shop.",
    },
  ];
  return (
    <section id="how-it-works" className="px-6 py-24">
      <SectionHeading
        eyebrow="How it works"
        title="From mystery problem to a clear plan in a minute"
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
      icon: Gauge,
      title: "Ranked, not guessed",
      body: "Every likely cause comes with a confidence level and the reasons it fits your car — so you see why, not just what.",
    },
    {
      icon: AlertTriangle,
      title: "Safety comes first",
      body: "Grinding brakes, engine knock, smoke, overheating, a wobbling wheel — RevSense calls these out clearly and tells you when to stop driving.",
    },
    {
      icon: Wrench,
      title: "Mechanic-ready",
      body: "A word-for-word script for the shop, what to check first, the likely repair, and how involved it is — so you walk in informed.",
    },
    {
      icon: AudioWaveform,
      title: "Works from a recording too",
      body: "Add a clip of the noise and RevSense factors it into the ranking. Optional, never required.",
    },
    {
      icon: Stethoscope,
      title: "Clear, not clinical",
      body: "Built for people who aren't mechanics. Plain language, honest confidence, no scary jargon.",
    },
    {
      icon: Lock,
      title: "Private by default",
      body: "We don't save your recordings or results.",
    },
  ];
  return (
    <section id="features" className="px-6 py-24">
      <SectionHeading
        eyebrow="Features"
        title="A real diagnosis, not a guess"
        subtitle="Ranked possibilities with the reasons behind them — and honest confidence, never fake certainty."
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
              miles — and watch RevSense rank the causes, show its reasoning,
              and draft the mechanic script.
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
            not a certified mechanic. It ranks possibilities from what you
            describe (and a recording, if you add one) — it cannot inspect your
            car and cannot guarantee a diagnosis. Treat every result as a
            starting point for a conversation with a qualified technician.
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
            RevSense watches for these and will tell you, plainly, when to stop
            driving.
          </p>
        </div>
      </div>
    </section>
  );
}
