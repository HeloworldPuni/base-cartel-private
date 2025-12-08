"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

// Mock version of the Profile Page logic for visibility testing
export default function TestProfilePage() {
    // Hardcoded "Data" to simulate a connected user with a Basename
    const address = "0x1234567890123456789012345678901234567890";
    const ensName = "testuser.base.eth";
    const displayName = ensName; // Logic: ensName || address
    const displaySubtext = address;

    const displayAvatar = null; // Test fallback avatar

    return (
        <div className="min-h-screen bg-[#0B0E12] text-white p-4 space-y-6 max-w-[400px] mx-auto">
            <header className="pt-2 flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-black heading-font text-neon-blue">PROFILE (TEST)</h1>
                    <p className="text-sm text-zinc-400">Visibility Check</p>
                </div>
                <Button variant="destructive" size="sm">Disconnect</Button>
            </header>

            {/* THE CARD WE ARE DEBUGGING */}
            <Card className="card-glow border-zinc-700">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="bg-transparent border-none p-0 flex flex-row items-center gap-4 w-full">
                        <div className="w-16 h-16 rounded-full border-2 border-[#4A87FF] bg-zinc-800 flex items-center justify-center">
                            <span className="text-2xl">👤</span>
                        </div>

                        <div className="flex flex-col">
                            {/* THE TEXT THAT WAS INVISIBLE */}
                            <div
                                className="font-bold text-lg heading-font text-white"
                                style={{ textShadow: '0 0 10px rgba(255,255,255,0.5)' }}
                                id="test-display-name"
                            >
                                {displayName}
                            </div>

                            <div className="text-xs text-zinc-500 font-mono" id="test-subtext">
                                {displaySubtext}
                            </div>

                            <div className="text-[10px] text-red-500 mt-1 font-mono" id="test-debug">
                                DEBUG: {address.slice(0, 6)} | ENS: {ensName}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
