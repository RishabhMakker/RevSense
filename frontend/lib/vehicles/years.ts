/**
 * Curated production-year ranges per make → model. This bundle is the instant,
 * offline-first source for the Year picker once a make + model are chosen, so
 * the field offers only plausible years (newest first) instead of a bare 1960+
 * spinner. It mirrors `models.ts`: a curated head start, never a hard whitelist.
 *
 * Why curated (not NHTSA at request time): NHTSA vPIC has no "years for a
 * make+model" endpoint — you'd have to enumerate GetModelsForMakeYear across
 * every year (slow, and the API intermittently times out), and vPIC only holds
 * model years >= 1995, so it cannot validate the classic range the schema
 * allows (1960+). A small curated table is faster and more correct, and the
 * open-range fallback below keeps the long tail unblocked.
 *
 * Ranges are U.S.-market model years. `end: null` means "still in production"
 * and resolves to currentYear + 1 (dealers list next-year models, and the zod
 * schema allows currentYear + 1). For nameplates with production gaps or revivals
 * (e.g. Bronco, Supra, Land Cruiser) the span is intentionally PERMISSIVE — it
 * covers the whole history rather than risk excluding a legitimate year. These
 * are flagged inline so the owner can tighten them if desired.
 */

/** Schema floor — selectable years never go below this (see backend vehicleSchema). */
export const MIN_YEAR = 1960;

/** `null` end = currently in production (resolves to currentYear + 1). */
export interface YearRange {
  start: number;
  end: number | null;
}

/** The newest selectable year: currentYear + 1, matching the zod schema's max. */
export function maxSelectableYear(): number {
  return new Date().getFullYear() + 1;
}

export const YEAR_RANGES_BY_MAKE: Record<string, Record<string, YearRange>> = {
  Acura: {
    ILX: { start: 2013, end: 2022 },
    TLX: { start: 2015, end: null },
    RLX: { start: 2014, end: 2020 },
    Integra: { start: 1986, end: null }, // gap 2002–2022 (revived) — permissive
    MDX: { start: 2001, end: null },
    RDX: { start: 2007, end: null },
    NSX: { start: 1991, end: 2022 }, // gap 2006–2016 (revived) — permissive
  },
  Audi: {
    A3: { start: 2006, end: null }, // U.S. from 2006
    A4: { start: 1996, end: null },
    A5: { start: 2008, end: null },
    A6: { start: 1995, end: null },
    A7: { start: 2012, end: null },
    A8: { start: 1997, end: null },
    Q3: { start: 2015, end: null },
    Q5: { start: 2009, end: null },
    Q7: { start: 2007, end: null },
    Q8: { start: 2019, end: null },
    "e-tron": { start: 2019, end: null },
    TT: { start: 2000, end: 2023 },
  },
  BMW: {
    "2 Series": { start: 2014, end: null },
    "3 Series": { start: 1977, end: null },
    "4 Series": { start: 2014, end: null },
    "5 Series": { start: 1975, end: null },
    "7 Series": { start: 1978, end: null },
    X1: { start: 2013, end: null },
    X3: { start: 2004, end: null },
    X5: { start: 2000, end: null },
    X7: { start: 2019, end: null },
    M3: { start: 1988, end: null },
    M5: { start: 1991, end: null },
    i4: { start: 2022, end: null },
  },
  Chevrolet: {
    Spark: { start: 2013, end: 2022 },
    Malibu: { start: 1964, end: 2025 }, // gap 1984–1996; ended after 2025 — permissive
    Impala: { start: 1960, end: 2020 }, // multiple gaps — permissive
    Cruze: { start: 2011, end: 2019 },
    Camaro: { start: 1967, end: 2024 }, // gap 2003–2009 — permissive
    Corvette: { start: 1960, end: null }, // since 1953; clamped to schema floor
    Trax: { start: 2015, end: null },
    Trailblazer: { start: 2002, end: null }, // gap 2010–2020 (revived) — permissive
    Equinox: { start: 2005, end: null },
    Blazer: { start: 1969, end: null }, // gap 2006–2018 (revived) — permissive
    Traverse: { start: 2009, end: null },
    Tahoe: { start: 1995, end: null },
    Suburban: { start: 1960, end: null }, // since 1935; clamped to schema floor
    Colorado: { start: 2004, end: null }, // gap 2013–2014 — permissive
    "Silverado 1500": { start: 1999, end: null },
    "Bolt EV": { start: 2017, end: 2023 }, // return announced — owner may extend
  },
  Dodge: {
    Charger: { start: 1966, end: null }, // multiple gaps — permissive
    Challenger: { start: 1970, end: 2023 }, // multiple gaps — permissive
    Durango: { start: 1998, end: null },
    Journey: { start: 2009, end: 2020 },
    "Grand Caravan": { start: 1987, end: 2020 },
    Dart: { start: 1960, end: 2016 }, // gap 1977–2012 — permissive
  },
  Ford: {
    Fiesta: { start: 1978, end: 2019 }, // gap 1981–2010 — permissive
    Focus: { start: 2000, end: 2018 },
    Fusion: { start: 2006, end: 2020 },
    Mustang: { start: 1965, end: null },
    EcoSport: { start: 2018, end: 2022 },
    Escape: { start: 2001, end: null },
    Edge: { start: 2007, end: 2024 },
    Explorer: { start: 1991, end: null },
    Expedition: { start: 1997, end: null },
    Bronco: { start: 1966, end: null }, // gap 1997–2020 (revived) — permissive
    "Bronco Sport": { start: 2021, end: null },
    Maverick: { start: 1970, end: null }, // gap 1978–2021 (name reused) — permissive
    Ranger: { start: 1983, end: null }, // gap 2012–2018 — permissive
    "F-150": { start: 1975, end: null },
    "F-250 Super Duty": { start: 1999, end: null },
  },
  GMC: {
    Terrain: { start: 2010, end: null },
    Acadia: { start: 2007, end: null },
    Yukon: { start: 1992, end: null },
    "Yukon XL": { start: 2000, end: null },
    Canyon: { start: 2004, end: null }, // gap 2013–2014 — permissive
    "Sierra 1500": { start: 1999, end: null },
    Savana: { start: 1996, end: null },
  },
  Honda: {
    Civic: { start: 1973, end: null },
    Accord: { start: 1976, end: null },
    Insight: { start: 2000, end: 2022 }, // gaps 2007–2009, 2015–2018 — permissive
    Fit: { start: 2007, end: 2020 },
    "HR-V": { start: 2016, end: null },
    "CR-V": { start: 1997, end: null },
    Passport: { start: 1994, end: null }, // gap 2003–2018 (revived) — permissive
    Pilot: { start: 2003, end: null },
    Odyssey: { start: 1995, end: null },
    Ridgeline: { start: 2006, end: null }, // gap 2015–2016 — permissive
  },
  Hyundai: {
    Accent: { start: 1995, end: 2022 }, // U.S. discontinued after 2022
    Elantra: { start: 1992, end: null },
    Sonata: { start: 1989, end: null },
    Veloster: { start: 2012, end: 2022 },
    Venue: { start: 2020, end: null },
    Kona: { start: 2018, end: null },
    Tucson: { start: 2005, end: null },
    "Santa Fe": { start: 2001, end: null },
    Palisade: { start: 2020, end: null },
    "Ioniq 5": { start: 2022, end: null },
  },
  Jeep: {
    Renegade: { start: 2015, end: null },
    Compass: { start: 2007, end: null },
    Cherokee: { start: 1974, end: 2023 }, // gap 2002–2013 — permissive
    "Grand Cherokee": { start: 1993, end: null },
    Wrangler: { start: 1987, end: null },
    Gladiator: { start: 1962, end: null }, // gap 1989–2019 (name reused) — permissive
    Wagoneer: { start: 1963, end: null }, // gap 1992–2021 (revived) — permissive
  },
  Kia: {
    Rio: { start: 2001, end: 2023 },
    Forte: { start: 2010, end: null },
    K5: { start: 2021, end: null },
    Optima: { start: 2001, end: 2020 },
    Stinger: { start: 2018, end: 2023 },
    Soul: { start: 2010, end: null },
    Seltos: { start: 2020, end: null },
    Sportage: { start: 1995, end: null }, // gap 2003–2004 — permissive
    Sorento: { start: 2003, end: null },
    Telluride: { start: 2020, end: null },
    Carnival: { start: 2022, end: null },
    Niro: { start: 2017, end: null },
    EV6: { start: 2022, end: null },
  },
  Lexus: {
    IS: { start: 2001, end: null },
    ES: { start: 1990, end: null },
    GS: { start: 1993, end: 2020 },
    LS: { start: 1990, end: null },
    UX: { start: 2019, end: null },
    NX: { start: 2015, end: null },
    RX: { start: 1999, end: null },
    GX: { start: 2003, end: null },
    LX: { start: 1996, end: null },
    RC: { start: 2015, end: null },
    LC: { start: 2018, end: null },
  },
  Mazda: {
    Mazda3: { start: 2004, end: null },
    Mazda6: { start: 2003, end: 2021 },
    "MX-5 Miata": { start: 1990, end: null },
    "CX-3": { start: 2016, end: 2021 },
    "CX-30": { start: 2020, end: null },
    "CX-5": { start: 2013, end: null },
    "CX-50": { start: 2023, end: null },
    "CX-9": { start: 2007, end: 2023 },
  },
  "Mercedes-Benz": {
    "A-Class": { start: 2019, end: 2022 }, // U.S. sedan discontinued after 2022
    "C-Class": { start: 1994, end: null },
    "E-Class": { start: 1986, end: null }, // "E" badge from 1994; 300E lineage earlier
    "S-Class": { start: 1972, end: null },
    CLA: { start: 2014, end: null },
    GLA: { start: 2015, end: null },
    GLB: { start: 2020, end: null },
    GLC: { start: 2016, end: null },
    GLE: { start: 2016, end: null }, // "GLE" badge from 2016; ML lineage earlier
    GLS: { start: 2017, end: null }, // "GLS" badge from 2017; GL lineage earlier
    "G-Class": { start: 2002, end: null }, // official U.S. from 2002
  },
  Nissan: {
    Versa: { start: 2007, end: null },
    Sentra: { start: 1982, end: null },
    Altima: { start: 1993, end: null },
    Maxima: { start: 1981, end: 2023 },
    Z: { start: 1970, end: null }, // Z lineage (240Z…370Z…Z) — permissive
    Leaf: { start: 2011, end: null },
    Kicks: { start: 2018, end: null },
    Rogue: { start: 2008, end: null },
    Murano: { start: 2003, end: null },
    Pathfinder: { start: 1986, end: null },
    Armada: { start: 2004, end: null },
    Frontier: { start: 1998, end: null },
    Titan: { start: 2004, end: 2024 },
  },
  Ram: {
    "1500": { start: 1994, end: null },
    "2500": { start: 1994, end: null },
    "3500": { start: 1994, end: null },
    ProMaster: { start: 2014, end: null },
    "ProMaster City": { start: 2015, end: 2022 },
  },
  Subaru: {
    Impreza: { start: 1993, end: null },
    Legacy: { start: 1990, end: null },
    WRX: { start: 2002, end: null },
    BRZ: { start: 2013, end: null },
    Crosstrek: { start: 2013, end: null },
    Forester: { start: 1998, end: null },
    Outback: { start: 1995, end: null },
    Ascent: { start: 2019, end: null },
  },
  Tesla: {
    "Model 3": { start: 2017, end: null },
    "Model Y": { start: 2020, end: null },
    "Model S": { start: 2012, end: null },
    "Model X": { start: 2015, end: null },
    Cybertruck: { start: 2024, end: null },
  },
  Toyota: {
    Corolla: { start: 1968, end: null },
    Camry: { start: 1983, end: null },
    Avalon: { start: 1995, end: 2022 },
    Prius: { start: 2000, end: null },
    Yaris: { start: 2007, end: 2020 },
    GR86: { start: 2022, end: null },
    Supra: { start: 1979, end: null }, // gap 2003–2019 (revived) — permissive
    "C-HR": { start: 2018, end: 2022 },
    "Corolla Cross": { start: 2022, end: null },
    RAV4: { start: 1996, end: null },
    Venza: { start: 2009, end: null }, // gap 2016–2020 (revived) — permissive
    Highlander: { start: 2001, end: null },
    "4Runner": { start: 1984, end: null },
    Sequoia: { start: 2001, end: null },
    Tacoma: { start: 1995, end: null },
    Tundra: { start: 2000, end: null },
    Sienna: { start: 1998, end: null },
    "Land Cruiser": { start: 1960, end: null }, // gap 2022–2023 (revived) — permissive
  },
  Volkswagen: {
    Jetta: { start: 1980, end: null },
    Passat: { start: 1990, end: 2022 }, // U.S. sedan discontinued after 2022
    Golf: { start: 1985, end: 2021 }, // base hatch (Rabbit earlier); GTI continues
    GTI: { start: 1983, end: null },
    Arteon: { start: 2019, end: 2023 },
    Taos: { start: 2022, end: null },
    Tiguan: { start: 2009, end: null },
    Atlas: { start: 2018, end: null },
    "ID.4": { start: 2021, end: null },
    Beetle: { start: 1960, end: 2019 }, // gap 1980–1997 (New Beetle) — permissive
  },
};

/** make(lower) → model(lower) → range, for case/space-insensitive lookup. */
const YEAR_LOOKUP = new Map<string, Map<string, YearRange>>(
  Object.entries(YEAR_RANGES_BY_MAKE).map(([make, models]) => [
    make.toLowerCase(),
    new Map(
      Object.entries(models).map(([model, range]) => [model.toLowerCase(), range])
    ),
  ])
);

/**
 * Resolved, schema-clamped year range for a curated make+model, or `null` when
 * the pairing isn't in the bundle (long tail / free text). A `null` here is the
 * signal to fall back to the permissive open range and to never auto-clear a
 * user's year.
 */
export function getStaticYearRange(
  make: string,
  model: string
): { start: number; end: number } | null {
  const range = YEAR_LOOKUP.get(make.trim().toLowerCase())?.get(
    model.trim().toLowerCase()
  );
  if (!range) return null;
  const max = maxSelectableYear();
  const start = Math.max(range.start, MIN_YEAR);
  const end = Math.min(range.end ?? max, max);
  // Defensive: a malformed entry degrades to the open range rather than empty.
  if (start > end) return { start: MIN_YEAR, end: max };
  return { start, end };
}

/** Descending (newest-first) integer years for an inclusive [start, end] range. */
export function yearsFromRange(start: number, end: number): number[] {
  const years: number[] = [];
  for (let y = end; y >= start; y--) years.push(y);
  return years;
}

/** The full permissive range, newest-first — the long-tail / unknown fallback. */
export function getOpenYears(): number[] {
  return yearsFromRange(MIN_YEAR, maxSelectableYear());
}

/**
 * Selectable years for the picker: the curated range when known (instant,
 * accurate), else the open permissive range. Always non-empty, always
 * newest-first — the field never blocks a legitimate entry.
 */
export function getStaticYears(make: string, model: string): number[] {
  const range = getStaticYearRange(make, model);
  return range ? yearsFromRange(range.start, range.end) : getOpenYears();
}
