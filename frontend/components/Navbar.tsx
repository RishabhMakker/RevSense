import Link from "next/link";
import { Logo } from "./Logo";
import { MobileNav, type MobileNavLink } from "./MobileNav";

const NAV_LINKS: readonly MobileNavLink[] = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#features", label: "Features" },
  { href: "/#safety", label: "Safety" },
  { href: "/garage", label: "Garage" },
];

export function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <div className="relative mx-auto mt-3 flex max-w-6xl items-center justify-between rounded-2xl px-4 py-2.5 glass-strong sm:mx-6 lg:mx-auto">
        <Logo />
        <nav className="hidden items-center gap-6 text-sm text-zinc-300 sm:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/diagnose"
          className="hidden rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2 text-sm font-semibold text-ink-950 shadow-[0_0_24px_-8px_rgba(245,158,11,0.8)] transition-all hover:shadow-[0_0_32px_-6px_rgba(245,158,11,0.9)] hover:brightness-110 sm:inline-flex"
        >
          Start diagnosis
        </Link>
        <MobileNav links={NAV_LINKS} />
      </div>
    </header>
  );
}
