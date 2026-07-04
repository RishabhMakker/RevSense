import type {
  AudioHint,
  EngineType,
  IssueCategory,
  RepairDifficulty,
  SafeToDrive,
  Severity,
  SoundContext,
  Urgency,
} from "./schemas";
import type { SoundType } from "./lexicon";
import type { NoiseLocation } from "./modifiers";

/**
 * Physical behavior of an issue, matched against the structured symptom
 * modifiers extracted from the description (deterministically, optionally
 * AI-enriched). Only set a field when the physics is clear-cut — a wheel
 * bearing tracks road speed; a lifter tick tracks the engine and fades warm.
 */
export interface IssueSignals {
  speed?: "tracks_road_speed" | "tracks_engine_rpm" | "either";
  temperature?: "cold_only" | "warm_only";
  load?: "worse_under_load" | "worse_coasting";
  onset?: "sudden" | "gradual";
  /** Where the noise plausibly lives (coarse; corners imply their sides). */
  locations?: NoiseLocation[];
}

export interface KnownIssue {
  id: string;
  title: string;
  category: IssueCategory;
  description: string;
  /** Canonical sound types this issue typically produces. */
  sounds: SoundType[];
  /** High-weight phrase stems (word-boundary prefix matched). */
  strongPhrases: string[];
  /** Lower-weight phrase stems. */
  supportingPhrases: string[];
  /** Phrase stems that make this cause less likely. */
  negativePhrases?: string[];
  contexts: {
    strong: SoundContext[];
    weak: SoundContext[];
    /** Contexts this issue essentially can't produce (e.g. a brake-pad
     *  squeal while parked at idle) — scored as counter-evidence. */
    exclude?: SoundContext[];
  };
  /** Structured behavior matched against extracted symptom modifiers. */
  signals?: IssueSignals;
  audioHints: AudioHint[];
  /** Wear-item boosts when the vehicle is old / high-mileage. */
  wear?: { mileageFrom?: number; ageFrom?: number };
  /** Engine types for which this issue is impossible (e.g. belt squeal on an EV). */
  notFor?: EngineType[];
  /** Engine types for which this issue is much less diagnostic (score halved). */
  dampFor?: EngineType[];
  /** Prior commonness, 0–1. Brake pads are common; rod knock is not. */
  baseRate: number;
  severity: Severity;
  urgency: Urgency;
  safeToDrive: SafeToDrive;
  checksFirst: string[];
  confirmRuleOut: string[];
  repairDirection: string;
  repairDifficulty: RepairDifficulty;
  mechanicSummary: string;
}

export const KNOWLEDGE_BASE: KnownIssue[] = [
  /* ----------------------------- Drivetrain ----------------------------- */
  {
    id: "cv-axle-wear",
    title: "Worn CV joint / axle",
    category: "drivetrain",
    description:
      "The constant-velocity joints at the ends of the drive axles wear out, especially once their rubber boots crack and the grease escapes. The classic symptom is a rhythmic clicking or popping while turning under power at low speed.",
    sounds: ["click", "pop", "clunk"],
    strongPhrases: ["turn", "steering", "full lock", "tight turn", "parking lot"],
    supportingPhrases: ["accelerat", "low speed", "wheel", "front"],
    // CV joints only click while the wheels are rolling — stationary wording
    // points at the steering column/rack instead.
    negativePhrases: [
      "while stationary",
      "at a standstill",
      "standstill",
      "while parked",
      "not moving",
      "at a stop",
      "car is stopped",
      "engine off",
    ],
    contexts: {
      strong: ["low_speed_turning", "turning_left", "turning_right"],
      weak: ["acceleration", "low_speed", "reversing"],
      exclude: ["idle"],
    },
    signals: { speed: "tracks_road_speed", locations: ["front"] },
    audioHints: ["rhythmic_ticking", "sharp_transients"],
    wear: { mileageFrom: 80_000, ageFrom: 8 },
    baseRate: 0.7,
    severity: "moderate",
    urgency: "prompt",
    safeToDrive: "caution",
    checksFirst: [
      "Look behind each front wheel for a torn rubber CV boot or grease slung onto the wheel and suspension.",
      "Note whether the clicking happens mainly when turning one direction — that usually points to the opposite-side axle.",
      "Check if the click speed rises and falls with road speed rather than engine RPM.",
    ],
    confirmRuleOut: [
      "Clicking that only happens while turning AND moving strongly suggests a CV joint; clicking while stationary rules it out.",
      "A torn boot with grease spray practically confirms it.",
      "If the noise persists when coasting straight, suspect a wheel bearing instead.",
    ],
    repairDirection:
      "Replace the affected axle shaft (common, moderately priced) or re-boot the joint if caught early.",
    repairDifficulty: "pro",
    mechanicSummary:
      "Rhythmic clicking on low-speed turns under power. Please inspect outer CV joints and boots on both front axles.",
  },
  {
    id: "engine-or-trans-mount",
    title: "Worn engine or transmission mount",
    category: "drivetrain",
    description:
      "The rubber mounts that hold the engine and transmission absorb torque. When they collapse or tear, you feel a clunk or thud when shifting between drive and reverse, or under hard acceleration.",
    sounds: ["clunk", "vibration"],
    strongPhrases: ["shift", "gear", "drive to reverse", "put it in gear", "engine moves", "lurch"],
    supportingPhrases: ["accelerat", "vibrat", "idle", "thunk"],
    negativePhrases: ["only over bumps"],
    contexts: {
      strong: ["acceleration", "reversing"],
      weak: ["idle", "cold_start"],
    },
    signals: { load: "worse_under_load" },
    audioHints: ["sharp_transients", "low_rumble"],
    wear: { mileageFrom: 90_000, ageFrom: 9 },
    baseRate: 0.5,
    severity: "moderate",
    urgency: "soon",
    safeToDrive: "yes",
    checksFirst: [
      "With the hood open and brakes held, have a helper shift between drive and reverse — watch for the engine rocking more than an inch.",
      "Look for cracked or separated rubber on the visible mounts.",
      "Notice if cabin vibration at idle has increased lately.",
    ],
    confirmRuleOut: [
      "Visible engine rock during a power-brake shift test is a strong confirmation.",
      "If the clunk only happens over bumps, suspect suspension parts instead.",
    ],
    repairDirection:
      "Replace the failed mount(s). Straightforward on most cars, though access varies.",
    repairDifficulty: "pro",
    mechanicSummary:
      "Clunk on drive/reverse engagement and torque load. Please check engine and transmission mounts for collapse or tearing.",
  },
  {
    id: "driveline-u-joint",
    title: "Worn U-joint / driveshaft joint",
    category: "drivetrain",
    description:
      "On rear- and four-wheel-drive vehicles, universal joints in the driveshaft wear and develop play. Typical signs are a single clunk when shifting into gear and a vibration that grows with speed.",
    sounds: ["clunk", "vibration", "click"],
    strongPhrases: ["driveshaft", "into gear", "drivetrain", "under the car", "rear"],
    supportingPhrases: ["reversing", "shift", "vibrat", "speed"],
    // FWD cars have no conventional driveshaft.
    negativePhrases: ["front wheel drive", "fwd"],
    contexts: {
      strong: ["reversing", "acceleration"],
      weak: ["highway_speed"],
    },
    signals: { speed: "tracks_road_speed", locations: ["under_car", "rear"] },
    audioHints: ["sharp_transients", "low_rumble"],
    wear: { mileageFrom: 100_000, ageFrom: 10 },
    baseRate: 0.3,
    severity: "high",
    urgency: "prompt",
    safeToDrive: "caution",
    checksFirst: [
      "Listen for a single metallic clunk from beneath the car when shifting from park into drive or reverse.",
      "Note any vibration that increases with road speed regardless of gear.",
      "If safe, check the driveshaft for visible rust dust around the joints — a classic failure sign.",
    ],
    confirmRuleOut: [
      "Play felt when rotating the driveshaft by hand (vehicle safely supported) confirms it.",
      "Front-wheel-drive cars don't have a conventional driveshaft — suspect CV axles or mounts instead.",
    ],
    repairDirection:
      "Replace the worn U-joint or the driveshaft section. A failed U-joint can drop the driveshaft, so don't defer it.",
    repairDifficulty: "pro",
    mechanicSummary:
      "Clunk on gear engagement with speed-dependent vibration. Please inspect driveshaft U-joints for play and rust dust.",
  },
  {
    id: "transmission-whine",
    title: "Transmission whine / low fluid",
    category: "drivetrain",
    description:
      "A whine that changes with road speed while in gear — and disappears in neutral — can come from the transmission, often from low or degraded fluid, a failing pump, or worn bearings.",
    sounds: ["whine", "hum"],
    // Automatic transmission fluid is red — a red puddle points here.
    strongPhrases: ["transmission", "in gear", "neutral", "fluid", "shifting", "red fluid"],
    supportingPhrases: ["speed", "accelerat", "slip"],
    // A trans whine changes with the pump — a noise that ignores revving or
    // persists unchanged in neutral is coming from somewhere else.
    negativePhrases: [
      "doesn't change when i rev",
      "does not change when i rev",
      "still there in neutral",
      "same in neutral",
      "even in neutral",
    ],
    contexts: {
      strong: ["acceleration", "highway_speed"],
      weak: ["low_speed", "reversing"],
    },
    signals: { speed: "tracks_road_speed" },
    audioHints: ["tonal_whine"],
    wear: { mileageFrom: 120_000 },
    baseRate: 0.3,
    severity: "high",
    urgency: "prompt",
    safeToDrive: "caution",
    checksFirst: [
      "Check the transmission fluid level and color if the car has a dipstick — dark or burnt-smelling fluid is a warning sign.",
      "Note whether the whine changes between gears or disappears in neutral.",
      "Watch for slipping, delayed engagement, or harsh shifts.",
    ],
    confirmRuleOut: [
      "A whine that varies with engine RPM in neutral points at the engine accessories instead.",
      "Pitch tied to road speed in gear, plus any shifting symptoms, strengthens the transmission case.",
    ],
    repairDirection:
      "Start with a fluid level/condition check and service; internal pump or bearing wear needs a transmission specialist.",
    repairDifficulty: "pro-major",
    mechanicSummary:
      "Speed-dependent whine in gear, absent in neutral. Please check transmission fluid level/condition and road-test for pump or bearing noise.",
  },

  /* ------------------------------- Brakes ------------------------------- */
  {
    id: "brake-pads-worn",
    title: "Worn brake pads (wear indicator squeal)",
    category: "brakes",
    description:
      "Most brake pads include a small steel tab that intentionally squeals against the rotor when the friction material is nearly used up. A high-pitched squeal when braking — sometimes fading when you press harder — usually means the pads are due.",
    sounds: ["squeal", "chirp"],
    strongPhrases: ["brake", "braking", "stop", "pedal"],
    supportingPhrases: ["high pitch", "front", "rear", "slow"],
    negativePhrases: [
      "not when braking",
      "not while braking",
      "not the brakes",
      "not think it is the brakes",
      "not think it's the brakes",
      "brakes are fine",
      "brakes feel fine",
      "brakes seem fine",
    ],
    contexts: { strong: ["braking"], weak: ["low_speed"], exclude: ["idle"] },
    audioHints: ["high_pitched", "tonal_whine"],
    wear: { mileageFrom: 30_000 },
    baseRate: 0.9,
    severity: "moderate",
    urgency: "prompt",
    safeToDrive: "caution",
    checksFirst: [
      "Look through the wheel spokes at the brake pad — less than ~3 mm of friction material means replacement time.",
      "Note whether the squeal appears when braking and changes with pedal pressure.",
      "Check whether it squeals lightly even when not braking (the indicator can drag constantly).",
    ],
    confirmRuleOut: [
      "Visual pad inspection settles it in minutes.",
      "If the noise is a grind rather than a squeal, assume metal-on-metal and stop driving — that's a different, urgent condition.",
    ],
    repairDirection:
      "Replace brake pads, and rotors if scored. One of the most routine repairs a shop does.",
    repairDifficulty: "diy-moderate",
    mechanicSummary:
      "High-pitched squeal on braking consistent with pad wear indicators. Please measure pad thickness all around and check rotor condition.",
  },
  {
    id: "brake-metal-grinding",
    title: "Brake pads worn to metal (grinding)",
    category: "brakes",
    description:
      "A harsh metallic grinding when braking usually means the pad friction material is gone and the steel backing plate is digging into the rotor. Braking distance suffers and the rotors are being destroyed.",
    sounds: ["grind"],
    strongPhrases: ["brake", "braking", "stop", "pedal"],
    supportingPhrases: ["metal", "worse", "louder"],
    negativePhrases: [
      "not when braking",
      "not while braking",
      "not the brakes",
      "not think it is the brakes",
      "not think it's the brakes",
      "brakes are fine",
      "brakes feel fine",
      "brakes seem fine",
    ],
    contexts: { strong: ["braking"], weak: [], exclude: ["idle"] },
    audioHints: ["broadband_hiss", "loud_recording"],
    baseRate: 0.6,
    severity: "critical",
    urgency: "immediate",
    safeToDrive: "no",
    checksFirst: [
      "Stop driving and inspect the pads through the wheel — if you see shiny grooved rotor and no pad material, it's metal-on-metal.",
      "Check the rotor face for deep scoring.",
      "Notice if the car pulls to one side when braking.",
    ],
    confirmRuleOut: [
      "Grinding only while braking is near-diagnostic for metal-on-metal pads.",
      "Grinding that continues when not braking points to a stuck caliper or a failing wheel bearing instead.",
    ],
    repairDirection:
      "Replace pads and almost certainly rotors; inspect calipers for heat damage. Do this before driving further.",
    repairDifficulty: "pro",
    mechanicSummary:
      "Grinding under braking, suspected metal-on-metal. Please inspect pads, rotors, and calipers urgently; vehicle advised not to drive.",
  },
  {
    id: "warped-rotors",
    title: "Warped / unevenly worn brake rotors",
    category: "brakes",
    description:
      "Rotors with uneven thickness make the brake pedal and steering wheel pulse or shudder during braking, most noticeably from highway speed. You may hear a rhythmic rubbing rather than a constant noise.",
    sounds: ["vibration", "rumble"],
    strongPhrases: ["brake", "pedal puls", "shudder", "steering wheel shake"],
    supportingPhrases: ["highway", "downhill", "vibrat", "rhythm"],
    contexts: { strong: ["braking"], weak: ["highway_speed"] },
    signals: { speed: "tracks_road_speed" },
    audioHints: ["rhythmic_ticking", "low_rumble"],
    wear: { mileageFrom: 40_000 },
    baseRate: 0.6,
    severity: "moderate",
    urgency: "soon",
    safeToDrive: "caution",
    checksFirst: [
      "Brake gently from ~60 mph (where safe) and feel for pulsing in the pedal or wheel.",
      "Check for blue heat discoloration or visible ridges on the rotor face.",
      "Note if the shudder is steering-wheel-centric (front rotors) or seat-centric (rear).",
    ],
    confirmRuleOut: [
      "Pulsation only under braking is the key signature; constant vibration points elsewhere (wheels, tires, driveline).",
      "A shop can measure rotor thickness variation to confirm.",
    ],
    repairDirection:
      "Machine or replace rotors and install fresh pads; check caliper slides while in there.",
    repairDifficulty: "pro",
    mechanicSummary:
      "Brake-applied pulsation/shudder. Please measure rotor runout and thickness variation; resurface or replace as needed.",
  },
  {
    id: "stuck-caliper",
    title: "Sticking brake caliper",
    category: "brakes",
    description:
      "A caliper that doesn't fully release drags the pad against the rotor constantly. Signs include grinding or rubbing while cruising, the car pulling to one side, a burning smell, and one wheel much hotter than the others.",
    sounds: ["grind", "squeal", "hiss"],
    strongPhrases: ["burning", "smell", "pull", "one side", "hot wheel", "smoke"],
    supportingPhrases: ["drag", "rubbing", "constant", "brake"],
    contexts: {
      strong: ["braking"],
      weak: ["highway_speed", "idle", "low_speed"],
    },
    signals: { speed: "tracks_road_speed" },
    audioHints: ["broadband_hiss"],
    wear: { ageFrom: 10 },
    baseRate: 0.4,
    severity: "high",
    // A *suspected* sticking caliper is drive-with-caution; the burning-smell
    // and smoke red flags escalate to stop-driving when that evidence exists.
    urgency: "prompt",
    safeToDrive: "caution",
    checksFirst: [
      "After a short drive, carefully feel (don't touch the metal!) for heat radiating from one wheel versus the others.",
      "Watch for the car pulling to one side at steady speed without braking.",
      "Look for smoke or a hot brake smell near one wheel.",
    ],
    confirmRuleOut: [
      "One dramatically hotter wheel after gentle driving is a strong confirmation.",
      "If all wheels run cool and there's no pull, the caliper is likely fine.",
    ],
    repairDirection:
      "Replace or rebuild the seized caliper, plus the pads/rotor on that corner if heat-damaged. A dragging brake can overheat and fade badly — treat as urgent.",
    repairDifficulty: "pro",
    mechanicSummary:
      "Suspected dragging caliper: one-side pull, heat, and rubbing noise. Please check caliper slides/pistons and hose condition on the hot corner.",
  },

  /* ------------------------------ Steering ------------------------------ */
  {
    id: "steering-shaft-column",
    title: "Steering column / intermediate shaft wear",
    category: "steering",
    description:
      "The intermediate shaft connects the steering wheel to the rack. When its joints wear, you get a click or clunk you can often feel through the steering wheel itself when turning, especially at parking speeds — even when the car is barely moving.",
    sounds: ["click", "clunk", "creak"],
    strongPhrases: [
      "feel it in the wheel",
      "through the steering wheel",
      "steering wheel",
      "column",
      "while stationary",
      "parked",
    ],
    supportingPhrases: ["turn", "low speed", "parking"],
    // The column clicks even at rest; "only while moving" points at the axles.
    negativePhrases: [
      "only when moving",
      "only while moving",
      "only while rolling",
      "only when rolling",
      "never when stationary",
      "never happens when stationary",
      "never happens when the car is stationary",
    ],
    contexts: {
      strong: ["low_speed_turning", "turning_left", "turning_right"],
      weak: ["low_speed", "reversing"],
    },
    signals: { locations: ["in_cabin", "front"] },
    audioHints: ["sharp_transients"],
    wear: { ageFrom: 8, mileageFrom: 80_000 },
    baseRate: 0.4,
    severity: "moderate",
    urgency: "prompt",
    safeToDrive: "caution",
    checksFirst: [
      "With the car stationary and engine on, rock the steering wheel gently side to side and feel for a click through the rim.",
      "Note whether the noise happens even when not moving — CV joints need wheel rotation, the column doesn't.",
      "Check for any free play in the wheel before the tires respond.",
    ],
    confirmRuleOut: [
      "Clicking felt through the wheel while stationary points strongly to the column/intermediate shaft, not the axles.",
      "If it only clicks while rolling through turns, CV joints are more likely.",
    ],
    repairDirection:
      "Replace the intermediate shaft or affected joint. Steering play deserves prompt professional attention.",
    repairDifficulty: "pro",
    mechanicSummary:
      "Click/clunk felt through the steering wheel during low-speed steering input, present when stationary. Please check intermediate shaft and column joints for play.",
  },
  {
    id: "power-steering-whine",
    title: "Power steering pump / low fluid",
    category: "steering",
    description:
      "Hydraulic power steering whines or groans when the fluid is low, aerated, or the pump is wearing out. It's loudest when turning the wheel at low speed or holding it at full lock, and often worse on cold mornings.",
    sounds: ["whine", "hum", "creak"],
    // PS fluid is red like ATF — a red puddle plus steering whine fits here.
    strongPhrases: ["steering", "turn the wheel", "full lock", "heavy steering", "hard to turn", "red fluid"],
    supportingPhrases: ["cold", "fluid", "reservoir", "groan"],
    negativePhrases: ["electric power steering"],
    contexts: {
      strong: ["low_speed_turning", "turning_left", "turning_right"],
      weak: ["cold_start", "idle"],
    },
    signals: { speed: "tracks_engine_rpm" },
    audioHints: ["tonal_whine"],
    notFor: ["electric"],
    wear: { ageFrom: 8, mileageFrom: 90_000 },
    baseRate: 0.5,
    severity: "moderate",
    urgency: "soon",
    safeToDrive: "caution",
    checksFirst: [
      "Check the power steering reservoir level and look for foamy (aerated) fluid.",
      "Note if steering effort has increased or feels notchy.",
      "Look under the front of the car for fluid drips after parking overnight.",
      "Note: many newer cars use electric power steering and have no pump or fluid — if so, this cause doesn't apply.",
    ],
    confirmRuleOut: [
      "Low or foamy fluid plus a whine that tracks steering input is a strong match.",
      "If the fluid is full and clean and the whine tracks engine RPM instead, look at the belt/pulleys or alternator.",
    ],
    repairDirection:
      "Top up / flush fluid and fix any leak; replace the pump if it stays noisy with good fluid.",
    repairDifficulty: "pro",
    mechanicSummary:
      "Whine on steering input, suspected hydraulic PS system. Please check fluid level/condition, leaks at rack and lines, and pump noise.",
  },
  {
    id: "steering-rack-knock",
    title: "Steering rack wear / inner tie rods",
    category: "steering",
    description:
      "Wear in the steering rack or inner tie-rod ends causes a knock or rattle over rough roads and a vague, loose feeling on-center. You might hear clunks when sawing the wheel back and forth at a stop.",
    sounds: ["clunk", "rattle", "knock"],
    strongPhrases: [
      "loose steering",
      "steering feels loose",
      "play in the wheel",
      "vague",
      "tie rod",
      "rack",
    ],
    supportingPhrases: ["bump", "rough road", "wander", "steering"],
    contexts: {
      strong: ["over_bumps"],
      weak: ["turning_left", "turning_right", "low_speed_turning"],
    },
    signals: { locations: ["front"] },
    audioHints: ["sharp_transients"],
    wear: { mileageFrom: 100_000, ageFrom: 10 },
    baseRate: 0.35,
    severity: "high",
    urgency: "prompt",
    safeToDrive: "caution",
    checksFirst: [
      "With the car parked, saw the steering wheel a few degrees each way and listen for knocking from below.",
      "Note any new wandering or the need for constant small corrections on the highway.",
      "Have someone watch the front tires while you rock the wheel — delayed tire response means play somewhere in the linkage.",
    ],
    confirmRuleOut: [
      "A shop shaking the front wheels at 9 and 3 o'clock can isolate tie-rod play quickly.",
      "If the noise only happens over bumps with no steering play, sway-bar links are the more common culprit.",
    ],
    repairDirection:
      "Replace inner/outer tie rods or the rack assembly, then align. Steering play is a safety item — don't sit on it.",
    repairDifficulty: "pro",
    mechanicSummary:
      "Knocking over bumps with on-center play. Please check inner/outer tie rods and rack bushings, then alignment after repair.",
  },

  /* ----------------------------- Suspension ----------------------------- */
  {
    id: "strut-mount",
    title: "Worn strut mount / bearing",
    category: "suspension",
    description:
      "The top strut mounts include a bearing that lets the strut rotate with the steering. When worn, they pop, creak, or clunk during slow-speed turns and over small bumps, often felt at the top of the shock tower.",
    sounds: ["pop", "creak", "clunk"],
    strongPhrases: ["turn", "popping when turning", "front top", "strut"],
    supportingPhrases: ["bump", "parking", "slow", "creak"],
    contexts: {
      strong: ["low_speed_turning", "turning_left", "turning_right", "over_bumps"],
      weak: ["low_speed", "reversing"],
    },
    signals: { locations: ["front"] },
    audioHints: ["sharp_transients"],
    wear: { mileageFrom: 80_000, ageFrom: 8 },
    baseRate: 0.5,
    severity: "moderate",
    urgency: "soon",
    safeToDrive: "yes",
    checksFirst: [
      "Have a helper turn the wheel lock-to-lock while you rest a hand on the strut tower under the hood — worn mounts transmit a pop or grind you can feel.",
      "Listen for a single pop per steering input rather than rapid clicking.",
      "Check for clunks over speed bumps at parking speed.",
    ],
    confirmRuleOut: [
      "Noise/feel at the strut tower during stationary steering is a good confirmation.",
      "Rapid click-click-click while rolling through a turn suggests CV joints instead.",
    ],
    repairDirection:
      "Replace the strut mounts/bearings — often done together with struts if they're tired.",
    repairDifficulty: "pro",
    mechanicSummary:
      "Pop/creak on steering input and small bumps, suspected strut top mounts. Please check mount bearings while loaded and unloaded.",
  },
  {
    id: "sway-bar-links",
    title: "Worn sway bar end links",
    category: "suspension",
    description:
      "Sway-bar end links are small ball-jointed rods that wear quickly on rough roads. The signature is a metallic rattle or clunk from the front over bumps and broken pavement, usually disappearing on smooth roads.",
    sounds: ["rattle", "clunk", "click"],
    strongPhrases: ["bump", "rough road", "pothole", "speed bump", "rattle over"],
    supportingPhrases: ["front", "metallic", "small bumps", "driveway"],
    contexts: { strong: ["over_bumps"], weak: ["low_speed"] },
    signals: { locations: ["front"] },
    audioHints: ["sharp_transients", "rhythmic_ticking"],
    wear: { mileageFrom: 60_000, ageFrom: 6 },
    baseRate: 0.7,
    severity: "low",
    urgency: "soon",
    safeToDrive: "yes",
    checksFirst: [
      "With the car parked, grab each sway-bar end link and try to shake it — any free play or knocking means it's worn.",
      "Note that the noise typically vanishes on smooth roads and during steady cornering.",
      "Check both sides; they usually wear in pairs.",
    ],
    confirmRuleOut: [
      "Hand-shake play at the link is an easy, reliable confirmation.",
      "If the clunk happens during braking or acceleration rather than bumps, look at control arms or mounts.",
    ],
    repairDirection:
      "Replace the end links — an inexpensive, quick job and a very common fix for bump rattles.",
    repairDifficulty: "diy-moderate",
    mechanicSummary:
      "Front-end rattle over bumps, quiet on smooth roads. Please check sway-bar end links and bushings for play.",
  },
  {
    id: "control-arm-bushings",
    title: "Worn control arm bushings",
    category: "suspension",
    description:
      "The rubber bushings where the control arms mount to the body crack and soften with age. Expect dull clunks over bumps, a clunk when braking from low speed, and slightly vague or shifting steering feel.",
    sounds: ["clunk", "creak", "knock"],
    strongPhrases: ["bushing", "control arm", "clunk when braking", "dull thud"],
    supportingPhrases: ["bump", "brake", "vague", "pulls"],
    contexts: {
      strong: ["over_bumps"],
      weak: ["braking", "acceleration", "low_speed"],
    },
    signals: { locations: ["front"] },
    audioHints: ["sharp_transients", "low_rumble"],
    wear: { mileageFrom: 90_000, ageFrom: 10 },
    baseRate: 0.5,
    severity: "moderate",
    urgency: "soon",
    safeToDrive: "yes",
    checksFirst: [
      "Look at the visible control-arm bushings for cracked, separated, or oil-soaked rubber.",
      "Notice whether the clunk has a duller, rubbery character versus a sharp metallic rattle.",
      "Check tire wear — worn bushings let alignment wander and scrub tires unevenly.",
    ],
    confirmRuleOut: [
      "Visibly cracked or separated bushing rubber confirms it.",
      "A pry-bar test on a lift shows movement at the bushing; if the links and ball joints are tight and bushings move, that's your noise.",
    ],
    repairDirection:
      "Replace bushings or complete control arms (often cheaper in labor), then align.",
    repairDifficulty: "pro",
    mechanicSummary:
      "Dull clunks over bumps with vague steering. Please inspect control-arm bushings and ball joints; alignment after replacement.",
  },
  {
    id: "ball-joint-wear",
    title: "Worn ball joint",
    category: "suspension",
    description:
      "Ball joints connect the control arms to the steering knuckle. Worn ones creak or clunk over bumps and during turns; a badly worn joint can separate and cause loss of control, so this one shouldn't wait.",
    sounds: ["creak", "clunk", "knock", "squeal"],
    strongPhrases: ["ball joint", "creaking when turning", "creaks over bumps"],
    supportingPhrases: ["turn", "bump", "front", "groan"],
    contexts: {
      strong: ["over_bumps", "low_speed_turning"],
      weak: ["turning_left", "turning_right", "low_speed"],
    },
    signals: { locations: ["front"] },
    audioHints: ["sharp_transients"],
    wear: { mileageFrom: 100_000, ageFrom: 10 },
    baseRate: 0.4,
    severity: "high",
    urgency: "prompt",
    safeToDrive: "caution",
    checksFirst: [
      "Listen for a creak that happens with suspension movement — pushing down on a front corner can reproduce it.",
      "Check for uneven inner tire-edge wear.",
      "If steering has developed a clunk plus wandering, get it inspected promptly rather than diagnosing further yourself.",
    ],
    confirmRuleOut: [
      "A shop checking joint play with the wheel lifted gives a definitive answer.",
      "If the creak vanishes after spraying the rubber bushing areas with silicone, bushings are more likely than the joint itself.",
    ],
    repairDirection:
      "Replace the worn ball joint (or arm assembly). Treat as a safety repair — a separated joint drops the corner of the car.",
    repairDifficulty: "pro",
    mechanicSummary:
      "Creak/clunk with suspension travel and turning. Please check ball joints for play and boots for damage; advise on urgency.",
  },

  /* ---------------------------- Wheels / tires --------------------------- */
  {
    id: "wheel-bearing",
    title: "Failing wheel bearing",
    category: "wheels_tires",
    description:
      "A worn wheel bearing makes a hum, growl, or drone that rises with road speed (not engine RPM) and often changes when you swerve gently left or right, as weight shifts onto and off the bad bearing.",
    sounds: ["hum", "rumble", "grind", "whine"],
    strongPhrases: [
      "changes when i turn",
      "louder in turns",
      "lane change",
      "gets faster with speed",
      "humming",
    ],
    supportingPhrases: ["highway", "droning", "growl", "wheel"],
    // A bearing drone tracks wheel rotation and lateral load; noise that only
    // appears under braking or never varies with steering points elsewhere.
    negativePhrases: [
      "only when braking",
      "only while braking",
      "does not change when turning",
      "doesn't change when turning",
      "no matter what i do with the wheel",
    ],
    contexts: {
      strong: ["highway_speed"],
      weak: ["turning_left", "turning_right", "acceleration", "low_speed"],
      exclude: ["idle"],
    },
    signals: { speed: "tracks_road_speed" },
    audioHints: ["low_rumble", "broadband_hiss"],
    wear: { mileageFrom: 100_000, ageFrom: 10 },
    baseRate: 0.6,
    severity: "high",
    urgency: "prompt",
    safeToDrive: "caution",
    checksFirst: [
      "On an empty road, gently swerve within your lane — if the drone quiets turning one way and worsens the other, suspect the unloaded/loaded side bearing.",
      "Confirm the pitch tracks road speed, not engine RPM (coast in neutral; bearing noise continues).",
      "Check for play by rocking the lifted wheel at 12 and 6 o'clock.",
    ],
    confirmRuleOut: [
      "Noise change during gentle lane-change weight transfer is the classic bearing signature.",
      "Uniform tire roar that doesn't change with steering points to aggressive/chopped tire wear instead.",
    ],
    repairDirection:
      "Replace the wheel bearing / hub assembly. Don't defer long — a bearing that seizes at speed is dangerous.",
    repairDifficulty: "pro",
    mechanicSummary:
      "Speed-dependent hum that changes with lateral load. Please check wheel bearings for play and roughness, and confirm which corner.",
  },
  {
    id: "tire-rub-alignment",
    title: "Tire rub / uneven tire wear",
    category: "wheels_tires",
    description:
      "Tires can rub the fender liner at full steering lock (especially with new tires, spacers, or worn suspension), and unevenly worn tires produce rhythmic roaring or humming that's easy to mistake for a bearing.",
    sounds: ["rumble", "hum", "grind", "squeal"],
    strongPhrases: ["full lock", "rubbing", "fender", "tire", "tyre"],
    supportingPhrases: ["new tires", "alignment", "cupp", "feather", "wear"],
    contexts: {
      strong: ["low_speed_turning", "highway_speed"],
      weak: ["turning_left", "turning_right", "over_bumps"],
    },
    signals: { speed: "tracks_road_speed" },
    audioHints: ["low_rumble", "broadband_hiss"],
    baseRate: 0.45,
    severity: "low",
    urgency: "soon",
    safeToDrive: "yes",
    checksFirst: [
      "Run a hand across the tire tread (carefully) — a sawtooth/cupped feel means uneven wear that hums.",
      "At full lock in a parking lot, listen for rubbing and look for scuff marks on the fender liners.",
      "Check tire pressures and look for inner/outer edge wear suggesting alignment issues.",
    ],
    confirmRuleOut: [
      "Visible liner scuffing or cupped tread confirms it cheaply.",
      "Rotating the tires front-to-rear and hearing the noise move with them is a classic confirmation.",
    ],
    repairDirection:
      "Alignment, rotation, or replacement tires depending on wear; address the suspension cause if wear is uneven.",
    repairDifficulty: "diy-easy",
    mechanicSummary:
      "Road-speed hum / lock rubbing. Please check tread wear pattern, liner contact marks, pressures, and alignment.",
  },
  {
    id: "loose-wheel-lugs",
    title: "Loose wheel / lug nuts",
    category: "wheels_tires",
    description:
      "After recent tire or brake work, under-torqued lug nuts let the wheel shift, causing a rhythmic clunk or wobble that grows with speed. This is rare but genuinely dangerous — a wheel can separate.",
    sounds: ["clunk", "vibration", "knock", "rattle"],
    strongPhrases: [
      "just had tires",
      "recent tire",
      "after the shop",
      "wheel wobble",
      "lug",
      "wheel feels loose",
    ],
    supportingPhrases: ["wobbl", "shak", "new wheels", "rotation"],
    contexts: {
      strong: ["low_speed", "highway_speed"],
      weak: ["over_bumps", "braking"],
    },
    signals: { speed: "tracks_road_speed", onset: "sudden" },
    audioHints: ["rhythmic_ticking", "sharp_transients"],
    baseRate: 0.15,
    severity: "critical",
    urgency: "immediate",
    safeToDrive: "no",
    checksFirst: [
      "If you've had wheel/tire/brake work recently, stop and check every lug nut with the car's wrench now.",
      "Look for shiny streaks or witness marks around the lug seats.",
      "Do not drive at speed until torque is verified.",
    ],
    confirmRuleOut: [
      "A torque check takes five minutes and is definitive.",
      "If lugs are tight and the wobble persists, look at bent wheels, tire separation, or bearings.",
    ],
    repairDirection:
      "Torque all lug nuts to spec; inspect studs and the wheel's hub bore for damage if it was driven loose.",
    repairDifficulty: "diy-easy",
    mechanicSummary:
      "Possible loose wheel after recent service: rhythmic clunk/wobble. Please verify lug torque and inspect studs/wheel seats.",
  },

  /* ------------------------------- Engine ------------------------------- */
  {
    id: "engine-knock-detonation",
    title: "Engine knock / detonation (pinging)",
    category: "engine",
    description:
      "A metallic pinging or rattling under acceleration — like marbles in a can — usually means the fuel is igniting unevenly (detonation). Causes range from low-octane fuel and carbon buildup to faulty knock sensors or cooling issues.",
    sounds: ["knock", "rattle", "tick"],
    strongPhrases: ["accelerat", "under load", "uphill", "ping", "marbles"],
    supportingPhrases: ["fuel", "octane", "gas", "hot day", "spark"],
    contexts: { strong: ["acceleration"], weak: ["highway_speed"] },
    signals: { speed: "tracks_engine_rpm", load: "worse_under_load", locations: ["front"] },
    audioHints: ["rhythmic_ticking", "sharp_transients"],
    notFor: ["electric"],
    dampFor: ["diesel"],
    baseRate: 0.45,
    severity: "high",
    urgency: "prompt",
    safeToDrive: "caution",
    checksFirst: [
      "Try a tank of the octane grade the manufacturer recommends (or one step higher) and see if the noise fades.",
      "Check engine coolant temperature — running hot encourages knock.",
      "Note whether it only happens under load (accelerating, climbing) and disappears cruising.",
      "Note: diesels naturally clatter — for a diesel, compare against its normal sound.",
    ],
    confirmRuleOut: [
      "Knock that disappears with higher-octane fuel strongly suggests detonation.",
      "Knock at idle with no load is more worrying — that pattern points at mechanical wear (see rod knock).",
    ],
    repairDirection:
      "Start with fuel quality and a scan for knock-sensor codes; persistent detonation needs professional diagnosis before it damages pistons.",
    repairDifficulty: "pro",
    mechanicSummary:
      "Pinging under load. Please scan for codes, verify knock sensor operation, check for carbon buildup and cooling performance.",
  },
  {
    id: "rod-knock",
    title: "Rod knock (worn engine bearings)",
    category: "engine",
    description:
      "A deep, rhythmic knock from the bottom of the engine that speeds up with RPM — often worse when warm or under light load — can mean worn crankshaft rod bearings, usually from oil starvation. This is the most serious engine noise there is.",
    sounds: ["knock", "clunk", "rumble"],
    strongPhrases: ["deep knock", "bottom of the engine", "oil light", "low oil", "rev"],
    supportingPhrases: ["warm", "louder with rpm", "idle", "rhythmic"],
    // Rod knock gets LOUDER warm and comes with oil-pressure trouble; the
    // opposite pattern argues strongly for lifter/manifold noise instead.
    negativePhrases: [
      "oil light never",
      "no oil light",
      "oil level is full",
      "oil is full",
      "only when cold",
      "goes away when warm",
      "gone once warm",
      "fades when warm",
    ],
    contexts: { strong: ["idle", "acceleration"], weak: ["cold_start"] },
    signals: { speed: "tracks_engine_rpm", temperature: "warm_only", locations: ["front"] },
    audioHints: ["rhythmic_ticking", "low_rumble", "loud_recording"],
    notFor: ["electric"],
    baseRate: 0.15,
    severity: "critical",
    urgency: "immediate",
    safeToDrive: "no",
    checksFirst: [
      "Check the oil level immediately — if it's low, top it up but don't assume that fixes the damage.",
      "Note whether the knock frequency rises directly with engine RPM.",
      "If the oil pressure light has flickered at all, stop driving now.",
    ],
    confirmRuleOut: [
      "A mechanic's stethoscope on the block and an oil-pressure test give a quick verdict.",
      "A lighter tick from the top of the engine that fades when warm is far more likely lifter noise (much less serious).",
    ],
    repairDirection:
      "Engine teardown: bearing replacement or engine rebuild/replacement. Continued driving typically destroys the engine — tow it if confirmed likely.",
    repairDifficulty: "pro-major",
    mechanicSummary:
      "Deep RPM-dependent knock, possible rod bearing. Please verify oil level/pressure and assess bottom end before any further driving.",
  },
  {
    id: "lifter-tick",
    title: "Lifter / valvetrain tick",
    category: "engine",
    description:
      "A light, fast ticking from the top of the engine — most noticeable at idle or right after a cold start, often fading as oil circulates — typically comes from hydraulic lifters or valvetrain clearances. Annoying, but usually not urgent.",
    sounds: ["tick", "click"],
    strongPhrases: ["tick", "top of the engine", "fades when warm", "cold start"],
    supportingPhrases: ["idle", "oil change", "fast ticking", "valve"],
    negativePhrases: ["louder when warm", "worse when warm", "louder as it warms"],
    contexts: { strong: ["idle", "cold_start"], weak: ["low_speed"] },
    signals: { speed: "tracks_engine_rpm", temperature: "cold_only", locations: ["front"] },
    audioHints: ["rhythmic_ticking", "high_pitched"],
    notFor: ["electric"],
    wear: { mileageFrom: 100_000 },
    baseRate: 0.55,
    severity: "low",
    urgency: "monitor",
    safeToDrive: "yes",
    checksFirst: [
      "Check the oil level and how overdue the oil change is — low or old oil is the most common cause.",
      "Note if the tick quiets down after the engine warms up for a few minutes.",
      "Confirm the tick speed is roughly half engine speed (valvetrain) rather than matching exhaust pulses.",
    ],
    confirmRuleOut: [
      "Fresh oil of the correct viscosity quieting the tick supports lifter noise.",
      "A tick that's loudest cold and disappears warm can also be a small exhaust manifold leak — have both checked together.",
    ],
    repairDirection:
      "Start with an oil change at correct viscosity; persistent loud ticking may need lifter or lash adjuster service.",
    repairDifficulty: "diy-easy",
    mechanicSummary:
      "Light valvetrain-style tick, prominent cold/idle. Please confirm oil condition and listen for lifter vs. exhaust manifold leak.",
  },
  {
    id: "vacuum-leak",
    title: "Vacuum leak",
    category: "engine",
    description:
      "A hissing from the engine bay at idle — often with a rough or unusually high idle — frequently means a cracked vacuum hose or leaking intake gasket letting unmetered air in.",
    sounds: ["hiss", "whine", "squeal"],
    strongPhrases: ["hiss", "rough idle", "high idle", "vacuum", "engine bay"],
    supportingPhrases: ["idle", "check engine", "stall", "hose"],
    contexts: { strong: ["idle"], weak: ["cold_start", "acceleration"] },
    signals: { locations: ["front"] },
    audioHints: ["broadband_hiss", "high_pitched"],
    notFor: ["electric"],
    dampFor: ["diesel"],
    wear: { ageFrom: 8 },
    baseRate: 0.5,
    severity: "moderate",
    urgency: "soon",
    safeToDrive: "yes",
    checksFirst: [
      "With the engine idling (transmission in park, parking brake on), listen around the intake area for a localized hiss.",
      "Look for cracked, brittle, or disconnected small rubber hoses.",
      "Check if the idle is rough, surging, or higher than normal, and whether the check-engine light is on (lean codes P0171/P0174 are typical).",
    ],
    confirmRuleOut: [
      "A shop smoke test finds vacuum leaks definitively.",
      "Hissing that continues after shutoff is more likely the cooling system venting — check coolant level instead.",
    ],
    repairDirection:
      "Replace the cracked hose or gasket — often a cheap fix once located.",
    repairDifficulty: "diy-moderate",
    mechanicSummary:
      "Idle hiss with possible lean running. Please smoke-test the intake for vacuum leaks and check for lean fuel-trim codes.",
  },

  /* ---------------------------- Belts & pulleys --------------------------- */
  {
    id: "serpentine-belt-squeal",
    title: "Serpentine belt slip / glazing",
    category: "belts",
    description:
      "A loud squeal on cold start or when accelerating — especially in damp weather or with the AC on — usually means the serpentine drive belt is glazed, contaminated, or under-tensioned and slipping on its pulleys.",
    sounds: ["squeal", "chirp"],
    strongPhrases: ["belt", "cold start", "first start", "morning", "wet", "rain"],
    supportingPhrases: ["accelerat", "ac on", "loud squeal", "goes away"],
    negativePhrases: ["no belt"],
    contexts: { strong: ["cold_start", "acceleration"], weak: ["idle"] },
    signals: { speed: "tracks_engine_rpm", locations: ["front"] },
    audioHints: ["high_pitched", "tonal_whine", "loud_recording"],
    notFor: ["electric"],
    wear: { ageFrom: 5, mileageFrom: 60_000 },
    baseRate: 0.75,
    severity: "moderate",
    urgency: "soon",
    safeToDrive: "caution",
    checksFirst: [
      "With the engine OFF, inspect the belt for glazing (shiny sides), cracks, or fraying.",
      "Note whether the squeal lasts a few seconds at start-up and fades — classic slip behavior.",
      "Check for coolant or oil contamination on the belt from a small leak above it.",
    ],
    confirmRuleOut: [
      "A brief mist of water on the running belt (done carefully by a professional) changing the noise confirms slip.",
      "If the noise is a chirp that tracks engine speed at idle, suspect a pulley/tensioner bearing instead.",
    ],
    repairDirection:
      "Replace the belt and check the tensioner. Cheap and quick — but a thrown belt kills the alternator, water pump, and power steering at once, so don't ignore it.",
    repairDifficulty: "diy-moderate",
    mechanicSummary:
      "Start-up/load squeal, suspected belt slip. Please check belt condition, tensioner spring force, and pulley alignment.",
  },
  {
    id: "pulley-tensioner-bearing",
    title: "Failing idler pulley / belt tensioner bearing",
    category: "belts",
    description:
      "The small bearings inside idler pulleys and belt tensioners dry out and chirp, rattle, or grind at idle, with the noise tracking engine RPM. A failed pulley can throw the belt entirely.",
    sounds: ["chirp", "rattle", "whine", "grind", "squeal"],
    strongPhrases: ["chirp", "pulley", "tensioner", "engine bay", "tracks engine speed"],
    supportingPhrases: ["idle", "rev", "bearing", "constant"],
    contexts: { strong: ["idle"], weak: ["cold_start", "acceleration"] },
    signals: { speed: "tracks_engine_rpm", locations: ["front"] },
    audioHints: ["rhythmic_ticking", "high_pitched", "tonal_whine"],
    notFor: ["electric"],
    wear: { mileageFrom: 80_000, ageFrom: 8 },
    baseRate: 0.5,
    severity: "moderate",
    urgency: "prompt",
    safeToDrive: "caution",
    checksFirst: [
      "With the engine off, spin each accessible pulley by hand and feel for roughness or wobble.",
      "Rev the engine gently in park — noise that rises exactly with RPM points to the accessory drive.",
      "Look for belt tracking slightly off-center on a wobbling pulley.",
    ],
    confirmRuleOut: [
      "Removing the belt and running the engine briefly (a standard shop test) silences accessory noise and confirms the area.",
      "A mechanic's stethoscope on each pulley bracket locates the bad bearing precisely.",
    ],
    repairDirection:
      "Replace the noisy pulley or the tensioner assembly, usually together with a fresh belt.",
    repairDifficulty: "diy-moderate",
    mechanicSummary:
      "RPM-tracking chirp/rattle from accessory drive. Please isolate with belt removed and check idler/tensioner bearings.",
  },

  /* ------------------------------- Exhaust ------------------------------- */
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
    audioHints: ["rhythmic_ticking", "high_pitched"],
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

  /* ------------------------------- Cooling ------------------------------- */
  {
    id: "coolant-leak-water-pump",
    title: "Coolant leak / water pump",
    category: "cooling",
    description:
      "A hiss after shutting off a hot engine, a sweet syrupy smell, or a grinding whine from the front of the engine can point to a coolant leak or a failing water pump. Cooling problems escalate to overheating fast.",
    sounds: ["hiss", "whine", "grind"],
    strongPhrases: ["coolant", "sweet smell", "after i turn it off", "temperature", "overheating", "steam"],
    supportingPhrases: ["leak", "puddle", "radiator", "smell"],
    negativePhrases: ["coolant level is fine", "coolant is full", "red fluid"],
    contexts: { strong: ["idle"], weak: ["cold_start", "highway_speed"] },
    signals: { speed: "tracks_engine_rpm", locations: ["front"] },
    audioHints: ["broadband_hiss", "tonal_whine"],
    notFor: ["electric"],
    wear: { ageFrom: 8, mileageFrom: 90_000 },
    baseRate: 0.4,
    severity: "high",
    urgency: "prompt",
    safeToDrive: "caution",
    checksFirst: [
      "Check the coolant level in the overflow tank when the engine is COLD — never open a hot radiator cap.",
      "Look for green/orange/pink residue or puddles under the front of the engine.",
      "Watch the temperature gauge on your next short drive; any climb above normal means stop.",
    ],
    confirmRuleOut: [
      "A cooling system pressure test pinpoints leaks quickly.",
      "Weep marks or drips at the water pump confirm the pump; a whine plus play at the pump pulley seals it.",
    ],
    repairDirection:
      "Fix the leak (hose, pump, radiator) before it overheats — overheating warps heads and turns a small job into an engine job.",
    repairDifficulty: "pro",
    mechanicSummary:
      "Possible coolant leak/water-pump noise. Please pressure-test the cooling system and inspect the pump weep hole and pulley play.",
  },

  /* ----------------------------- Electrical ------------------------------ */
  {
    id: "alternator-bearing-whine",
    title: "Alternator bearing whine",
    category: "electrical",
    description:
      "A high whine that rises and falls exactly with engine RPM — regardless of road speed or steering — often comes from the alternator's bearings or another accessory on the belt path. Sometimes it changes with electrical load (headlights, AC).",
    sounds: ["whine", "hum", "squeal"],
    strongPhrases: ["whine with rpm", "alternator", "louder when revving", "electrical"],
    supportingPhrases: ["headlights", "engine bay", "rev", "constant whine"],
    // An accessory whine tracks engine RPM, not road speed.
    negativePhrases: ["road speed", "with road speed"],
    contexts: { strong: ["idle", "acceleration"], weak: ["cold_start", "highway_speed"] },
    signals: { speed: "tracks_engine_rpm", locations: ["front"] },
    audioHints: ["tonal_whine", "high_pitched"],
    notFor: ["electric"],
    wear: { mileageFrom: 100_000, ageFrom: 10 },
    baseRate: 0.35,
    severity: "moderate",
    urgency: "soon",
    safeToDrive: "caution",
    checksFirst: [
      "Rev the engine in park — if the whine pitch tracks RPM precisely, it's on the accessory drive.",
      "Turn on headlights, rear defrost, and AC; a whine that changes with load implicates the alternator.",
      "Watch for battery/charging warning lights or dimming lights at idle.",
    ],
    confirmRuleOut: [
      "A stethoscope on the alternator housing versus other accessories isolates it.",
      "If the whine changes with steering input instead, look at power steering.",
    ],
    repairDirection:
      "Replace or rebuild the alternator before the bearing seizes and takes the belt with it.",
    repairDifficulty: "pro",
    mechanicSummary:
      "RPM-tracking whine, possibly load-sensitive. Please isolate alternator bearing noise and check charging output.",
  },
  {
    id: "starter-issue",
    title: "Starter motor / flywheel engagement issue",
    category: "electrical",
    description:
      "Grinding or a harsh whirring at the moment you start the car — or a single click with no crank — points to a failing starter motor, its solenoid, or worn flywheel teeth. The car may still run fine once started.",
    sounds: ["grind", "whine", "click", "rattle"],
    strongPhrases: ["when starting", "starting the car", "turn the key", "won't start", "cranking", "single click"],
    supportingPhrases: ["morning", "intermittent", "battery", "ignition"],
    contexts: { strong: ["cold_start"], weak: [] },
    signals: { locations: ["front"] },
    audioHints: ["sharp_transients", "broadband_hiss"],
    wear: { mileageFrom: 120_000, ageFrom: 10 },
    baseRate: 0.4,
    severity: "moderate",
    urgency: "prompt",
    safeToDrive: "yes",
    checksFirst: [
      "Note exactly when the noise happens: only during cranking points to the starter; after start-up points elsewhere.",
      "Check battery terminals for corrosion and tightness — a weak connection mimics starter failure.",
      "Count clicks: one loud click usually means the solenoid engaging but motor failing; rapid clicking suggests a weak battery.",
    ],
    confirmRuleOut: [
      "If the noise occurs only while the key is in 'start', the starter circuit is confirmed as the area.",
      "A battery/charging test rules the simple stuff out first.",
    ],
    repairDirection:
      "Test the battery first, then replace the starter if confirmed. The risk is being stranded, not crash safety.",
    repairDifficulty: "pro",
    mechanicSummary:
      "Grinding/click on engagement during cranking. Please test battery and starter draw, and inspect flywheel ring gear teeth.",
  },
];

/** Number of known issues — imported by UI copy so it never drifts. */
export const KNOWN_ISSUE_COUNT = KNOWLEDGE_BASE.length;
