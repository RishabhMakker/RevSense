"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";

export interface MobileNavLink {
  href: string;
  label: string;
}

interface MobileNavProps {
  links: readonly MobileNavLink[];
}

/**
 * Mobile-only disclosure nav. The inline desktop nav still owns `sm` and up; below
 * that breakpoint the links collapse behind this hamburger so they never overflow
 * or vanish. The panel is a matte solid surface that drops just under the header
 * pill, animated through the app-wide MotionProvider so reduced-motion is honored.
 */
export function MobileNav({ links }: MobileNavProps) {
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  // While open: tap/click outside closes; Escape closes and returns focus to the
  // trigger so keyboard users aren't dropped at the top of the document.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        !panelRef.current?.contains(target) &&
        !buttonRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // If the viewport grows into the desktop nav (sm = 640px), drop the panel so a
  // rotate/resize never leaves a stale mobile menu hanging over the inline nav.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const onChange = () => {
      if (mq.matches) setOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Move focus into the panel on open so the menu is immediately keyboard-usable.
  useEffect(() => {
    if (open) firstLinkRef.current?.focus();
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-zinc-300 transition-colors hover:bg-white/5 hover:text-white sm:hidden"
      >
        {open ? (
          <X className="h-5 w-5" aria-hidden />
        ) : (
          <Menu className="h-5 w-5" aria-hidden />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.nav
            ref={panelRef}
            id={panelId}
            aria-label="Mobile"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="glass-strong absolute inset-x-0 top-full z-50 mt-2 origin-top rounded-2xl p-2 shadow-xl shadow-black/40 sm:hidden"
          >
            <ul className="flex flex-col gap-0.5">
              {links.map((link, i) => (
                <li key={link.href}>
                  <Link
                    ref={i === 0 ? firstLinkRef : undefined}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="flex min-h-11 items-center rounded-xl px-3 text-sm text-zinc-200 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/diagnose"
              onClick={() => setOpen(false)}
              className="mt-1.5 flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-4 text-sm font-semibold text-ink-950 shadow-[0_0_24px_-8px_rgba(245,158,11,0.8)] transition-all hover:brightness-110"
            >
              Start diagnosis
            </Link>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}
