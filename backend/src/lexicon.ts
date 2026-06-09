/**
 * Maps free-text symptom descriptions onto a small canonical vocabulary of
 * car-noise types. Matching is prefix-stem based ("click" catches clicking,
 * clicks, clicky) with word boundaries so "ping" doesn't match "stopping".
 */

export const SOUND_TYPES = [
  "click",
  "pop",
  "tick",
  "knock",
  "grind",
  "squeal",
  "chirp",
  "rattle",
  "clunk",
  "hiss",
  "whine",
  "hum",
  "rumble",
  "creak",
  "vibration",
] as const;
export type SoundType = (typeof SOUND_TYPES)[number];

/** Prefix stems per canonical sound. Multi-word entries match as phrases. */
const SOUND_STEMS: Record<SoundType, string[]> = {
  click: ["click", "clack", "snapp", "snap"],
  pop: ["pop"],
  tick: ["tick", "tapp", "tap"],
  knock: ["knock", "ping", "pink", "detonat", "marble"],
  grind: ["grind", "scrap", "grat", "metal on metal", "metal-on-metal"],
  squeal: ["squeal", "screech", "squeak", "shriek"],
  chirp: ["chirp"],
  rattle: ["rattl", "buzz", "jingl", "clatter"],
  clunk: ["clunk", "klunk", "thud", "thump", "bang", "clonk"],
  hiss: ["hiss", "whoosh", "air leak", "air escaping", "sss"],
  whine: ["whine", "whin", "whirr", "whir", "wail"],
  hum: ["hum", "humm", "drone", "dron", "growl", "roar", "howl"],
  rumble: ["rumbl", "boom"],
  creak: ["creak", "creek", "groan", "squawk"],
  vibration: ["vibrat", "shudder", "judder", "shak", "wobbl", "puls"],
};

export interface SoundMatch {
  type: SoundType;
  matchedWord: string;
}

/** Lowercase, collapse punctuation to spaces, squeeze whitespace. */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stemToRegex(stem: string): RegExp {
  const escaped = stem.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\w*`, "i");
}

const COMPILED: { type: SoundType; stem: string; re: RegExp }[] = (
  Object.entries(SOUND_STEMS) as [SoundType, string[]][]
).flatMap(([type, stems]) =>
  stems.map((stem) => ({ type, stem, re: stemToRegex(stem) }))
);

/** Detect canonical sound types present in normalized text. */
export function detectSounds(normalizedText: string): SoundMatch[] {
  const found = new Map<SoundType, string>();
  for (const { type, re } of COMPILED) {
    if (found.has(type)) continue;
    const m = normalizedText.match(re);
    if (m) found.set(type, m[0]);
  }
  return [...found.entries()].map(([type, matchedWord]) => ({
    type,
    matchedWord,
  }));
}

/**
 * Match a phrase list against normalized text with word boundaries on the
 * leading edge (so "turn" catches "turning" but not "return").
 */
export function matchPhrases(
  normalizedText: string,
  phrases: readonly string[]
): string[] {
  const hits: string[] = [];
  for (const phrase of phrases) {
    if (stemToRegex(phrase).test(normalizedText)) hits.push(phrase);
  }
  return hits;
}
