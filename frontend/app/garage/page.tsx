import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { GarageView } from "@/components/garage/GarageView";

export const metadata: Metadata = {
  title: "Your garage — RevSense",
  description:
    "Your saved vehicles and past diagnoses, kept on your device for a faster, more personal start next time.",
};

export default function GaragePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 px-4 pb-24 pt-32 sm:px-6">
        <GarageView />
      </main>
      <Footer />
    </div>
  );
}
