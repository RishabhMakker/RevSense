import Link from "next/link";
import { ArrowRight, ShieldCheck, Stethoscope } from "lucide-react";
import { HeroEqualizer } from "./HeroEqualizer";

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

        <div className="mt-9">
          <Link
            href="/diagnose"
            className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-7 py-3.5 text-base font-semibold text-ink-950 shadow-[0_0_36px_-8px_rgba(245,158,11,0.8)] transition-all hover:shadow-[0_0_44px_-6px_rgba(245,158,11,0.95)] hover:brightness-110"
          >
            <Stethoscope className="h-6 w-6" strokeWidth={2.4} />
            Diagnose your car
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <HeroEqualizer />
      </div>
    </section>
  );
}
