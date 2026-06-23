import { describe, expect, it } from "vitest";
import {
  DEMO_REQUEST,
  diagnose,
  diagnoseRequestSchema,
  KNOWLEDGE_BASE,
  type DiagnoseRequest,
} from "../src/index";

function makeRequest(overrides: Partial<DiagnoseRequest> = {}): DiagnoseRequest {
  return {
    vehicle: {
      make: "Honda",
      model: "Civic",
      year: 2014,
      mileage: 128_000,
      engineType: "gasoline",
    },
    symptomText: "There is a strange noise coming from my car when I drive.",
    contexts: ["other"],
    audio: null,
    ...overrides,
  };
}

const topIds = (result: ReturnType<typeof diagnose>, n = 3) =>
  result.causes.slice(0, n).map((c) => c.id);

describe("knowledge base sanity", () => {
  it("has at least 25 issues across the required categories", () => {
    expect(KNOWLEDGE_BASE.length).toBeGreaterThanOrEqual(25);
    const categories = new Set(KNOWLEDGE_BASE.map((i) => i.category));
    for (const required of [
      "brakes",
      "steering",
      "suspension",
      "engine",
      "belts",
      "exhaust",
      "cooling",
      "drivetrain",
    ]) {
      expect(categories).toContain(required);
    }
  });

  it("has unique ids and complete guidance on every issue", () => {
    const ids = KNOWLEDGE_BASE.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const issue of KNOWLEDGE_BASE) {
      expect(issue.checksFirst.length).toBeGreaterThanOrEqual(2);
      expect(issue.confirmRuleOut.length).toBeGreaterThanOrEqual(2);
      expect(issue.mechanicSummary.length).toBeGreaterThan(20);
      expect(issue.repairDirection.length).toBeGreaterThan(10);
    }
  });
});

describe("core scenario: clicking while turning (CV joint)", () => {
  const result = diagnose(
    makeRequest({
      symptomText:
        "I hear a clicking or popping sound when turning the steering wheel at low speed.",
      contexts: ["low_speed_turning", "turning_right"],
    })
  );

  it("ranks CV axle wear first", () => {
    expect(result.causes[0]?.id).toBe("cv-axle-wear");
  });

  it("includes steering shaft and strut mount among top causes", () => {
    const ids = topIds(result, 5);
    expect(ids).toContain("steering-shaft-column");
    expect(ids).toContain("strut-mount");
  });

  it("produces evidence bullets referencing the matched sound and context", () => {
    const top = result.causes[0]!;
    expect(top.whyLikely.join(" ")).toMatch(/clicking|popping/);
    expect(top.whyLikely.join(" ").toLowerCase()).toMatch(/turning/);
  });

  it("returns a usable mechanic script mentioning the vehicle", () => {
    expect(result.mechanicScript).toContain("2014 Honda Civic");
    expect(result.mechanicScript.toLowerCase()).toContain("cv joint");
    // Reads like a person talking to their mechanic — no engine/AI/triage tells.
    expect(result.mechanicScript.toLowerCase()).not.toContain("online triage");
    expect(result.mechanicScript.toLowerCase()).not.toContain("triage");
    // Names the likely culprits in plain words — no read-aloud percentages (#4).
    expect(result.mechanicScript).not.toContain("%");
  });
});

describe("brakes", () => {
  it("grinding while braking → metal-on-metal pads, red flag, do not drive", () => {
    const result = diagnose(
      makeRequest({
        symptomText:
          "There is a horrible grinding noise when braking, it gets louder the harder I press.",
        contexts: ["braking"],
      })
    );
    expect(result.causes[0]?.id).toBe("brake-metal-grinding");
    expect(result.redFlags.map((f) => f.id)).toContain("brake-grinding");
    expect(result.overall.safeToDrive).toBe("no");
    expect(result.overall.urgency).toBe("immediate");
  });

  it("squealing while braking → worn pads (wear indicator)", () => {
    const result = diagnose(
      makeRequest({
        symptomText:
          "A high pitched squealing sound when I brake, especially at low speed.",
        contexts: ["braking", "low_speed"],
      })
    );
    expect(result.causes[0]?.id).toBe("brake-pads-worn");
    expect(result.overall.safeToDrive).not.toBe("no");
  });
});

describe("engine", () => {
  it("knocking under acceleration → detonation ranked first", () => {
    const result = diagnose(
      makeRequest({
        symptomText:
          "My engine makes a knocking or pinging sound when accelerating up hills.",
        contexts: ["acceleration"],
      })
    );
    expect(result.causes[0]?.id).toBe("engine-knock-detonation");
  });

  it("loud knocking triggers the stop-driving red flag", () => {
    const result = diagnose(
      makeRequest({
        symptomText: "Loud deep knocking from the engine, getting worse.",
        contexts: ["idle", "acceleration"],
      })
    );
    expect(result.redFlags.map((f) => f.id)).toContain("severe-knocking");
    expect(result.overall.safeToDrive).toBe("no");
  });

  it("ticking at cold start that fades → lifter tick ranked highly", () => {
    const result = diagnose(
      makeRequest({
        symptomText:
          "Fast ticking from the top of the engine on cold start, fades when warm.",
        contexts: ["cold_start", "idle"],
      })
    );
    expect(topIds(result, 2)).toContain("lifter-tick");
  });
});

describe("suspension and wheels", () => {
  it("rattling over bumps → sway bar links first", () => {
    const result = diagnose(
      makeRequest({
        symptomText:
          "A metallic rattle from the front when driving over bumps and potholes.",
        contexts: ["over_bumps"],
      })
    );
    expect(result.causes[0]?.id).toBe("sway-bar-links");
  });

  it("humming that changes when turning at highway speed → wheel bearing", () => {
    const result = diagnose(
      makeRequest({
        symptomText:
          "A humming droning noise at highway speed that changes when I turn slightly or do a lane change.",
        contexts: ["highway_speed"],
      })
    );
    expect(result.causes[0]?.id).toBe("wheel-bearing");
  });
});

describe("steering", () => {
  it("whining when turning the wheel → power steering", () => {
    const result = diagnose(
      makeRequest({
        symptomText:
          "A whining groaning noise when I turn the steering wheel, worse on cold mornings.",
        contexts: ["low_speed_turning", "cold_start"],
      })
    );
    expect(result.causes[0]?.id).toBe("power-steering-whine");
  });
});

describe("engine-type awareness", () => {
  it("excludes combustion-only causes for electric vehicles", () => {
    const result = diagnose(
      makeRequest({
        vehicle: {
          make: "Tesla",
          model: "Model 3",
          year: 2022,
          mileage: 40_000,
          engineType: "electric",
        },
        symptomText:
          "A loud squealing sound when I start driving in the morning.",
        contexts: ["cold_start", "low_speed"],
      })
    );
    const ids = result.causes.map((c) => c.id);
    expect(ids).not.toContain("serpentine-belt-squeal");
    expect(ids).not.toContain("engine-knock-detonation");
    expect(ids).not.toContain("power-steering-whine");
  });
});

describe("red flags", () => {
  it("smoke is always a stop-driving flag", () => {
    const result = diagnose(
      makeRequest({
        symptomText: "Grinding noise and I can see smoke near the front wheel.",
        contexts: ["braking"],
      })
    );
    const smoke = result.redFlags.find((f) => f.id === "smoke");
    expect(smoke?.stopDriving).toBe(true);
    expect(result.overall.safeToDrive).toBe("no");
  });

  it("oil pressure warning is flagged", () => {
    const result = diagnose(
      makeRequest({
        symptomText: "Knocking sound and the oil light flickered at idle.",
        contexts: ["idle"],
      })
    );
    expect(result.redFlags.map((f) => f.id)).toContain("oil-pressure");
  });
});

describe("result hygiene", () => {
  it("keeps confidence within honest bounds (15–88)", () => {
    const results = [
      diagnose(makeRequest()),
      diagnose(
        makeRequest({
          symptomText:
            "Clicking popping grinding squealing knocking rattling everything at once when turning braking accelerating.",
          contexts: [
            "braking",
            "acceleration",
            "low_speed_turning",
            "over_bumps",
          ],
        })
      ),
    ];
    for (const result of results) {
      for (const cause of result.causes) {
        expect(cause.confidence).toBeGreaterThanOrEqual(15);
        expect(cause.confidence).toBeLessThanOrEqual(88);
      }
    }
  });

  it("returns ranked, sorted causes (3–5) with check-first guidance", () => {
    const result = diagnose(DEMO_REQUEST);
    expect(result.causes.length).toBeGreaterThanOrEqual(3);
    expect(result.causes.length).toBeLessThanOrEqual(5);
    const confidences = result.causes.map((c) => c.confidence);
    expect([...confidences].sort((a, b) => b - a)).toEqual(confidences);
    expect(result.whatToCheckFirst.length).toBeGreaterThanOrEqual(3);
    expect(result.disclaimer.toLowerCase()).toContain("not a certified");
  });

  it("flags low-information input instead of feigning confidence", () => {
    const result = diagnose(
      makeRequest({
        symptomText: "Something feels weird about the car lately somehow.",
        contexts: ["other"],
      })
    );
    expect(result.inputQuality.note).toBeTruthy();
    expect(result.inputQuality.soundWordsDetected).toHaveLength(0);
  });

  it("uses audio hints to boost matching causes", () => {
    const withAudio = diagnose(DEMO_REQUEST);
    const withoutAudio = diagnose({ ...DEMO_REQUEST, audio: null });
    const cvWith = withAudio.causes.find((c) => c.id === "cv-axle-wear");
    const cvWithout = withoutAudio.causes.find((c) => c.id === "cv-axle-wear");
    expect(cvWith!.confidence).toBeGreaterThan(cvWithout!.confidence);
    expect(withAudio.audioSummary).not.toBeNull();
  });
});

describe("request validation", () => {
  it("rejects too-short symptom text", () => {
    const parsed = diagnoseRequestSchema.safeParse({
      ...makeRequest(),
      symptomText: "noise",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects empty contexts", () => {
    const parsed = diagnoseRequestSchema.safeParse({
      ...makeRequest(),
      contexts: [],
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects implausible years", () => {
    const req = makeRequest();
    const parsed = diagnoseRequestSchema.safeParse({
      ...req,
      vehicle: { ...req.vehicle, year: 1900 },
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts the demo request", () => {
    expect(diagnoseRequestSchema.safeParse(DEMO_REQUEST).success).toBe(true);
  });
});

describe("AI symptom interpreter (input layer)", () => {
  // Figurative wording the prefix-stem lexicon cannot match: no "click",
  // "pop", etc. appears literally.
  const figurative =
    "It sounds like a pack of cards stuck in bicycle spokes, mostly when I pull out of a parking spot.";
  const findCause = (r: ReturnType<typeof diagnose>, id: string) =>
    r.causes.find((c) => c.id === id);

  it("promotes a cause the literal lexicon missed when AI infers the sound", () => {
    const baseReq = makeRequest({
      symptomText: figurative,
      contexts: ["low_speed_turning", "turning_right"],
    });
    const without = diagnose(baseReq);
    const withInterp = diagnose(baseReq, {
      soundTypes: ["click", "pop"],
      contexts: [],
      rationale: "Read 'cards in spokes' as rhythmic clicking and popping.",
    });

    // The literal run can't see any sound word; the interpreted run can.
    expect(without.inputQuality.soundWordsDetected).toHaveLength(0);

    // cv-axle-wear is only a mid-pack guess on context alone, but rises to the
    // top once the AI recovers the clicking the lexicon couldn't match.
    const cvBefore = findCause(without, "cv-axle-wear")!;
    const cvAfter = findCause(withInterp, "cv-axle-wear")!;
    expect(withInterp.causes[0]?.id).toBe("cv-axle-wear");
    expect(cvAfter.confidence).toBeGreaterThan(cvBefore.confidence);
    expect(cvAfter.rank).toBeLessThan(cvBefore.rank);
  });

  it("surfaces what it inferred in the interpretation field, phrased honestly", () => {
    const result = diagnose(
      makeRequest({ symptomText: figurative, contexts: ["low_speed_turning"] }),
      {
        soundTypes: ["click"],
        contexts: ["acceleration"],
        rationale: "Read 'cards in spokes' as clicking.",
      }
    );
    expect(result.interpretation?.soundTypes).toContain("click");
    expect(result.interpretation?.contexts).toContain("acceleration");
    expect(result.interpretation?.rationale).toBeTruthy();
    // Honest wording: never claims the user "described" a word they didn't type.
    const top = result.causes[0]!;
    expect(top.whyLikely.join(" ")).not.toMatch(/you described/i);
  });

  it("does not surface interpretation when the AI adds nothing new", () => {
    const result = diagnose(
      makeRequest({
        symptomText: "A clear clicking sound.",
        contexts: ["low_speed_turning"],
      }),
      // Both already covered by the literal text / selected contexts.
      { soundTypes: ["click"], contexts: ["low_speed_turning"], rationale: "x" }
    );
    expect(result.interpretation).toBeNull();
  });

  it("SAFETY: an AI-inferred grind cannot manufacture a stop-driving red flag", () => {
    // No "grind"/"metal-on-metal" appears literally; AI infers grinding.
    const req = makeRequest({
      symptomText: "A harsh noise comes from the front when I slow to a stop.",
      contexts: ["braking"],
    });
    const result = diagnose(req, {
      soundTypes: ["grind"],
      contexts: ["braking"],
      rationale: "Read 'harsh noise while slowing' as grinding.",
    });
    // The red flag (hard stop-driving alert) must trace to the user's words.
    expect(result.redFlags.map((f) => f.id)).not.toContain("brake-grinding");

    // Contrast: the SAME wording typed literally DOES raise the red flag.
    const literal = diagnose(
      makeRequest({
        symptomText: "A harsh grinding noise when I slow to a stop.",
        contexts: ["braking"],
      })
    );
    expect(literal.redFlags.map((f) => f.id)).toContain("brake-grinding");
  });

  it("is a no-op when no interpretation is supplied (back-compat)", () => {
    const req = makeRequest({
      symptomText: "A clicking sound when turning at low speed.",
      contexts: ["low_speed_turning"],
    });
    const a = diagnose(req);
    const b = diagnose(req, null);
    expect(b.causes.map((c) => c.id)).toEqual(a.causes.map((c) => c.id));
    expect(b.interpretation).toBeNull();
  });
});
