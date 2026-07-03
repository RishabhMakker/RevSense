import { ISSUE_CATEGORIES, type IssueCategory } from "@revsense/backend";

/**
 * NHTSA component string → RevSense issue category.
 *
 * NHTSA components are uppercase, comma/colon-delimited paths such as
 * `"POWER TRAIN:AUTOMATIC TRANSMISSION"` or `"SERVICE BRAKES, HYDRAULIC"`. We
 * match on the first segment, case-insensitive and substring-based. Rules are
 * ordered — the first hit wins — so `ENGINE COOLING` is resolved before the
 * generic `ENGINE` rule.
 *
 * Rules are validated against the engine's exported `ISSUE_CATEGORIES`, so a rule
 * for a category the engine doesn't have yet (e.g. `hvac`, `fuel_air`) is simply
 * skipped until that category ships — no code change needed here.
 */
const COMPONENT_RULES: { readonly contains: string; readonly category: string }[] =
  [
    { contains: "POWER TRAIN", category: "drivetrain" },
    { contains: "DRIVELINE", category: "drivetrain" },
    { contains: "SERVICE BRAKES", category: "brakes" },
    { contains: "PARKING BRAKE", category: "brakes" },
    { contains: "SUSPENSION", category: "suspension" },
    { contains: "STEERING", category: "steering" },
    // Cooling must precede the generic ENGINE rule.
    { contains: "ENGINE COOLING", category: "cooling" },
    { contains: "ENGINE", category: "engine" },
    { contains: "ELECTRICAL SYSTEM", category: "electrical" },
    { contains: "ELECTRONIC STABILITY", category: "electrical" },
    { contains: "TIRES", category: "wheels_tires" },
    { contains: "WHEELS", category: "wheels_tires" },
    { contains: "EXHAUST", category: "exhaust" },
    // Forward-looking: only emitted once the engine adds these categories.
    { contains: "AIR CONDITIONER", category: "hvac" },
    { contains: "FUEL SYSTEM", category: "fuel_air" },
  ];

const VALID_CATEGORIES = new Set<string>(ISSUE_CATEGORIES);

/** First segment of a NHTSA component path (before any `:` or `,`), uppercased. */
function firstSegment(component: string): string {
  return (component.toUpperCase().split(/[:,]/)[0] ?? "").trim();
}

/** Map one NHTSA component string to a category, or null when nothing applies. */
export function mapComponentToCategory(
  component: string
): IssueCategory | null {
  const segment = firstSegment(component);
  if (!segment) return null;
  for (const rule of COMPONENT_RULES) {
    if (segment.includes(rule.contains) && VALID_CATEGORIES.has(rule.category)) {
      return rule.category as IssueCategory;
    }
  }
  return null;
}

/**
 * Relative complaint density per category, normalized to the busiest category
 * (values 0..1), dropping anything below 0.1 as noise.
 */
export function buildCategoryWeights(
  components: string[]
): Partial<Record<IssueCategory, number>> {
  const counts = new Map<IssueCategory, number>();
  for (const component of components) {
    const category = mapComponentToCategory(component);
    if (category) counts.set(category, (counts.get(category) ?? 0) + 1);
  }
  const max = Math.max(0, ...counts.values());
  if (max === 0) return {};

  const weights: Partial<Record<IssueCategory, number>> = {};
  for (const [category, count] of counts) {
    const weight = count / max;
    if (weight >= 0.1) weights[category] = Math.round(weight * 100) / 100;
  }
  return weights;
}

/** Unique categories represented across a set of recall components. */
export function mapRecallCategories(components: string[]): IssueCategory[] {
  const categories = new Set<IssueCategory>();
  for (const component of components) {
    const category = mapComponentToCategory(component);
    if (category) categories.add(category);
  }
  return [...categories];
}
