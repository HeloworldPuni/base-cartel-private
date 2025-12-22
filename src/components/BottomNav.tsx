"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Trophy, ScrollText, User } from "lucide-react";

const NAV_ITEMS = [
    { href: "/dashboard", label: "Home", Icon: Home },
    { href: "/leaderboard", label: "Rank", Icon: Trophy },
    { href: "/quests", label: "Quests", Icon: ScrollText },
    { href: "/profile", label: "Profile", Icon: User },
];

export default function BottomNav() {
    const pathname = usePathname();

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#060813]/90 backdrop-blur-xl border-t border-white/10 pb-safe">
            <div className="flex justify-around items-center h-20 w-full max-w-2xl mx-auto px-4 pb-2">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.Icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-300",
                                isActive ? "text-[#FFD700]" : "text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            <div className={cn(
                                "relative p-2 rounded-xl transition-all duration-300",
                                isActive && "bg-[#FFD700]/10"
                            )}>
                                <Icon
                                    strokeWidth={isActive ? 2.5 : 2}
                                    className={cn(
                                        "w-6 h-6 transition-all duration-300",
                                        isActive
                                            ? "drop-shadow-[0_0_8px_rgba(255,215,0,0.6)] scale-110"
                                            : "opacity-70"
                                    )}
                                    // Optional: Fill active icons for that "bold" look
                                    fill={isActive ? "currentColor" : "none"}
                                />
                            </div>
                            <span className={cn(
                                "text-[10px] font-bold tracking-wide font-display transition-all duration-300",
                                isActive ? "opacity-100 translate-y-0" : "opacity-70 translate-y-0.5"
                            )}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
