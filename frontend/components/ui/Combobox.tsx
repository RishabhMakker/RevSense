"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import Fuse from "fuse.js";
import { inputClass } from "@/lib/ui";

/** Classic edit-distance, used only for the gentle "Did you mean…" affordance. */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 0; i < a.length; i++) {
    const curr = [i + 1];
    for (let j = 0; j < b.length; j++) {
      const cost = a[i] === b[j] ? 0 : 1;
      curr.push(Math.min(curr[j]! + 1, prev[j + 1]! + 1, prev[j]! + cost));
    }
    prev = curr;
  }
  return prev[b.length]!;
}

export interface ComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder?: string;
  ariaLabel?: string;
  id?: string;
  maxLength?: number;
  /** Subtle spinner while async option sources (e.g. the model API) resolve. */
  loading?: boolean;
  /** Offer a "Did you mean X?" nudge on a near-miss. Suggestive, never forced. */
  suggestCorrections?: boolean;
}

/**
 * On-brand, accessible combobox: a typeable input over a matte solid dropdown.
 * Free text is always allowed — picking an option is a convenience, never a
 * constraint. Filtering is fuzzy (fuse.js) so small typos still surface matches,
 * and a Levenshtein check offers a gentle correction without overwriting input.
 */
export function Combobox({
  value,
  onChange,
  options,
  placeholder,
  ariaLabel,
  id,
  maxLength,
  loading = false,
  suggestCorrections = true,
}: ComboboxProps) {
  const reactId = useId();
  const inputId = id ?? `combobox-${reactId}`;
  const listId = `${inputId}-listbox`;

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const fuse = useMemo(
    () =>
      new Fuse(options as string[], {
        threshold: 0.4,
        ignoreLocation: true,
        minMatchCharLength: 1,
      }),
    [options]
  );

  const query = value.trim();
  const filtered = useMemo(() => {
    if (!query) return [...options];
    const hits = fuse.search(query).map((r) => r.item);
    if (hits.length > 0) return hits;
    // Fall back to substring so an exotic free-text value still self-matches.
    const lower = query.toLowerCase();
    return options.filter((o) => o.toLowerCase().includes(lower));
  }, [query, options, fuse]);

  const suggestion = useMemo(() => {
    if (!suggestCorrections || query.length < 2) return null;
    if (options.some((o) => o.toLowerCase() === query.toLowerCase())) return null;
    let best: string | null = null;
    let bestDist = Infinity;
    for (const o of options) {
      const d = levenshtein(query.toLowerCase(), o.toLowerCase());
      if (d < bestDist) {
        bestDist = d;
        best = o;
      }
    }
    // Tighter tolerance for short words; looser for long ones.
    const tolerance = query.length <= 4 ? 1 : query.length <= 7 ? 2 : 3;
    return best && bestDist > 0 && bestDist <= tolerance ? best : null;
  }, [query, options, suggestCorrections]);

  // Close when focus/click leaves the component.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Keep the highlighted option scrolled into view.
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    const el = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const select = (option: string) => {
    onChange(option);
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) {
          setOpen(true);
          return;
        }
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        if (open) setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        // Only commit a suggestion the user explicitly highlighted; otherwise
        // keep their typed text (free text is first-class).
        if (open && activeIndex >= 0 && filtered[activeIndex]) {
          e.preventDefault();
          select(filtered[activeIndex]!);
        } else {
          setOpen(false);
        }
        break;
      case "Escape":
        if (open) {
          e.preventDefault();
          setOpen(false);
          setActiveIndex(-1);
        }
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  };

  const activeOptionId =
    open && activeIndex >= 0 ? `${listId}-opt-${activeIndex}` : undefined;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          id={inputId}
          className={inputClass}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeOptionId}
          aria-label={ariaLabel}
          autoComplete="off"
          placeholder={placeholder}
          value={value}
          maxLength={maxLength}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            // Typing changes the visible set, so drop any stale highlight.
            setActiveIndex(-1);
          }}
          onClick={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        {loading && (
          <Loader2
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-zinc-500"
            aria-hidden
          />
        )}
      </div>

      {suggestion && (
        <p className="mt-1.5 text-xs text-zinc-400">
          Did you mean{" "}
          <button
            type="button"
            onClick={() => select(suggestion)}
            className="font-medium text-amber-300 underline decoration-amber-400/40 underline-offset-2 transition-colors hover:text-amber-200"
          >
            {suggestion}
          </button>
          ?
        </p>
      )}

      <AnimatePresence>
        {open && filtered.length > 0 && (
          <motion.ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={ariaLabel}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14, ease: "easeOut" }}
            className="glass-strong absolute z-50 mt-1.5 max-h-60 w-full overflow-auto rounded-xl p-1 shadow-xl shadow-black/40"
          >
            {filtered.map((option, i) => {
              const active = i === activeIndex;
              return (
                <li
                  key={option}
                  id={`${listId}-opt-${i}`}
                  role="option"
                  aria-selected={active}
                  onMouseEnter={() => setActiveIndex(i)}
                  onPointerDown={(e) => {
                    // Commit before the input's blur/click-outside can fire.
                    e.preventDefault();
                    select(option);
                  }}
                  className={`flex min-h-11 cursor-pointer items-center rounded-lg border px-3 text-sm transition-colors ${
                    active
                      ? "border-amber-400/60 bg-amber-500/15 text-amber-200"
                      : "border-transparent text-zinc-200"
                  }`}
                >
                  {option}
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
