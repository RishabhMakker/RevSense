import { Suspense } from "react";
import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { DiagnoseWizard } from "@/components/diagnose/DiagnoseWizard";

export const metadata: Metadata = {
  title: "Diagnose a sound — RevSense",
  description:
    "Record or upload your car's noise, describe the symptom, and get a ranked triage of likely causes.",
};

export default async function DiagnosePage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  const params = await searchParams;
  const demo = params.demo === "1";

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 px-4 pb-24 pt-32 sm:px-6">
        <Suspense fallback={null}>
          <DiagnoseWizard demo={demo} />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
