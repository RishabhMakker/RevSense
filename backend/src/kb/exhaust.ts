import type { KnownIssue } from "./types";

export const EXHAUST_ISSUES: KnownIssue[] = [
  {
    id: "exhaust-heat-shield",
    title: "Loose exhaust heat shield",
    category: "exhaust",
    description:
      "The thin metal shields around the exhaust rust at their spot welds and buzz or rattle at idle or specific RPMs — a tinny, metallic vibration from under the car that often changes when you rev slightly.",
    sounds: ["rattle", "clunk"],
    strongPhrases: ["under the car", "heat shield", "tinny", "metallic rattle", "buzzing"],
    supportingPhrases: ["idle", "certain rpm", "rev", "exhaust"],
    contexts: { strong: ["idle"], weak: ["acceleration", "cold_start", "low_speed"] },
    signals: { speed: "tracks_engine_rpm", locations: ["under_car"] },
    audioHints: ["rhythmic_ticking", "high_pitched", "irregular_knocking"],
    notFor: ["electric"],
    wear: { ageFrom: 8 },
    baseRate: 0.6,
    severity: "low",
    urgency: "monitor",
    safeToDrive: "yes",
    checksFirst: [
      "With the engine cold and off, reach under (or look under) and gently tap the exhaust shields — a loose one rattles obviously.",
      "Note if the buzz appears only at specific RPMs and vanishes above/below them.",
      "Check for a shield visibly hanging or rotated.",
    ],
    confirmRuleOut: [
      "Tapping the shield and reproducing the rattle is definitive.",
      "If the rattle happens over bumps rather than at certain RPMs, look at sway-bar links instead.",
    ],
    repairDirection:
      "Re-secure with a band clamp or remove/replace the shield — one of the cheapest fixes in this list.",
    repairDifficulty: "diy-easy",
    mechanicSummary:
      "RPM-specific tinny rattle underneath. Please check exhaust heat shields and hangers; clamp or replace as needed.",
  },
  {
    id: "exhaust-manifold-leak",
    title: "Exhaust manifold leak",
    category: "exhaust",
    description:
      "A cracked exhaust manifold or failed gasket ticks or puffs in time with the engine — loudest on a cold start and often quieter once the metal expands with heat. Exhaust smell near the engine bay is a giveaway.",
    sounds: ["tick", "pop", "hiss"],
    strongPhrases: ["exhaust smell", "ticking when cold", "manifold", "louder when cold"],
    supportingPhrases: ["cold start", "fades", "smell", "engine bay"],
    contexts: { strong: ["cold_start"], weak: ["idle", "acceleration"] },
    signals: { speed: "tracks_engine_rpm", temperature: "cold_only", locations: ["front"] },
    audioHints: ["rhythmic_ticking", "sharp_transients"],
    notFor: ["electric"],
    wear: { ageFrom: 10, mileageFrom: 120_000 },
    baseRate: 0.4,
    severity: "moderate",
    urgency: "soon",
    safeToDrive: "caution",
    checksFirst: [
      "Listen on a cold start: a rapid tick that fades as the engine warms is the classic manifold-leak pattern.",
      "Sniff for exhaust odor at the front of the car or through the vents.",
      "Look for black soot streaks around the manifold area (engine cold!).",
    ],
    confirmRuleOut: [
      "Soot trails at the manifold joint confirm a leak.",
      "If the tick doesn't change from cold to warm, valvetrain noise is more likely.",
    ],
    repairDirection:
      "Replace the manifold gasket, broken studs, or the manifold itself. Fumes can reach the cabin, so don't ignore it indefinitely.",
    repairDifficulty: "pro",
    mechanicSummary:
      "Cold-start tick that fades warm, possible exhaust smell. Please check manifold and gasket for leaks/soot, including broken studs.",
  },
  {
    id: "exhaust-hanger-clunk",
    title: "Broken exhaust hanger / loose exhaust",
    category: "exhaust",
    description:
      "When a rubber exhaust hanger tears, the pipe swings and clunks against the underbody — classically a dull knock from underneath on bumps, throttle changes, or when starting the engine.",
    sounds: ["clunk", "knock", "rattle"],
    strongPhrases: ["exhaust bang", "under the car clunk", "exhaust moves", "hanger", "muffler knock"],
    supportingPhrases: ["under the car", "bump", "exhaust", "rear"],
    contexts: { strong: ["over_bumps"], weak: ["acceleration", "cold_start", "reversing"] },
    signals: { locations: ["under_car", "rear"] },
    audioHints: ["sharp_transients", "irregular_knocking"],
    wear: { ageFrom: 8 },
    baseRate: 0.4,
    severity: "low",
    urgency: "soon",
    safeToDrive: "yes",
    checksFirst: [
      "With the engine cold, push the tailpipe sideways — more than an inch of easy swing means a hanger is gone.",
      "Look under the car for a dangling rubber loop or a pipe resting on the body.",
      "Note clunks on throttle blips in Park (the engine rocking moves the exhaust).",
    ],
    confirmRuleOut: [
      "Visible pipe swing or a torn hanger confirms it immediately.",
      "If the exhaust is tight and the clunk persists over bumps, check sway-bar links next.",
    ],
    repairDirection:
      "Replace the rubber hanger(s) — one of the cheapest under-car fixes there is.",
    repairDifficulty: "diy-easy",
    mechanicSummary:
      "Underbody clunk from a swinging exhaust, suspected torn hanger. Please check all exhaust mounts.",
  },
  {
    id: "cat-rattle-internal",
    title: "Catalytic converter / muffler internal rattle",
    category: "exhaust",
    description:
      "A metallic rattle from under the car that sounds like rocks in a can — especially at idle or when tapping the pipe — can be a broken-up catalytic converter substrate or a loose baffle inside the muffler.",
    sounds: ["rattle"],
    strongPhrases: ["rocks in a can", "rattle inside the muffler", "catalytic", "marbles under the car"],
    supportingPhrases: ["under the car", "idle", "rev", "exhaust"],
    contexts: { strong: ["idle"], weak: ["acceleration", "over_bumps"] },
    signals: { speed: "tracks_engine_rpm", locations: ["under_car"] },
    audioHints: ["irregular_knocking", "rhythmic_ticking"],
    notFor: ["electric"],
    wear: { mileageFrom: 120_000, ageFrom: 10 },
    baseRate: 0.25,
    severity: "moderate",
    urgency: "prompt",
    safeToDrive: "caution",
    checksFirst: [
      "With the engine cold and off, tap the converter and muffler with a rubber mallet or fist — internal debris rattles distinctly.",
      "Watch for reduced power or a sulfur smell, which accompany a failing converter.",
      "Check for a check-engine light with catalyst-efficiency codes.",
    ],
    confirmRuleOut: [
      "A tap-test rattle from inside the converter/muffler shell is definitive.",
      "A tinny rattle from the outside sheet metal is the heat-shield pattern instead — much cheaper.",
    ],
    repairDirection:
      "A broken substrate can clog the exhaust and choke the engine — replace the converter/muffler before it restricts flow.",
    repairDifficulty: "pro",
    mechanicSummary:
      "Internal exhaust rattle on tap test, suspected cat substrate or muffler baffle. Please verify and check for restriction.",
  },
  {
    id: "exhaust-cooling-tick",
    title: "Exhaust cooling tick after shutoff (normal)",
    category: "exhaust",
    description:
      "The irregular tick-tick-tick from under the car for a few minutes after you park is hot exhaust metal contracting as it cools. Completely normal on every combustion car.",
    sounds: ["tick", "click"],
    strongPhrases: ["after i park", "after shutting off", "after i turn it off", "while cooling", "under the car after"],
    supportingPhrases: ["ticking", "stops after", "few minutes", "parked"],
    contexts: { strong: ["idle"], weak: [] },
    signals: { locations: ["under_car"] },
    audioHints: ["irregular_knocking"],
    notFor: ["electric"],
    baseRate: 0.4,
    severity: "low",
    urgency: "monitor",
    safeToDrive: "yes",
    checksFirst: [
      "Confirm the timing: it starts after shutoff, is irregular, and fades within minutes as the metal cools.",
      "Confirm there's no ticking while actually driving.",
    ],
    confirmRuleOut: [
      "Post-shutoff irregular ticking that fades is thermal contraction — normal.",
      "Rhythmic ticking while the engine RUNS is a different pattern — check the valvetrain/manifold entries.",
    ],
    repairDirection:
      "None — physics, not a fault.",
    repairDifficulty: "diy-easy",
    mechanicSummary:
      "Post-shutoff cooling tick from the exhaust, normal thermal contraction; no fault indicated.",
  },
];
