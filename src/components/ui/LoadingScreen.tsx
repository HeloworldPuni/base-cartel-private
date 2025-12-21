"use client";

import React from "react";

export default function LoadingScreen() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0F17]">
            <div className="flex flex-col items-center animate-pulse">
                <img
                    src="https://raw.createusercontent.com/e124f442-2805-4811-86dd-03e89202dfc9/"
                    alt="Loading..."
                    className="w-24 h-24 mb-4 hue-rotate-180"
                />
                <div className="text-[#4FF0E6] font-mono text-xs tracking-[0.3em] uppercase">
                    Loading Cartel Data...
                </div>
            </div>
        </div>
    );
}
