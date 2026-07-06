import type { KnownIssue } from "./types";

export const DRIVETRAIN_ISSUES: KnownIssue[] = [
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
  {
    id: "transmission-slipping",
    title: "Automatic transmission slipping",
    category: "drivetrain",
    description:
      "A slipping automatic lets the engine flare up in revs without the car pulling harder, often with a hum or whine during the flare and a delayed or soft shift. Low or burnt fluid is the most common trigger.",
    sounds: ["hum", "whine"],
    strongPhrases: ["slip", "revs jump", "revs flare", "rpm jumps", "delayed shift", "hard shift", "won't shift", "flare"],
    supportingPhrases: ["transmission", "fluid", "gear", "shifting", "accelerat"],
    contexts: { strong: ["acceleration"], weak: ["highway_speed", "low_speed"] },
    signals: { load: "worse_under_load" },
    audioHints: ["tonal_whine"],
    notFor: ["electric"],
    wear: { mileageFrom: 100_000 },
    baseRate: 0.4,
    severity: "high",
    urgency: "prompt",
    safeToDrive: "caution",
    checksFirst: [
      "Check the transmission fluid level and color if there is a dipstick — dark, burnt-smelling fluid points at internal wear.",
      "Notice whether engine revs climb without the car speeding up, especially pulling away or on hills.",
      "Note any warning light — many cars set a code before slipping becomes obvious.",
    ],
    confirmRuleOut: [
      "An RPM flare between gears on a road test is the classic confirmation.",
      "If revs and speed always move together and shifts feel normal, the transmission is probably not slipping.",
    ],
    repairDirection:
      "Start with a fluid and filter service and a scan for codes; repeated slipping needs a transmission specialist before it destroys the clutches.",
    repairDifficulty: "pro-major",
    mechanicSummary:
      "RPM flare with soft or delayed engagement, suspected slipping. Please check fluid condition, scan TCM codes, and road-test the shift pattern.",
  },
  {
    id: "torque-converter-shudder",
    title: "Torque converter shudder",
    category: "drivetrain",
    description:
      "When the torque converter clutch locks up (typically 40\u201350 mph under light throttle), a worn converter or degraded fluid can cause a shudder that feels like driving over rumble strips for a second or two.",
    sounds: ["vibration", "rumble"],
    strongPhrases: ["rumble strips", "shudder around", "shudders at", "light throttle", "torque converter", "lockup", "lock-up"],
    supportingPhrases: ["transmission", "fluid", "vibrat", "highway", "steady speed"],
    negativePhrases: ["when braking", "over bumps only"],
    contexts: { strong: ["highway_speed", "acceleration"], weak: [] },
    signals: { load: "worse_under_load" },
    audioHints: ["low_rumble"],
    notFor: ["electric"],
    wear: { mileageFrom: 90_000 },
    baseRate: 0.3,
    severity: "moderate",
    urgency: "soon",
    safeToDrive: "yes",
    checksFirst: [
      "Note the exact speed and throttle where it shudders — converter shudder is very repeatable, usually 40\u201350 mph at light throttle.",
      "See if it disappears when you press the gas harder or lift off completely (that unlocks the converter clutch).",
      "Check when the transmission fluid was last changed.",
    ],
    confirmRuleOut: [
      "A shudder that vanishes the moment you change throttle position points squarely at the converter clutch.",
      "A vibration that tracks road speed at ALL throttle positions is more likely tires, wheels, or driveshaft.",
    ],
    repairDirection:
      "A fluid exchange with the manufacturer's spec fluid often cures early shudder; persistent shudder needs converter or valve-body work.",
    repairDifficulty: "pro",
    mechanicSummary:
      "Light-throttle shudder near lockup speed. Please road-test TCC engagement and advise on a fluid exchange versus converter service.",
  },
  {
    id: "torque-converter-whine",
    title: "Torque converter / transmission pump whine",
    category: "drivetrain",
    description:
      "A whine that appears in gear at a standstill (foot on the brake, in Drive) and changes when shifting to Park or Neutral often comes from the torque converter or the transmission's front pump.",
    sounds: ["whine"],
    strongPhrases: ["in drive", "whine in gear", "goes away in park", "changes in park", "shift to park", "holding the brake", "torque converter"],
    supportingPhrases: ["transmission", "in gear", "at a stop", "stall"],
    contexts: { strong: ["idle"], weak: ["acceleration", "low_speed"] },
    signals: { speed: "tracks_engine_rpm" },
    audioHints: ["tonal_whine"],
    notFor: ["electric"],
    wear: { mileageFrom: 110_000 },
    baseRate: 0.2,
    severity: "high",
    urgency: "prompt",
    safeToDrive: "caution",
    checksFirst: [
      "Compare the sound in Drive (held on the brake) versus Park at the same RPM — a converter whine changes with the shift.",
      "Check the transmission fluid level and condition first; a low pump whines loudest.",
      "Listen for the whine rising with engine RPM rather than road speed.",
    ],
    confirmRuleOut: [
      "A whine present in gear but gone in Park/Neutral is strong evidence for the converter or pump.",
      "If the whine is identical in every gear position, look at the accessory drive (alternator, pulleys) instead.",
    ],
    repairDirection:
      "Verify fluid first; a confirmed converter or pump whine is a transmission-shop job and shouldn't be deferred long.",
    repairDifficulty: "pro-major",
    mechanicSummary:
      "RPM-tracking whine present in gear, changing in Park. Please check fluid and isolate converter/front-pump noise at stall.",
  },
  {
    id: "throwout-bearing-chirp",
    title: "Clutch release (throw-out) bearing",
    category: "drivetrain",
    description:
      "On a manual transmission, a chirp or whir that appears the moment you press the clutch pedal — and goes quiet when you release it — is the classic sign of a dry or worn release bearing.",
    sounds: ["chirp", "whine", "grind", "squeal"],
    strongPhrases: ["clutch pedal", "press the clutch", "clutch in", "when i push the clutch", "manual"],
    supportingPhrases: ["clutch", "gear", "pedal", "stick shift"],
    contexts: { strong: ["idle"], weak: ["low_speed", "cold_start"] },
    signals: { speed: "tracks_engine_rpm" },
    audioHints: ["high_pitched", "tonal_whine"],
    notFor: ["electric"],
    wear: { mileageFrom: 90_000 },
    baseRate: 0.25,
    severity: "moderate",
    urgency: "soon",
    safeToDrive: "yes",
    checksFirst: [
      "At idle in neutral, press and release the clutch pedal — a noise that appears with the pedal DOWN is the release bearing.",
      "A rattle that disappears when you press the clutch instead points at the input shaft or a dual-mass flywheel.",
      "Note whether the noise changed after any recent clutch work.",
    ],
    confirmRuleOut: [
      "Noise keyed exactly to clutch pedal position is near-diagnostic.",
      "If the noise is there in gear while driving with the clutch out, it's not the release bearing.",
    ],
    repairDirection:
      "Replace the release bearing — realistically together with the clutch kit, since the labor is the same transmission-out job.",
    repairDifficulty: "pro-major",
    mechanicSummary:
      "Chirp/whir keyed to clutch pedal travel. Please confirm release-bearing noise and quote clutch kit R&R.",
  },
  {
    id: "clutch-judder",
    title: "Clutch judder on takeoff",
    category: "drivetrain",
    description:
      "A manual (or dual-clutch) car that shakes or judders as you pull away from a stop usually has a contaminated or glazed clutch, a warped flywheel, or a failing engine mount amplifying the engagement.",
    sounds: ["vibration"],
    strongPhrases: ["judder", "shakes when pulling away", "shudders from a stop", "taking off from a stop", "clutch engag"],
    supportingPhrases: ["clutch", "first gear", "hill start", "vibrat"],
    contexts: { strong: ["acceleration", "low_speed"], weak: ["cold_start"] },
    signals: { load: "worse_under_load" },
    audioHints: ["low_rumble"],
    notFor: ["electric"],
    wear: { mileageFrom: 80_000 },
    baseRate: 0.25,
    severity: "moderate",
    urgency: "soon",
    safeToDrive: "yes",
    checksFirst: [
      "Notice if it only judders during clutch engagement from a stop and smooths out once fully rolling.",
      "Try a gentle uphill start — judder is usually worst under load at low RPM.",
      "Check for any oil leak at the back of the engine (a rear main seal can contaminate the clutch).",
    ],
    confirmRuleOut: [
      "Shaking confined strictly to the engagement zone is clutch-system judder; shaking at all speeds is wheels/driveline.",
      "If the judder appeared right after driving through deep water, contamination may clear after a few careful slips.",
    ],
    repairDirection:
      "Persistent judder needs the clutch and flywheel inspected/replaced; fix any oil leak feeding it at the same time.",
    repairDifficulty: "pro-major",
    mechanicSummary:
      "Judder during clutch engagement from stops. Please inspect clutch friction surface, flywheel runout, and rear main seal.",
  },
  {
    id: "dmf-rattle",
    title: "Dual-mass flywheel rattle",
    category: "drivetrain",
    description:
      "Many manual and some automatic cars use a dual-mass flywheel whose internal springs wear out, causing a distinctive rattle at idle in neutral that DISAPPEARS when you press the clutch pedal.",
    sounds: ["rattle", "clunk", "knock"],
    strongPhrases: ["goes away when i press the clutch", "quiet with the clutch in", "flywheel", "dual mass", "dual-mass"],
    supportingPhrases: ["idle", "neutral", "clutch", "diesel"],
    contexts: { strong: ["idle"], weak: ["cold_start", "low_speed"] },
    signals: { speed: "tracks_engine_rpm" },
    audioHints: ["rhythmic_ticking", "irregular_knocking"],
    notFor: ["electric"],
    wear: { mileageFrom: 90_000 },
    baseRate: 0.2,
    severity: "moderate",
    urgency: "soon",
    safeToDrive: "caution",
    checksFirst: [
      "At idle in neutral, press the clutch: a rattle that STOPS with the pedal down strongly suggests the dual-mass flywheel.",
      "Listen for the rattle worsening with a warm engine at low idle.",
      "Note any takeoff judder or clunk on throttle changes accompanying it.",
    ],
    confirmRuleOut: [
      "The clutch-pedal test separates flywheel rattle from exhaust or engine ticks quickly.",
      "A rattle that continues with the clutch pressed is more likely a heat shield or valvetrain noise.",
    ],
    repairDirection:
      "Replace the dual-mass flywheel with the clutch — deferring it risks debris damaging the transmission.",
    repairDifficulty: "pro-major",
    mechanicSummary:
      "Neutral-idle rattle silenced by clutch-in, suspected DMF. Please verify and quote flywheel + clutch replacement.",
  },
  {
    id: "diff-gear-whine",
    title: "Differential gear whine",
    category: "drivetrain",
    description:
      "A worn ring-and-pinion or low gear oil makes the differential whine or howl at a pitch tied to road speed — often loudest either under gentle throttle OR when coasting, and coming from the axle rather than the engine.",
    sounds: ["whine", "hum"],
    strongPhrases: ["differential", "rear axle", "diff", "howls on the highway", "gear oil"],
    supportingPhrases: ["rear", "coasting", "under power", "highway", "speed"],
    contexts: { strong: ["highway_speed"], weak: ["acceleration"] },
    signals: { speed: "tracks_road_speed", load: "worse_coasting", locations: ["rear", "under_car"] },
    audioHints: ["tonal_whine", "strong_harmonics"],
    wear: { mileageFrom: 120_000 },
    baseRate: 0.2,
    severity: "high",
    urgency: "prompt",
    safeToDrive: "caution",
    checksFirst: [
      "Notice whether the pitch tracks road speed and whether it changes between light throttle and coasting — diff wear usually favors one.",
      "Check the differential for leaks around the pinion seal and cover.",
      "Confirm it's loudest from the axle area, not the engine bay.",
    ],
    confirmRuleOut: [
      "A whine that swaps character between drive and coast is classic ring-and-pinion wear.",
      "If the noise changes during lane changes instead, suspect a wheel bearing first.",
    ],
    repairDirection:
      "Check and correct the gear oil first; a confirmed gear whine needs differential service or rebuild before it turns into a howl and then a failure.",
    repairDifficulty: "pro-major",
    mechanicSummary:
      "Road-speed gear whine from the axle, drive/coast sensitive. Please check diff oil level/condition and pinion bearing preload.",
  },
  {
    id: "diff-clunk-lash",
    title: "Driveline lash clunk (differential / axle play)",
    category: "drivetrain",
    description:
      "A single clunk from under the rear when you lift off the throttle or tip back in usually means accumulated play (lash) in the differential, axle splines, or driveshaft joints taking up slack.",
    sounds: ["clunk", "knock"],
    strongPhrases: ["when i let off the gas", "lift off the throttle", "on and off the gas", "tip in", "rear end clunk"],
    supportingPhrases: ["rear", "under the car", "driveshaft", "gear"],
    contexts: { strong: ["acceleration"], weak: ["reversing", "low_speed"] },
    signals: { load: "worse_coasting", locations: ["rear", "under_car"] },
    audioHints: ["sharp_transients"],
    wear: { mileageFrom: 110_000 },
    baseRate: 0.25,
    severity: "moderate",
    urgency: "soon",
    safeToDrive: "yes",
    checksFirst: [
      "Reproduce it by gently rocking on and off the throttle at low speed — lash clunk is very repeatable.",
      "Note whether it's one single clunk per throttle change rather than a continuous noise.",
      "Check for a worn center support bearing or U-joint if the truck has a long driveshaft.",
    ],
    confirmRuleOut: [
      "One clunk exactly on throttle reversal points at driveline lash, not suspension.",
      "A clunk over bumps with no throttle change is suspension, not driveline.",
    ],
    repairDirection:
      "Inspect U-joints, axle splines, and diff backlash; modest lash is often lived with, but worn joints should be replaced.",
    repairDifficulty: "pro",
    mechanicSummary:
      "Single rear clunk on throttle reversal. Please measure driveline lash and inspect U-joints and axle splines.",
  },
  {
    id: "ev-reduction-gear-whine",
    title: "EV reduction-gear / motor bearing whine",
    category: "drivetrain",
    description:
      "Electric drive units use a single-speed reduction gear. Worn gear teeth or motor bearings produce a whine that rises smoothly with road speed and is present with or without power applied — distinct from the normal, faint inverter hum.",
    sounds: ["whine", "hum"],
    strongPhrases: ["rises with speed", "gets louder with speed", "drive unit", "motor whine"],
    supportingPhrases: ["electric", "ev", "accelerat", "regen"],
    contexts: { strong: ["acceleration", "highway_speed"], weak: ["low_speed"] },
    signals: { speed: "tracks_road_speed" },
    audioHints: ["tonal_whine", "strong_harmonics"],
    notFor: ["gasoline", "diesel"],
    wear: { mileageFrom: 80_000 },
    baseRate: 0.3,
    severity: "moderate",
    urgency: "soon",
    safeToDrive: "caution",
    checksFirst: [
      "Compare the pitch against road speed: drive-unit whine climbs smoothly with speed in any drive mode.",
      "Note whether it is present both accelerating and coasting/regenerating — gear whine usually is.",
      "Compare against the car's normal faint inverter whine at parking speeds; a new, louder tone is the concern.",
    ],
    confirmRuleOut: [
      "A whine unchanged by throttle but tied to speed points at the reduction gear or motor bearing.",
      "If the sound changes with steering or lane changes, check wheel bearings first.",
    ],
    repairDirection:
      "Have the drive unit inspected (gear oil condition where serviceable, bearing noise); EV drive units are usually repaired or exchanged as assemblies.",
    repairDifficulty: "pro-major",
    mechanicSummary:
      "Speed-tracking whine from the drive unit on an EV. Please assess reduction-gear/motor-bearing noise and drive-unit oil condition.",
  },
  {
    id: "hybrid-engagement-clunk",
    title: "Hybrid engine engagement clunk",
    category: "drivetrain",
    description:
      "Hybrids start and stop their gas engine constantly. A modest clunk or shudder each time the engine kicks in — especially under sudden throttle — often traces to worn engine mounts or a tired damper, and is common on higher-mileage hybrids.",
    sounds: ["clunk", "vibration"],
    strongPhrases: ["when the engine kicks in", "engine starts while driving", "when the gas engine comes on", "hybrid"],
    supportingPhrases: ["accelerat", "battery", "ev mode", "shudder"],
    contexts: { strong: ["acceleration"], weak: ["low_speed", "idle"] },
    signals: { load: "worse_under_load" },
    audioHints: ["sharp_transients", "low_rumble"],
    notFor: ["gasoline", "diesel", "electric"],
    wear: { mileageFrom: 100_000 },
    baseRate: 0.35,
    severity: "low",
    urgency: "soon",
    safeToDrive: "yes",
    checksFirst: [
      "Notice whether the clunk lines up exactly with the gas engine starting (watch the power-flow display).",
      "Compare gentle acceleration versus sudden throttle — worn mounts clunk hardest on abrupt engine starts.",
      "Check mileage against typical mount life; high-mileage hybrids commonly need mounts.",
    ],
    confirmRuleOut: [
      "A thud synchronized with engine start events points at mounts/damper, not the transmission.",
      "If it also clunks over bumps with the engine off, look at suspension instead.",
    ],
    repairDirection:
      "Inspect and replace worn engine mounts; the engagement itself is normal hybrid behavior, the harshness is the wear item.",
    repairDifficulty: "pro",
    mechanicSummary:
      "Clunk synchronized with hybrid engine start events. Please check engine mounts and engagement damper wear.",
  },
];
