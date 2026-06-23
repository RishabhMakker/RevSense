"use client";

import { MotionConfig } from "framer-motion";

/**
 * Makes every Framer Motion animation honor the OS "reduce motion" setting:
 * transforms (slide/scale) are dropped, opacity crossfades are kept. Pairs with
 * the CSS `prefers-reduced-motion` block in globals.css (which covers the
 * non-Framer, looping decorative animations).
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
