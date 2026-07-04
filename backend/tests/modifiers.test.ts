import { describe, expect, it } from "vitest";
import { extractModifiers, hasAffirmedPhrase } from "../src/modifiers";
import { normalizeText } from "../src/lexicon";
import { diagnose } from "../src/engine";
import type { DiagnoseRequest } from "../src/schemas";

const req = (symptomText: string, contexts: DiagnoseRequest["contexts"]): DiagnoseRequest => ({
  vehicle: {
    make: "Honda",
    model: "Civic",
    year: 2014,
    mileage: 128_000,
    engineType: "gasoline",
  },
  symptomText,
  contexts,
  audio: null,
  priors: null,
});

describe("modifier extraction (deterministic)", () => {
  it("reads temperature dependence from warm-up fading", () => {
    const m = extractModifiers(
      "Fast ticking on cold start that fades after the engine warms up."
    );
    expect(m.temperature).toBe("cold_only");
  });

  it("distinguishes worse-when-warm from cold-fade", () => {
    const m = extractModifiers("A deep knock that is worse after it warms up.");
    expect(m.temperature).toBe("warm_only");
  });

  it("reads engine-RPM dependence from revving", () => {
    const m = extractModifiers("The whine changes when I rev the engine in park.");
    expect(m.speedDependence).toBe("tracks_engine_rpm");
  });

  it("reads road-speed dependence and lets it win over a negated RPM pole", () => {
    const m = extractModifiers(
      "It gets faster the faster I go, but doesn't change when I rev in neutral."
    );
    expect(m.speedDependence).toBe("tracks_road_speed");
  });

  it("maps a solely-negated RPM pole to independence", () => {
    const m = extractModifiers(
      "A constant hum. It does not change when I rev the engine."
    );
    expect(m.speedDependence).toBe("independent");
  });

  it("reads corner locations before coarse sides", () => {
    expect(extractModifiers("A growl from the front left wheel.").location).toBe(
      "front_left"
    );
    expect(extractModifiers("A rattle from under the car.").location).toBe(
      "under_car"
    );
  });

  it("reads recent work areas", () => {
    const m = extractModifiers(
      "Just had new pads installed and the tires rotated last week."
    );
    expect(m.recentWork).toContain("brakes");
    expect(m.recentWork).toContain("tires_wheels");
  });

  it("extracts negated contexts from conditional negations", () => {
    const m = extractModifiers(
      "Squealing while driving but it does not change at all when I press the brakes."
    );
    expect(m.negatedContexts).toContain("braking");
  });

  it("extracts negated sound types", () => {
    const m = extractModifiers(
      "A whirring noise, definitely not a grinding sound."
    );
    expect(m.negatedSoundTypes).toContain("grind");
    expect(m.negatedSoundTypes).not.toContain("whine");
  });

  it("treats hedged mentions as affirmed, not negated", () => {
    const text = normalizeText("Not sure if that is smoke coming from the hood.");
    expect(hasAffirmedPhrase(text, ["smoke"])).toBe(true);
  });
});

describe("red-flag negation (deterministic only)", () => {
  it("suppresses a flag whose own trigger phrase is explicitly negated", () => {
    const result = diagnose(
      req("Grinding when braking hard. No smoke or burning smell, just the noise.", [
        "braking",
      ])
    );
    const ids = result.redFlags.map((f) => f.id);
    expect(ids).toContain("brake-grinding");
    expect(ids).not.toContain("smoke");
    expect(ids).not.toContain("burning-smell");
    expect(result.overall.safeToDrive).toBe("no");
  });

  it("keeps a flag on a hedged mention — uncertainty is not denial", () => {
    const result = diagnose(
      req("Grinding when I stop and I'm not sure if that's smoke near the wheel.", [
        "braking",
      ])
    );
    expect(result.redFlags.map((f) => f.id)).toContain("smoke");
  });

  it("SAFETY: an AI negation can never suppress a red flag", () => {
    const grinding = req(
      "A horrible grinding noise when braking, getting worse.",
      ["braking"]
    );
    const result = diagnose(grinding, {
      soundTypes: [],
      contexts: [],
      // A hostile/wrong interpretation trying to rule the grind out.
      negatedSoundTypes: ["grind"],
      negatedContexts: ["braking"],
      rationale: "x",
    });
    expect(result.redFlags.map((f) => f.id)).toContain("brake-grinding");
    expect(result.overall.safeToDrive).toBe("no");
  });

  it("suppresses the oil-pressure flag when the light explicitly never came on", () => {
    const result = diagnose(
      req(
        "Knocking sound only when cold, gone once warm. The oil light never came on.",
        ["cold_start"]
      )
    );
    expect(result.redFlags.map((f) => f.id)).not.toContain("oil-pressure");
  });
});

describe("signal scoring", () => {
  it("temperature contradiction demotes rod knock for a cold-fading tick", () => {
    const result = diagnose(
      req(
        "Deep knocking only when cold, completely gone once warm. Oil level is full.",
        ["cold_start"]
      )
    );
    const ids = result.causes.map((c) => c.id);
    expect(ids.slice(0, 3)).not.toContain("rod-knock");
  });

  it("AI-supplied modifiers fill gaps the regex missed", () => {
    // "keeps pace with the motor" is not in the deterministic phrase tables.
    const base = req(
      "A light tick that keeps pace with the motor, quieter later on.",
      ["idle"]
    );
    const without = diagnose(base);
    const withAI = diagnose(base, {
      soundTypes: [],
      contexts: [],
      speedDependence: "tracks_engine_rpm",
      temperature: "cold_only",
      rationale: "Read 'keeps pace with the motor' as RPM-tracking.",
    });
    const lifterBefore = without.causes.find((c) => c.id === "lifter-tick")!;
    const lifterAfter = withAI.causes.find((c) => c.id === "lifter-tick")!;
    expect(lifterAfter.confidence).toBeGreaterThan(lifterBefore.confidence);
  });

  it("deterministic extraction wins over conflicting AI values", () => {
    const base = req(
      "A hum that gets faster the faster I go on the highway.",
      ["highway_speed"]
    );
    // AI wrongly claims RPM-tracking; regex found road-speed and must win.
    const result = diagnose(base, {
      soundTypes: [],
      contexts: [],
      speedDependence: "tracks_engine_rpm",
      rationale: "x",
    });
    const bearing = result.causes.find((c) => c.id === "wheel-bearing");
    const alternator = result.causes.find(
      (c) => c.id === "alternator-bearing-whine"
    );
    expect(bearing).toBeDefined();
    if (alternator) {
      expect(bearing!.confidence).toBeGreaterThan(alternator.confidence);
    }
  });
});
