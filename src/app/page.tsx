import { Metadata } from "next";
import { LandingHero, FeaturesGrid, HowItWorks, LandingFooter } from "@/components/landing/LandingSections";
import { METADATA } from "~/lib/utils";

export const metadata: Metadata = {
  title: "Base Cartel - Rule The Chain",
  description: "A social onchain cartel game built on Base. Join the cartel, raid rivals, and earn daily dividends.",
  openGraph: {
    title: "Base Cartel - Rule The Chain",
    description: "A social onchain cartel game built on Base. Join the cartel, raid rivals, and earn daily dividends.",
    images: [METADATA.bannerImageUrl],
  },
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0B0E12] text-white selection:bg-[#3DFF72] selection:text-black">
      <LandingHero />
      <FeaturesGrid />

      {/* Visual Break / Quote */}
      <section className="py-20 text-center px-4">
        <p className="text-2xl md:text-4xl font-serif italic text-zinc-500 opacity-50">
          "Plata o Plomo."
        </p>
      </section>

      <HowItWorks />

      {/* Screenshots Section (Placeholder as requested) */}
      <section className="py-24 px-4 bg-zinc-950/30">
        <div className="max-w-6xl mx-auto text-center mb-12">
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Interface</h2>
          <h3 className="text-3xl font-bold text-white">PROVEN GAME LOOP</h3>
        </div>
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 opacity-50 hover:opacity-100 transition-opacity duration-500">
          {/* Simple visual placeholders using CSS patterns since we don't have images yet */}
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[9/19] bg-zinc-900 rounded-xl border border-zinc-800 flex items-center justify-center p-4">
              <div className="text-zinc-700 text-xs font-mono">SCREEN {i}</div>
            </div>
          ))}
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}
