"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
    { href: "/dashboard", label: "Home", icon: "🏠" },
    { href: "/leaderboard", label: "Rank", icon: "🏆" },
    { href: "/leaderboard", label: "Rank", icon: "🏆" },
    { href: "/clans", label: "Clans", icon: "⚔️" },
    { href: "/quests", label: "Quests", icon: "📜" },
    { href: "/profile", label: "Profile", icon: "👤" },
];

export default function BottomNav() {
    const pathname = usePathname();

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0B0F17]/95 backdrop-blur-lg border-t border-[#262A33] z-50 pb-safe">
            <div className="flex justify-around items-center h-16 max-w-md mx-auto">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-200",
                                isActive ? "text-[#3B82F6]" : "text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            <span className={cn("text-2xl", isActive && "drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]")}>
                                {item.icon}
                            </span>
                            <span className={cn("text-[10px] font-medium tracking-wide", isActive ? "opacity-100" : "opacity-70")}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
