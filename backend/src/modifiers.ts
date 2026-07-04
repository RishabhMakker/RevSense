import { SOUND_CONTEXTS, type SoundContext } from "./schemas";
import { detectSounds, normalizeText, type SoundType } from "./lexicon";

/**
 * Deterministic symptom-modifier extraction — the regex twin of the AI
 * interpreter. It reads the same structured signals (negations, onset,
 * frequency, speed/temperature/load dependence, location, recent work) from
 * the normalized text so the engine degrades gracefully with AI off, and so
 * red-flag negation NEVER depends on a model: the AI may add signals on top,
 * but only deterministic extraction can stand between a phrase and a
 * stop-driving flag.
 */

export const ONSETS = ["sudden", "gradual", "unknown"] as const;
export type Onset = (typeof ONSETS)[number];

export const FREQUENCIES = ["constant", "intermittent", "once", "unknown"] as const;
export type Frequency = (typeof FREQUENCIES)[number];

export const SPEED_DEPENDENCES = [
  "tracks_road_speed",
  "tracks_engine_rpm",
  "independent",
  "unknown",
] as const;
export type SpeedDependence = (typeof SPEED_DEPENDENCES)[number];

export const TEMPERATURE_DEPS = ["cold_only", "warm_only", "any", "unknown"] as const;
export type TemperatureDep = (typeof TEMPERATURE_DEPS)[number];

export const LOAD_DEPS = [
  "worse_under_load",
  "worse_coasting",
  "unchanged",
  "unknown",
] as const;
export type LoadDep = (typeof LOAD_DEPS)[number];

export const NOISE_LOCATIONS = [
  "front",
  "rear",
  "left",
  "right",
  "front_left",
  "front_right",
  "rear_left",
  "rear_right",
  "under_car",
  "in_cabin",
  "unknown",
] as const;
export type NoiseLocation = (typeof NOISE_LOCATIONS)[number];

export const RECENT_WORK_AREAS = [
  "brakes",
  "tires_wheels",
  "suspension",
  "engine",
  "transmission_drivetrain",
  "exhaust",
  "battery_electrical",
  "belts_accessories",
] as const;
export type RecentWorkArea = (typeof RECENT_WORK_AREAS)[number];

export interface SymptomModifiers {
  onset: Onset;
  frequency: Frequency;
  speedDependence: SpeedDependence;
  temperature: TemperatureDep;
  load: LoadDep;
  location: NoiseLocation;
  recentWork: RecentWorkArea[];
  negatedSoundTypes: SoundType[];
  negatedContexts: SoundContext[];
}

export const UNKNOWN_MODIFIERS: SymptomModifiers = {
  onset: "unknown",
  frequency: "unknown",
  speedDependence: "unknown",
  temperature: "unknown",
  load: "unknown",
  location: "unknown",
  recentWork: [],
  negatedSoundTypes: [],
  negatedContexts: [],
};

/* ------------------------------------------------------------------ */
/* Negation windows                                                     */
/* ------------------------------------------------------------------ */

const NEGATOR =
  /\b(?:no|not|never|without|none|don'?t|doesn'?t|didn'?t|isn'?t|wasn'?t|aren'?t|weren'?t|except)\b/;

/** "not sure if the smoke…" is hedging, not a denial of the smoke. */
const HEDGED_NEGATION = /\bnot\s+(?:sure|certain|positive|clear|100)\b/;

/** Conjunctions that end the clause a phrase lives in — a negator on the far
 *  side of one ("faster I go, but doesn't change…") belongs to a different
 *  statement and must not negate this phrase. Normalization strips commas,
 *  so these words are the only clause boundaries left. */
const CLAUSE_BREAKERS = new Set([
  "but",
  "and",
  "though",
  "although",
  "however",
  "so",
  "then",
  "because",
  "while",
  "yet",
]);

function clipAtClauseBreak(tokens: string[]): string[] {
  const idx = tokens.findIndex((t) => CLAUSE_BREAKERS.has(t));
  return idx === -1 ? tokens : tokens.slice(0, idx);
}

/**
 * Is the phrase at [start, end) explicitly negated? Conservative on purpose:
 * a negator must sit within 3 tokens before the phrase ("no visible smoke")
 * or — for `direction: "both"` — within 3 same-clause tokens after it ("the
 * oil light never came on"). Sounds use `direction: "before"`: in "grinding,
 * not squealing" the trailing negator belongs to the next noun, not to the
 * grind. Hedged negations ("not sure if…") do NOT count — uncertainty is not
 * denial.
 */
export function isSpanNegated(
  normalizedText: string,
  start: number,
  end: number,
  direction: "before" | "both" = "both"
): boolean {
  const before = normalizedText
    .slice(0, start)
    .trim()
    .split(/\s+/)
    .slice(-3)
    .join(" ");
  if (HEDGED_NEGATION.test(before)) return false;
  if (NEGATOR.test(before)) return true;
  if (direction === "before") return false;
  const after = clipAtClauseBreak(
    normalizedText.slice(end).trim().split(/\s+/).slice(0, 3)
  ).join(" ");
  return NEGATOR.test(after);
}

function escapeRe(stem: string): string {
  return stem.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findSpan(
  text: string,
  phrase: string
): { start: number; end: number } | null {
  const m = text.match(new RegExp(`\\b${escapeRe(phrase)}\\w*`, "i"));
  if (!m || m.index === undefined) return null;
  return { start: m.index, end: m.index + m[0].length };
}

/** True when any of the phrases appears NOT negated. */
export function hasAffirmedPhrase(
  normalizedText: string,
  phrases: readonly string[]
): boolean {
  for (const phrase of phrases) {
    const span = findSpan(normalizedText, phrase);
    if (span && !isSpanNegated(normalizedText, span.start, span.end)) {
      return true;
    }
  }
  return false;
}

/* ------------------------------------------------------------------ */
/* Phrase tables                                                        */
/* ------------------------------------------------------------------ */

type Table<T extends string> = Partial<Record<T, readonly string[]>>;

const ONSET_PHRASES: Table<Onset> = {
  sudden: [
    "sudden",
    "all of a sudden",
    "out of nowhere",
    "overnight",
    "just started",
    "started yesterday",
    "started today",
    "started this morning",
  ],
  gradual: [
    "gradually",
    "over time",
    "getting worse",
    "getting louder",
    "worse over",
    "slowly got",
    "for months",
    "for weeks",
    "past few months",
    "past few weeks",
  ],
};

const FREQUENCY_PHRASES: Table<Frequency> = {
  constant: ["constant", "all the time", "always there", "nonstop", "every time", "every single time"],
  intermittent: [
    "sometimes",
    "comes and goes",
    "intermittent",
    "off and on",
    "on and off",
    "occasionally",
    "once in a while",
    "randomly",
    "not every time",
  ],
  once: ["only happened once", "one time only", "just the one time"],
};

const SPEED_PHRASES: Table<SpeedDependence> = {
  tracks_road_speed: [
    "with road speed",
    "faster i go",
    "faster i drive",
    "gets faster with speed",
    "speeds up with the car",
    "with vehicle speed",
    "tracks speed",
    "rises with speed",
    "faster the car goes",
    "even coasting in neutral",
    "still there in neutral while moving",
  ],
  tracks_engine_rpm: [
    "with rpm",
    "with the rpm",
    "with engine speed",
    "with engine rpm",
    "when i rev",
    "as i rev",
    "revving",
    "with the revs",
    "changes in neutral when",
    "tracks the engine",
    "follows the engine",
  ],
};

const TEMPERATURE_PHRASES: Table<TemperatureDep> = {
  // Order matters: the warm_only list is checked FIRST so "worse after it
  // warms up" can't be swallowed by the cold list's fade phrasing.
  warm_only: [
    "only when warm",
    "only once warm",
    "once warmed up",
    "worse when warm",
    "worse when hot",
    "worse once warm",
    "worse after it warms",
    "louder when warm",
    "louder once warm",
    "louder after it warms",
    "when the engine is hot",
    "after driving a while",
    "after a long drive",
  ],
  cold_only: [
    "only when cold",
    "when it's cold",
    "when cold",
    "cold morning",
    "first thing in the morning",
    "until it warms up",
    "goes away when warm",
    "goes away once warm",
    "gone once warm",
    "fades when warm",
    "fades as it warms",
    "fades after",
    "quieter as the engine warms",
    "quieter as it warms",
    "disappears when warm",
    "quiets down warm",
    "on cold start",
  ],
};

const LOAD_PHRASES: Table<LoadDep> = {
  worse_under_load: [
    "under load",
    "under power",
    "uphill",
    "up hills",
    "up a hill",
    "climbing",
    "towing",
    "hard acceleration",
    "accelerating hard",
    "flooring it",
    "full throttle",
    "worse when accelerating",
    "louder when accelerating",
  ],
  worse_coasting: [
    "when coasting",
    "while coasting",
    "when i let off",
    "letting off the gas",
    "lift off the gas",
    "when decelerating",
    "on deceleration",
    "engine braking",
    "when i lift off",
    "off throttle",
  ],
};

/** Order matters: corner locations must resolve before the coarse sides. */
const LOCATION_PHRASES: [NoiseLocation, readonly string[]][] = [
  ["front_left", ["front left", "left front", "driver side front", "front driver"]],
  ["front_right", ["front right", "right front", "passenger side front", "front passenger"]],
  ["rear_left", ["rear left", "left rear", "back left", "driver side rear"]],
  ["rear_right", ["rear right", "right rear", "back right", "passenger side rear"]],
  ["under_car", ["under the car", "underneath", "under the vehicle", "under the truck", "from below", "under the floor"]],
  ["in_cabin", ["in the cabin", "inside the car", "from the dash", "behind the dash", "through the steering wheel", "through the floor"]],
  ["front", ["from the front", "at the front", "front of the car", "front end", "under the hood", "engine bay"]],
  ["rear", ["from the rear", "from the back", "rear of the car", "back of the car", "in the back", "in the trunk"]],
  ["left", ["driver side", "drivers side", "driver's side", "on the left"]],
  ["right", ["passenger side", "passengers side", "passenger's side", "on the right"]],
];

const RECENT_WORK_PHRASES: Table<RecentWorkArea> = {
  brakes: [
    "new brakes",
    "new pads",
    "new rotors",
    "brakes done",
    "brake job",
    "brakes replaced",
    "replaced the brakes",
    "replaced the pads",
    "just had the brakes",
    "brakes serviced",
  ],
  tires_wheels: [
    "new tires",
    "new tyres",
    "new wheels",
    "tires rotated",
    "tire rotation",
    "tires replaced",
    "just had tires",
    "just had the tires",
    "at the tire shop",
    "tires mounted",
  ],
  suspension: [
    "new struts",
    "new shocks",
    "new suspension",
    "replaced the struts",
    "replaced the shocks",
    "suspension work",
    "lowered the car",
    "new springs",
  ],
  engine: [
    "oil change",
    "just had the oil",
    "new spark plugs",
    "tune up",
    "tune-up",
    "engine work",
    "head gasket done",
  ],
  transmission_drivetrain: [
    "transmission service",
    "transmission fluid change",
    "new clutch",
    "clutch replaced",
    "new axle",
    "axle replaced",
    "differential service",
  ],
  exhaust: ["new exhaust", "new muffler", "muffler replaced", "exhaust work", "new catalytic"],
  battery_electrical: [
    "new battery",
    "replaced the battery",
    "new alternator",
    "alternator replaced",
    "jump started",
    "jump-started",
    "new starter",
  ],
  belts_accessories: [
    "new belt",
    "belt replaced",
    "replaced the belt",
    "new serpentine",
    "new tensioner",
    "water pump replaced",
  ],
};

/** Context phrases used only for NEGATION detection ("not when braking"). */
const CONTEXT_PHRASES: Partial<Record<SoundContext, readonly string[]>> = {
  braking: ["when braking", "while braking", "when i brake", "under braking", "when i press the brake", "press the brakes", "when stopping"],
  acceleration: ["when accelerating", "while accelerating", "when i accelerate", "under acceleration", "when i speed up"],
  idle: ["at idle", "while idling", "when idling", "sitting still", "at a standstill"],
  cold_start: ["on cold start", "when i start", "at startup", "when starting"],
  turning_left: ["turning left", "when i turn left", "left turns", "left-hand turns"],
  turning_right: ["turning right", "when i turn right", "right turns", "right-hand turns"],
  low_speed_turning: ["when turning", "while turning", "in turns", "through turns", "when i turn"],
  over_bumps: ["over bumps", "on bumps", "over potholes", "on rough roads"],
  highway_speed: ["on the highway", "at highway speed", "at speed"],
  reversing: ["when reversing", "in reverse", "backing up"],
};

/**
 * Conditional negation: "does not change when I press the brakes",
 * "nothing happens when turning". The negator sits farther from the context
 * phrase than a plain window allows, so a dedicated pattern bridges the gap.
 */
const CONDITIONAL_NEGATION =
  /\b(?:no|not|never|doesn'?t|does not|don'?t|didn'?t|nothing)\b[a-z' -]{0,32}?\b(when|while|during|under|in|at|on)\b/;

/* ------------------------------------------------------------------ */
/* Extraction                                                           */
/* ------------------------------------------------------------------ */

function pickAffirmed<T extends string>(
  text: string,
  table: Table<T>
): T | null {
  for (const [value, phrases] of Object.entries(table) as [
    T,
    readonly string[],
  ][]) {
    if (hasAffirmedPhrase(text, phrases)) return value;
  }
  return null;
}

function pickLocation(text: string): NoiseLocation {
  for (const [location, phrases] of LOCATION_PHRASES) {
    if (hasAffirmedPhrase(text, phrases)) return location;
  }
  return "unknown";
}

function extractNegatedContexts(text: string): SoundContext[] {
  const negated: SoundContext[] = [];
  for (const context of SOUND_CONTEXTS) {
    const phrases = CONTEXT_PHRASES[context];
    if (!phrases) continue;
    for (const phrase of phrases) {
      const span = findSpan(text, phrase);
      if (!span) continue;
      // Plain window negation ("not when braking") or a conditional-negation
      // clause ending in this phrase ("does not change when I brake").
      const clauseStart = Math.max(0, span.start - 40);
      const clause = text.slice(clauseStart, span.end);
      if (
        isSpanNegated(text, span.start, span.end) ||
        CONDITIONAL_NEGATION.test(clause)
      ) {
        negated.push(context);
        break;
      }
    }
  }
  return negated;
}

function extractNegatedSounds(text: string): SoundType[] {
  const negated: SoundType[] = [];
  for (const match of detectSounds(text)) {
    const span = findSpan(text, match.matchedWord);
    if (span && isSpanNegated(text, span.start, span.end, "before")) {
      negated.push(match.type);
    }
  }
  return negated;
}

/**
 * Extract structured modifiers from a symptom description. Input may be raw
 * or already normalized — it is re-normalized defensively.
 */
export function extractModifiers(text: string): SymptomModifiers {
  const t = normalizeText(text);
  const recentWork: RecentWorkArea[] = [];
  for (const area of RECENT_WORK_AREAS) {
    const phrases = RECENT_WORK_PHRASES[area];
    if (phrases && hasAffirmedPhrase(t, phrases)) recentWork.push(area);
  }

  // Speed: an affirmed pole wins; a solely-negated pole implies independence
  // ("doesn't change when I rev" and nothing else → not RPM-tied).
  let speedDependence: SpeedDependence =
    pickAffirmed(t, SPEED_PHRASES) ?? "unknown";
  if (speedDependence === "unknown") {
    const rpmNegated = (SPEED_PHRASES.tracks_engine_rpm ?? []).some((p) => {
      const span = findSpan(t, p);
      return span !== null && isSpanNegated(t, span.start, span.end);
    });
    if (rpmNegated) speedDependence = "independent";
  }

  return {
    onset: pickAffirmed(t, ONSET_PHRASES) ?? "unknown",
    frequency: pickAffirmed(t, FREQUENCY_PHRASES) ?? "unknown",
    speedDependence,
    temperature: pickAffirmed(t, TEMPERATURE_PHRASES) ?? "unknown",
    load: pickAffirmed(t, LOAD_PHRASES) ?? "unknown",
    location: pickLocation(t),
    recentWork,
    negatedSoundTypes: extractNegatedSounds(t),
    negatedContexts: extractNegatedContexts(t),
  };
}
