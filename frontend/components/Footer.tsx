import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-ink-900/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-sm space-y-3">
          <Logo />
          <p className="text-sm leading-relaxed text-zinc-400">
            A clear, safety-first way to figure out what your car is doing.
            Describe the problem, add a recording if you have one, and get a
            ranked diagnosis with a plan.
          </p>
        </div>
        <div className="flex gap-14 text-sm">
          <div className="space-y-2.5">
            <p className="font-medium text-zinc-200">Product</p>
            <ul className="space-y-2 text-zinc-400">
              <li>
                <Link href="/diagnose" className="hover:text-white">
                  Diagnose your car
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="hover:text-white">
                  How it works
                </Link>
              </li>
              <li>
                <Link href="/#features" className="hover:text-white">
                  Features
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-2.5">
            <p className="font-medium text-zinc-200">Trust</p>
            <ul className="space-y-2 text-zinc-400">
              <li>
                <Link href="/#safety" className="hover:text-white">
                  Safety &amp; disclaimer
                </Link>
              </li>
              <li>
                <span className="cursor-default">We don&apos;t save your recordings</span>
              </li>
              <li>
                <span className="cursor-default">Private by default</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-white/5 px-6 py-4">
        <p className="mx-auto max-w-6xl text-xs leading-relaxed text-zinc-400">
          RevSense is not a certified mechanic and cannot guarantee the cause of
          a sound. For braking, steering, smoke, burning smells, overheating, or
          oil-pressure warnings: stop driving and consult a professional.
        </p>
      </div>
    </footer>
  );
}
