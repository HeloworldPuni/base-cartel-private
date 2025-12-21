"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
    { href: "/dashboard", label: "Home", icon: "https://raw.createusercontent.com/912711b4-2426-4697-8c5c-e64255c8d5e2/" },
    { href: "/leaderboard", label: "Rank", icon: "https://raw.createusercontent.com/1afeeb38-cb92-46d1-a6e7-cebff1aa2a70/" },
    { href: "/quests", label: "Quests", icon: "https://raw.createusercontent.com/5bcd8f59-3702-4ba2-a92c-e0570ecde617/" },
    { href: "/profile", label: "Profile", icon: "https://raw.createusercontent.com/06da9d32-b959-4d32-9fe5-95d26814ddb7/" },
];

export default function BottomNav() {
    const pathname = usePathname();

    return (
        <div className="bg-[#0B0F17]/95 backdrop-blur-lg border-t border-[#262A33] pb-safe w-full">
            <div className="flex justify-around items-center h-16 w-full max-w-2xl mx-auto px-4">
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
                            <img
                                src={item.icon}
                                alt={item.label}
                                className={cn("w-7 h-7 object-contain transition-all duration-200", isActive ? "brightness(110%) drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" : "brightness-75 opacity-70")}
                            />
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
