import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export const METADATA = {
  name: "Base Cartel",
  description: "An onchain social strategy game on Base. Join the cartel, raid, betray, and earn yield.",
  bannerImageUrl: "https://www.basecartel.in/banner.png",
  iconImageUrl: "https://www.basecartel.in/icon.png",
  homeUrl: "https://www.basecartel.in",
  splashBackgroundColor: "#000000"
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
