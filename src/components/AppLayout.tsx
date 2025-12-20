"use client";

import BottomNav from "./BottomNav";

interface AppLayoutProps {
    children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
    return (
        <div className="desktop-body w-full">
            {/* FULL WIDTH FRAME */}
            <div className="w-full h-[100dvh] bg-[#0B0F17] relative flex flex-col overflow-hidden">

                {/* Scrollable Content Area */}
                <main className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
                    {children}

                    {/* Spacer for Bottom Nav (since it overlays or sits at bottom?) 
                        Actually, if we flex-col, Nav can be a block element at bottom.
                    */}
                    <div className="h-24" />
                </main>

                {/* Bottom Nav - Natural Flow or Sticky inside frame */}
                <div className="absolute bottom-0 left-0 right-0 z-50">
                    <BottomNav />
                </div>
            </div>
        </div>
    );
}
