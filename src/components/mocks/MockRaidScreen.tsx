"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function MockRaidScreen() {
    const targets = [
        { name: "Rival_Cartel_1", power: 850, risk: "High", loot: 5000 },
        { name: "Unknown_Soldier", power: 300, risk: "Low", loot: 1200 },
        { name: "Sinaloa_Operative", power: 600, risk: "Med", loot: 3400 },
    ];

    return (
        <div className="min-h-screen bg-black/90 flex items-center justify-center p-4">
            {/* Simulate Modal Open */}
            <motion.div
                initial={{ scale: 0.95, opacity: 1 }}
                className="w-full max-w-sm bg-[#1A0505] border border-red-900/50 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.2)]"
            >
                <div className="p-6 text-center border-b border-red-900/30 bg-red-950/20">
                    <h2 className="text-2xl font-black text-red-500 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                        RAID TARGETS
                    </h2>
                    <p className="text-xs text-red-400/60 mt-1">Select a rival to attack</p>
                </div>

                <div className="p-4 space-y-3">
                    {targets.map((target, i) => (
                        <div key={i} className="p-4 rounded-xl bg-[#2A0A0A] border border-red-900/30 flex items-center justify-between group hover:border-red-500/50 transition-colors">
                            <div>
                                <div className="font-bold text-red-200">{target.name}</div>
                                <div className="text-xs text-red-400/50 flex gap-2 mt-1">
                                    <span>💥 {target.power} Power</span>
                                    <span>💰 ${target.loot}</span>
                                </div>
                            </div>
                            <Button className="bg-red-600 hover:bg-red-700 text-white font-black text-xs h-8 px-4 shadow-[0_0_10px_rgba(220,38,38,0.4)]">
                                ATTACK
                            </Button>
                        </div>
                    ))}
                </div>

                <div className="p-4 bg-red-950/10 border-t border-red-900/30 text-center">
                    <p className="text-[10px] text-red-500/40 uppercase tracking-widest">
                        Warning: Retaliation likely
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
