import Link from "next/link";
import { ArrowRight, Mic, ShieldCheck } from "lucide-react";

const EQ_BARS = [
  0.35, 0.6, 0.45, 0.8, 0.55, 1, 0.7, 0.9, 0.5, 0.75, 0.4, 0.65, 0.85, 0.45,
  0.7, 0.55, 0.95, 0.6, 0.4, 0.8, 0.5, 0.7, 0.35, 0.6,
];

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-20 pt-36 sm:pt-44">
      <div className="grid-bg absolute inset-0 -z-10" />

      <div className="mx-auto flex max-w-6xl flex-col items-center px-6 text-center">
        <div className="glass mb-7 flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-amber-200/90">
          <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
          Ranked causes · Safety-first · Mechanic-ready
        </div>

        <h1 className="max-w-3xl text-balance text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-6xl">
          Understand what your car is <span className="text-amber-400">telling you</span>
        </h1>

        <p className="mt-6 max-w-2xl text-balance text-base leading-relaxed text-zinc-400 sm:text-lg">
          Describe what&apos;s going on — and add a recording if you have one.
          RevSense ranks the likely causes, flags anything unsafe, and tells you
          exactly what to say at the shop.
        </p>

        <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/diagnose"
            className="group flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-7 py-3.5 text-base font-semibold text-ink-950 shadow-[0_0_36px_-8px_rgba(245,158,11,0.8)] transition-all hover:shadow-[0_0_44px_-6px_rgba(245,158,11,0.95)] hover:brightness-110"
          >
            <Mic className="h-5 w-5" />
            Diagnose your car
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/diagnose?demo=1"
            className="glass rounded-2xl px-7 py-3.5 text-base font-medium text-zinc-200 transition-colors hover:bg-white/[0.07] hover:text-white"
          >
            Try the demo scenario
          </Link>
        </div>

        {/* Animated equalizer */}
        <div className="mt-16 flex h-20 w-full max-w-xl items-center justify-center gap-1.5 sm:gap-2">
          {EQ_BARS.map((height, i) => (
            <div
              key={i}
              className="eq-bar w-2 rounded-full bg-gradient-to-t from-amber-500/30 via-amber-400/70 to-orange-400"
              style={{
                height: `${height * 100}%`,
                animationDelay: `${(i * 97) % 1100}ms`,
                animationDuration: `${900 + ((i * 131) % 600)}ms`,
              }}
            />
          ))}
        </div>

        {/* Floating sample verdict card */}
        <div className="glass-float mt-12 w-full max-w-2xl rounded-2xl p-5 text-left shadow-[0_24px_80px_-32px_rgba(0,0,0,0.9)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15">
                <ShieldCheck className="h-5 w-5 text-amber-300" />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">
                  Worn CV joint / axle
                </p>
                <p className="text-xs text-zinc-400">
                  2014 Honda Civic · clicking on low-speed turns
                </p>
              </div>
            </div>
            <span className="rounded-full border border-amber-400/30 bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-300">
              Drive gently — get it checked soon
            </span>
          </div>
          <div className="mt-4 space-y-2.5">
            {[
              { label: "Worn CV joint / axle", value: 72 },
              { label: "Steering column / intermediate shaft", value: 48 },
              { label: "Worn strut mount / bearing", value: 41 },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-3">
                <span className="w-56 shrink-0 truncate text-xs text-zinc-400">
                  {row.label}
                </span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                    style={{ width: `${row.value}%` }}
                  />
                </div>
                <span className="w-9 text-right font-mono text-xs text-amber-300">
                  {row.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
