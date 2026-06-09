import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/landing/Hero";
import {
  DemoCallout,
  Features,
  HowItWorks,
  SafetySection,
} from "@/components/landing/Sections";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <DemoCallout />
        <Features />
        <SafetySection />
      </main>
      <Footer />
    </div>
  );
}
