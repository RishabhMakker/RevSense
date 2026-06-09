import type { DiagnoseRequest, DiagnosisResult } from "@revsense/backend";

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
