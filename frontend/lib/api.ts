import type {
  DiagnoseRequest,
  DiagnosisResult,
  VehiclePriors,
} from "@revsense/backend";

export async function requestDiagnosis(
  req: DiagnoseRequest
): Promise<DiagnosisResult> {
  const res = await fetch("/api/diagnose", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    let message = "The diagnosis request failed. Please try again.";
    try {
      const body = (await res.json()) as {
        error?: string;
        issues?: { path: string; message: string }[];
      };
      if (body.issues?.length) {
        message = body.issues
          .map((i) => (i.path ? `${i.path}: ${i.message}` : i.message))
          .join(" · ");
      } else if (body.error) {
        message = body.error;
      }
    } catch {
      // keep generic message
    }
    throw new Error(message);
  }
  return (await res.json()) as DiagnosisResult;
}

/**
 * Second-stage call: ask the AI to rewrite explanations for an already-ranked
 * result. Runs in the background after the diagnosis renders. On any failure the
 * caller keeps the heuristic result, so this throws freely.
 *
 * `ownerContext` is an optional one-line history note (e.g. a recurring noise on
 * a saved vehicle) the AI can weave into its prose. It's sent as a top-level
 * field the API ignores until it supports it, so passing it is always safe.
 */
export async function requestExplanation(
  req: DiagnoseRequest,
  result: DiagnosisResult,
  ownerContext?: string | null
): Promise<DiagnosisResult> {
  const res = await fetch("/api/explain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      request: req,
      result,
      ownerContext: ownerContext ?? null,
    }),
  });
  if (!res.ok) throw new Error("Explanation request failed.");
  return (await res.json()) as DiagnosisResult;
}

export interface RecallNotice {
  component: string;
  summary: string;
  consequence: string;
}

export interface VehicleHistory {
  priors: VehiclePriors | null;
  recalls: RecallNotice[];
}

/**
 * Vehicle-specific reported-issue + recall data for a make/model/year. Always
 * resolves (never throws): any failure yields empty history so a diagnosis is
 * never blocked or slowed by it.
 */
export async function fetchVehicleHistory(
  make: string,
  model: string,
  year: number
): Promise<VehicleHistory> {
  try {
    const res = await fetch(
      `/api/vehicle-history?make=${encodeURIComponent(
        make
      )}&model=${encodeURIComponent(model)}&year=${encodeURIComponent(
        String(year)
      )}`
    );
    if (!res.ok) return { priors: null, recalls: [] };
    const body = (await res.json()) as VehicleHistory;
    return {
      priors: body.priors ?? null,
      recalls: Array.isArray(body.recalls) ? body.recalls : [],
    };
  } catch {
    return { priors: null, recalls: [] };
  }
}

export interface AIStatus {
  aiConfigured: boolean;
  aiProviderLabel: string | null;
}

export async function fetchAIStatus(): Promise<AIStatus> {
  try {
    const res = await fetch("/api/status");
    if (!res.ok) return { aiConfigured: false, aiProviderLabel: null };
    const body = (await res.json()) as AIStatus;
    return {
      aiConfigured: Boolean(body.aiConfigured),
      aiProviderLabel: body.aiProviderLabel ?? null,
    };
  } catch {
    return { aiConfigured: false, aiProviderLabel: null };
  }
}
