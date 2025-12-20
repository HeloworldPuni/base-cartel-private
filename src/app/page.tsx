import { Metadata } from "next";
import { METADATA } from "~/lib/utils";
import FullLandingPage from "@/components/landing/FullLandingPage";

export const metadata: Metadata = {
  title: "Base Cartel - Rule The Chain",
  description: "A social onchain cartel game built on Base. Join the cartel, raid rivals, and earn daily dividends.",
  openGraph: {
    title: "Base Cartel - Rule The Chain",
    description: "A social onchain cartel game built on Base. Join the cartel, raid rivals, and earn daily dividends.",
    images: [METADATA.bannerImageUrl],
  },
  other: {
    "fc:miniapp": JSON.stringify({
      version: "1",
      imageUrl: METADATA.bannerImageUrl,
      button: {
        title: "Join The Cartel",
        action: {
          type: "launch_miniapp",
          name: METADATA.name,
          url: METADATA.homeUrl,
          splashImageUrl: METADATA.iconImageUrl,
          splashBackgroundColor: METADATA.splashBackgroundColor,
        },
      },
    }),
    "fc:frame": JSON.stringify({
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
