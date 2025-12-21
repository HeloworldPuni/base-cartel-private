import { Metadata } from "next";
import { METADATA } from "~/lib/utils";
import FullLandingPage from "@/components/landing/FullLandingPage";
import MobileLandingPage from "@/components/landing/MobileLandingPage";

export const metadata: Metadata = {
  title: "Base Cartel | The Onchain Social Game",
  description: "Join the Cartel. Build your empire. Earn real yield on Base.",
  openGraph: {
    title: "Base Cartel | Rule The Chain",
    description: "A social strategy game built on Base. Raid rivals, build clans, and earn daily ETH dividends.",
    images: ["https://basecartel.in/opengraph-image.png"],
  },
  other: {
    "fc:frame": JSON.stringify({
      version: "1",
      imageUrl: "https://basecartel.in/opengraph-image.png",
      button: {
        title: "Join The Cartel",
        action: {
          type: "launch_frame",
          name: "Base Cartel",
          url: "https://basecartel.in",
          splashImageUrl: "https://basecartel.in/icon.png",
          splashBackgroundColor: "#000000",
        },
      },
    }),
  },
};

export default function LandingPage() {
  return (
    <>
      <div className="md:hidden">
        <MobileLandingPage />
      </div>
      <div className="hidden md:block">
        <FullLandingPage />
      </div>
    </>
  );
}
