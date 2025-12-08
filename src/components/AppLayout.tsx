"use client";

import BottomNav from "./BottomNav";

interface AppLayoutProps {
    children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
    return (
        <div className="min-h-screen bg-[#0B0F17] flex flex-col">
            <main className="flex-1 pb-20">
                {children}
            </main>
            <BottomNav />
        </div>
    );
}
