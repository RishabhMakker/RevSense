/**
 * Curated popular models per make. This bundle is the instant, offline-first
 * source for the Model combobox; the /api/models route enriches the long tail
 * from NHTSA when needed. Free-typed models are always allowed, so this only
 * needs to cover the common cases — it is a head start, not a whitelist.
 */
export const MODELS_BY_MAKE: Record<string, string[]> = {
  Acura: ["ILX", "TLX", "RLX", "Integra", "MDX", "RDX", "NSX"],
  Audi: ["A3", "A4", "A5", "A6", "A7", "A8", "Q3", "Q5", "Q7", "Q8", "e-tron", "TT"],
  BMW: [
    "2 Series", "3 Series", "4 Series", "5 Series", "7 Series",
    "X1", "X3", "X5", "X7", "M3", "M5", "i4",
  ],
  Chevrolet: [
    "Spark", "Malibu", "Impala", "Cruze", "Camaro", "Corvette",
    "Trax", "Trailblazer", "Equinox", "Blazer", "Traverse",
    "Tahoe", "Suburban", "Colorado", "Silverado 1500", "Bolt EV",
  ],
  Dodge: ["Charger", "Challenger", "Durango", "Journey", "Grand Caravan", "Dart"],
  Ford: [
    "Fiesta", "Focus", "Fusion", "Mustang", "EcoSport", "Escape",
    "Edge", "Explorer", "Expedition", "Bronco", "Bronco Sport",
    "Maverick", "Ranger", "F-150", "F-250 Super Duty",
  ],
  GMC: ["Terrain", "Acadia", "Yukon", "Yukon XL", "Canyon", "Sierra 1500", "Savana"],
  Honda: [
    "Civic", "Accord", "Insight", "Fit", "HR-V", "CR-V",
    "Passport", "Pilot", "Odyssey", "Ridgeline",
  ],
  Hyundai: [
    "Accent", "Elantra", "Sonata", "Veloster", "Venue", "Kona",
    "Tucson", "Santa Fe", "Palisade", "Ioniq 5",
  ],
  Jeep: [
    "Renegade", "Compass", "Cherokee", "Grand Cherokee",
    "Wrangler", "Gladiator", "Wagoneer",
  ],
  Kia: [
    "Rio", "Forte", "K5", "Optima", "Stinger", "Soul", "Seltos",
    "Sportage", "Sorento", "Telluride", "Carnival", "Niro", "EV6",
  ],
  Lexus: ["IS", "ES", "GS", "LS", "UX", "NX", "RX", "GX", "LX", "RC", "LC"],
  Mazda: ["Mazda3", "Mazda6", "MX-5 Miata", "CX-3", "CX-30", "CX-5", "CX-50", "CX-9"],
  "Mercedes-Benz": [
    "A-Class", "C-Class", "E-Class", "S-Class", "CLA",
    "GLA", "GLB", "GLC", "GLE", "GLS", "G-Class",
  ],
  Nissan: [
    "Versa", "Sentra", "Altima", "Maxima", "Z", "Leaf", "Kicks",
    "Rogue", "Murano", "Pathfinder", "Armada", "Frontier", "Titan",
  ],
  Ram: ["1500", "2500", "3500", "ProMaster", "ProMaster City"],
  Subaru: ["Impreza", "Legacy", "WRX", "BRZ", "Crosstrek", "Forester", "Outback", "Ascent"],
  Tesla: ["Model 3", "Model Y", "Model S", "Model X", "Cybertruck"],
  Toyota: [
    "Corolla", "Camry", "Avalon", "Prius", "Yaris", "GR86", "Supra",
    "C-HR", "Corolla Cross", "RAV4", "Venza", "Highlander", "4Runner",
    "Sequoia", "Tacoma", "Tundra", "Sienna", "Land Cruiser",
  ],
  Volkswagen: [
    "Jetta", "Passat", "Golf", "GTI", "Arteon",
    "Taos", "Tiguan", "Atlas", "ID.4", "Beetle",
  ],
};

const MODELS_LOOKUP = new Map<string, string[]>(
  Object.entries(MODELS_BY_MAKE).map(([make, models]) => [
    make.toLowerCase(),
    models,
  ])
);

/** Popular models for a make (case/space-insensitive); [] if the make is unknown. */
export function getStaticModels(make: string): string[] {
  return MODELS_LOOKUP.get(make.trim().toLowerCase()) ?? [];
}
