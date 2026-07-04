"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ArrowLeft, ArrowRight, FlaskConical, Play } from "lucide-react";
import {
  DEMO_REQUEST,
  type DiagnoseRequest,
  type DiagnosisResult,
  type SoundContext,
} from "@revsense/backend";
import {
  fetchAIStatus,
  fetchVehicleHistory,
  requestDiagnosis,
  requestExplanation,
  type AIStatus,
  type VehicleHistory,
} from "@/lib/api";
import { getGarageRepository } from "@/lib/storage/localRepository";
import { useGarage } from "@/lib/storage/useGarage";
import { findSavedVehicle } from "@/lib/storage/vehicles";
import {
  buildOwnerContext,
  detectRecurrence,
  type Recurrence,
} from "@/lib/storage/recurrence";
import type { SavedVehicle } from "@/lib/storage/types";
import { AudioStep } from "./AudioStep";
import { VehicleStep } from "./VehicleStep";
import { SymptomStep } from "./SymptomStep";
import { ReviewStep } from "./ReviewStep";
import { ScanningOverlay } from "./ScanningOverlay";
import { ResultsView } from "@/components/results/ResultsView";
import { EMPTY_VEHICLE, type AudioState, type VehicleFormState } from "./types";

const STEPS = ["Recording", "Vehicle", "Symptoms", "Review"] as const;
const MIN_SCAN_MS = 2800;

/** Synthetic click-train envelope so the demo scenario has a waveform to show. */
function demoEnvelope(): number[] {
  const env: number[] = [];
  for (let i = 0; i < 160; i++) {
    const phase = i % 26;
    env.push(phase < 3 ? 0.85 - phase * 0.2 : 0.08 + Math.random() * 0.06);
  }
  return env;
}

function demoVehicle(): VehicleFormState {
  const v = DEMO_REQUEST.vehicle;
  return {
    make: v.make,
    model: v.model,
    year: String(v.year),
    mileage: v.mileage != null ? String(v.mileage) : "",
    engineType: v.engineType ?? "unknown",
  };
}

function demoAudio(): AudioState | null {
  if (!DEMO_REQUEST.audio) return null;
  return {
    features: DEMO_REQUEST.audio,
    envelope: demoEnvelope(),
    objectUrl: null,
    label: "Demo scenario · sample recording",
  };
}

export function DiagnoseWizard({ demo = false }: { demo?: boolean }) {
  // The demo flag comes from the URL, so it's fixed for the page's lifetime —
  // prefill via lazy initial state rather than an effect.
  const [step, setStep] = useState(demo ? 3 : 0);
  const [audio, setAudio] = useState<AudioState | null>(() =>
    demo ? demoAudio() : null
  );
  const [vehicle, setVehicle] = useState<VehicleFormState>(() =>
    demo ? demoVehicle() : EMPTY_VEHICLE
  );
  const [symptomText, setSymptomText] = useState(() =>
    demo ? DEMO_REQUEST.symptomText : ""
  );
  const [contexts, setContexts] = useState<SoundContext[]>(() =>
    demo ? [...DEMO_REQUEST.contexts] : []
  );
  const [phase, setPhase] = useState<"form" | "scanning" | "results">("form");
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [explaining, setExplaining] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [aiStatus, setAIStatus] = useState<AIStatus>({
    aiConfigured: false,
    aiProviderLabel: null,
  });

  // Personalization state — the saved vehicle this scan is linked to, the scan
  // record just written, and any detected recurring-noise history.
  const { vehicles, saveVehicle, updateVehicle } = useGarage();
  const [matchedVehicle, setMatchedVehicle] = useState<SavedVehicle | null>(null);
  const [currentScanId, setCurrentScanId] = useState<string | null>(null);
  const [currentScanAt, setCurrentScanAt] = useState<string | null>(null);
  const [recurrence, setRecurrence] = useState<Recurrence | null>(null);
  const [savingVehicle, setSavingVehicle] = useState(false);
  const [vehicleHistory, setVehicleHistory] = useState<VehicleHistory | null>(
    null
  );

  useEffect(() => {
    void fetchAIStatus().then(setAIStatus);
  }, []);

  const loadDemo = useCallback(() => {
    setVehicle(demoVehicle());
    setSymptomText(DEMO_REQUEST.symptomText);
    setContexts([...DEMO_REQUEST.contexts]);
    setAudio(demoAudio());
    setStep(3);
    setSubmitError(null);
  }, []);

  const yearNum = Number(vehicle.year);
  const currentYear = new Date().getFullYear();
  const stepValid: boolean[] = [
    true, // audio is optional
    vehicle.make.trim().length > 0 &&
      vehicle.model.trim().length > 0 &&
      Number.isInteger(yearNum) &&
      yearNum >= 1960 &&
      yearNum <= currentYear + 1,
    symptomText.trim().length >= 10 && contexts.length > 0,
    true,
  ];
  const canSubmit = stepValid[1] && stepValid[2];

  // Non-blocking: once the vehicle is valid, pull reported-issue + recall priors
  // so the results can surface recalls and "common for your vehicle" tags. The
  // diagnosis itself never waits on this — it just enriches the report if ready.
  const historyMake = vehicle.make.trim();
  const historyModel = vehicle.model.trim();
  const vehicleValid = stepValid[1];
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      if (!active) return;
      if (vehicleValid) {
        void fetchVehicleHistory(historyMake, historyModel, yearNum).then((h) => {
          if (active) setVehicleHistory(h);
        });
      } else {
        setVehicleHistory(null);
      }
    }, 400);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [historyMake, historyModel, yearNum, vehicleValid]);

  const submit = async () => {
    if (!canSubmit) return;
    const request: DiagnoseRequest = {
      vehicle: {
        make: vehicle.make.trim(),
        model: vehicle.model.trim(),
        year: yearNum,
        mileage: vehicle.mileage.trim() ? Number(vehicle.mileage) : null,
        engineType: vehicle.engineType,
      },
      symptomText: symptomText.trim(),
      contexts,
      audio: audio?.features ?? null,
      // Per-model NHTSA priors, if the background fetch has resolved by now.
      // The engine uses them only as a bounded tie-breaker; null is always fine.
      priors: vehicleHistory?.priors ?? null,
    };

    setPhase("scanning");
    setSubmitError(null);
    setRecurrence(null);
    setMatchedVehicle(null);
    setCurrentScanId(null);
    setCurrentScanAt(null);
    const minDelay = new Promise((r) => setTimeout(r, MIN_SCAN_MS));
    try {
      const [diagnosis] = await Promise.all([
        requestDiagnosis(request),
        minDelay,
      ]);
      setResult(diagnosis);
      setPhase("results");
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Personalization (best-effort, never blocks or breaks the diagnosis):
      // link the scan to a saved vehicle, spot a recurring noise, and record
      // the summary in on-device history.
      const identity = {
        make: request.vehicle.make,
        model: request.vehicle.model,
        year: request.vehicle.year,
      };
      const top3 = diagnosis.causes.slice(0, 3).map((c) => ({
        id: c.id,
        title: c.title,
        category: c.category,
        confidence: c.confidence,
      }));
      let ownerContext: string | null = null;
      try {
        const repo = getGarageRepository();
        const saved = findSavedVehicle(await repo.listVehicles(), identity);
        setMatchedVehicle(saved);

        if (saved) {
          const priorScans = await repo.listScans(saved.id);
          const rec = detectRecurrence(
            { contexts: request.contexts, topCauses: top3 },
            priorScans
          );
          setRecurrence(rec);
          if (rec) ownerContext = buildOwnerContext(rec);
        }

        const scan = await repo.appendScan({
          vehicleId: saved?.id ?? null,
          symptomText: request.symptomText,
          contexts: request.contexts,
          topCauses: top3,
          overall: {
            severity: diagnosis.overall.severity,
            urgency: diagnosis.overall.urgency,
            safeToDrive: diagnosis.overall.safeToDrive,
            verdict: diagnosis.overall.verdict,
          },
          mode: diagnosis.mode,
        });
        setCurrentScanId(scan.id);
        setCurrentScanAt(scan.createdAt);
      } catch {
        /* storage unavailable — personalization is optional */
      }

      // Fetch the prose explanation in the background so it fills in without
      // holding up the ranking. Failure leaves the heuristic result as-is.
      if (
        aiStatus.aiConfigured &&
        diagnosis.mode === "heuristic" &&
        diagnosis.causes.length > 0
      ) {
        setExplaining(true);
        requestExplanation(request, diagnosis, ownerContext)
          .then(setResult)
          .catch(() => {
            /* keep the heuristic result */
          })
          .finally(() => setExplaining(false));
      }
    } catch (err) {
      setPhase("form");
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    }
  };

  const pickSavedVehicle = (v: SavedVehicle) => {
    setVehicle({
      make: v.make,
      model: v.model,
      year: String(v.year),
      mileage: v.mileage != null ? String(v.mileage) : "",
      engineType: v.engineType,
    });
  };

  const updateSavedMileage = (id: string, mileage: number | null) => {
    void updateVehicle(id, { mileage });
  };

  const saveCurrentVehicle = async () => {
    if (matchedVehicle || savingVehicle) return;
    setSavingVehicle(true);
    try {
      const saved = await saveVehicle({
        make: vehicle.make.trim(),
        model: vehicle.model.trim(),
        year: yearNum,
        mileage: vehicle.mileage.trim() ? Math.round(Number(vehicle.mileage)) : null,
        engineType: vehicle.engineType,
        nickname: null,
        lastScanAt: currentScanAt ?? new Date().toISOString(),
      });
      setMatchedVehicle(saved);
      // Link the scan we just recorded so it shows under the vehicle's history
      // (and future scans can detect a recurrence against it).
      if (currentScanId) {
        await getGarageRepository().updateScan(currentScanId, {
          vehicleId: saved.id,
        });
      }
    } catch {
      /* saving is best-effort; leave the affordance in place to retry */
    } finally {
      setSavingVehicle(false);
    }
  };

  const reset = () => {
    if (audio?.objectUrl) URL.revokeObjectURL(audio.objectUrl);
    setAudio(null);
    setVehicle(EMPTY_VEHICLE);
    setSymptomText("");
    setContexts([]);
    setResult(null);
    setExplaining(false);
    setSubmitError(null);
    setMatchedVehicle(null);
    setCurrentScanId(null);
    setCurrentScanAt(null);
    setRecurrence(null);
    setVehicleHistory(null);
    setStep(0);
    setPhase("form");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (phase === "scanning") {
    return (
      <div className="flex min-h-[60vh] items-center">
        <ScanningOverlay aiConfigured={aiStatus.aiConfigured} />
      </div>
    );
  }

  if (phase === "results" && result) {
    return (
      <ResultsView
        result={result}
        explaining={explaining}
        onReset={reset}
        personalization={{
          savedVehicle: matchedVehicle,
          onSaveVehicle: () => void saveCurrentVehicle(),
          saving: savingVehicle,
          recurrence,
          recalls: vehicleHistory?.recalls ?? [],
          priors: vehicleHistory?.priors ?? null,
        }}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* Step indicator */}
      <div className="mb-8 flex items-center justify-between gap-2">
        <div className="flex flex-1 items-center gap-2">
          {STEPS.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                // Allow jumping back freely; forward only through valid steps.
                if (i < step || stepValid.slice(step, i).every(Boolean)) setStep(i);
              }}
              className="group flex flex-1 flex-col gap-1.5"
            >
              <span
                className={`h-1 w-full rounded-full transition-colors ${
                  i < step
                    ? "bg-amber-500/70"
                    : i === step
                      ? "bg-gradient-to-r from-amber-400 to-orange-500"
                      : "bg-white/10"
                }`}
              />
              <span
                className={`text-left text-xs transition-colors ${
                  i === step ? "font-semibold text-amber-300" : "text-zinc-400"
                }`}
              >
                {label}
              </span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={loadDemo}
          className="ml-3 flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-zinc-400 transition-colors hover:border-amber-400/30 hover:text-amber-200"
          title="Prefill the clicking-while-turning demo scenario"
        >
          <FlaskConical className="h-3.5 w-3.5" /> Demo
        </button>
      </div>

      {/* Step body */}
      <div className="glass-strong rounded-3xl p-6 sm:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
          >
            {step === 0 && <AudioStep audio={audio} onAudioChange={setAudio} />}
            {step === 1 && (
              <VehicleStep
                vehicle={vehicle}
                onChange={setVehicle}
                savedVehicles={vehicles}
                onPickSaved={pickSavedVehicle}
                onUpdateSavedMileage={updateSavedMileage}
              />
            )}
            {step === 2 && (
              <SymptomStep
                symptomText={symptomText}
                contexts={contexts}
                onSymptomChange={setSymptomText}
                onContextsChange={setContexts}
              />
            )}
            {step === 3 && (
              <ReviewStep
                audio={audio}
                vehicle={vehicle}
                symptomText={symptomText}
                contexts={contexts}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {submitError && (
          <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {submitError}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-5">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="flex min-h-11 items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-zinc-400 transition-colors hover:bg-white/5 hover:text-white disabled:invisible"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!stepValid[step]}
              className="flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-2.5 text-sm font-semibold text-ink-950 shadow-[0_0_24px_-8px_rgba(245,158,11,0.7)] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void submit()}
              disabled={!canSubmit}
              className="flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-7 py-2.5 text-sm font-semibold text-ink-950 shadow-[0_0_28px_-8px_rgba(245,158,11,0.8)] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            >
              <Play className="h-4 w-4 fill-current" /> Run diagnosis
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
