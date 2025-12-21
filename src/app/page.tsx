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
    version: "1",
    imageUrl: METADATA.bannerImageUrl,
    button: {
      title: "Join The Cartel",
      action: {
        type: "launch_frame",
        name: METADATA.name,
        url: METADATA.homeUrl,
        splashImageUrl: METADATA.iconImageUrl,
        splashBackgroundColor: METADATA.splashBackgroundColor,
      },
    },
  }),
},
};

export default function LandingPage() {
  return <FullLandingPage />;
}
