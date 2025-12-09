"use client";

import { motion } from "framer-motion";
import { fadeUp, staggerList } from "@/components/ui/motionTokens";
import { StatCard } from "@/components/ui/StatCard";
import { ClaimButton } from "@/components/ui/ClaimButton";
import { Badge } from "@/components/ui/badge";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import ActivityFeed from "../ActivityFeed"; // Real activity feed can probably render if it mocks API?
import AutoAgentPanel from "@/components/agent/AutoAgentPanel";
import { haptics } from "@/lib/haptics";
import { playSound } from "@/lib/audio";
import { useState } from "react";

// Mock Data
const MOCK_SHARES = 500;
const MOCK_RANK = 4;
const MOCK_POT = 1_250_000;
const MOCK_PROFIT = 4_250.00;
const MOCK_REVENUE = 8_500;

export default function MockDashboard() {
    const [isClaiming, setIsClaiming] = useState(false);

    const handleClaim = () => {
        setIsClaiming(true);
        setTimeout(() => setIsClaiming(false), 2000);
    };

    // Placeholder Stagger
    const stagger = {
        animate: { transition: { staggerChildren: 0.08 } }
    };

    return (
        <motion.div
            initial="initial"
            animate="animate"
            className="min-h-screen bg-[#0B0E12] text-white p-4 space-y-6 max-w-[400px] mx-auto pb-24 relative overflow-hidden"
        >
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none" />
            <div className="absolute top-10 right-[-20px] text-9xl opacity-[0.03] pointer-events-none rotate-12">🎩</div>

            {/* HERO HEADER */}
            {/* HERO HEADER */}
            <motion.header variants={fadeUp} className="flex flex-col items-center pt-6 pb-4 relative z-10 w-full">
                <div className="relative mb-2">
                    <span className="text-6xl filter drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]">🎩</span>
                    <motion.div
                        animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.2, 1] }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="absolute inset-0 bg-[#D4AF37] blur-2xl opacity-20 rounded-full"
                    />
                </div>
                
                <div className="flex items-center justify-center gap-3 w-full px-8">
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent" />
                    <Badge variant="outline" className="bg-[#1A1D26] text-[#D4AF37] border-[#D4AF37]/30 text-[10px] tracking-wider uppercase px-3 py-1 shadow-[0_0_10px_rgba(212,175,55,0.1)]">
                        Season 1 • Live
                    </Badge>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent" />
                </div>
                
                <h2 className="text-zinc-500 text-[10px] font-mono tracking-[0.2em] mt-3 uppercase opacity-70">Empire Earnings Today</h2>
            </motion.header>

            {/* STATS GRID */}
            <motion.div variants={stagger} className="grid grid-cols-2 gap-3">

                {/* Shares */}
                <motion.div variants={fadeUp}>
                    <StatCard className="h-full border-[#D4AF37]/20 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 to-transparent opacity-100" />
                        <CardHeader className="p-0 pb-1">
                            <CardTitle className="text-[10px] text-zinc-400 font-medium uppercase tracking-wide">Your Shares</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="text-2xl font-black text-white">{MOCK_SHARES}</div>
                            <p className="text-[10px] text-zinc-500">Global Rank #{MOCK_RANK}</p>
                        </CardContent>
                    </StatCard>
                </motion.div>

                {/* Pot */}
                <motion.div variants={fadeUp}>
                    <StatCard className="h-full border-[#3B82F6]/20 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#3B82F6]/5 to-transparent opacity-100" />
                        <CardHeader className="p-0 pb-1">
                            <CardTitle className="text-[10px] text-zinc-400 font-medium uppercase tracking-wide">Cartel Pot</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="text-2xl font-black text-white">${MOCK_POT.toLocaleString()}</div>
                            <p className="text-[10px] text-zinc-500">USDC Vault</p>
                        </CardContent>
                    </StatCard>
                </motion.div>

                {/* Earnings */}
                <motion.div variants={fadeUp} className="col-span-2">
                    <StatCard className="border-[#4FF0E6]/20 relative overflow-hidden group flex items-center justify-between px-4 py-3">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#4FF0E6]/5 to-transparent opacity-100" />
                        <div>
                            <div className="text-[10px] text-zinc-400 font-medium uppercase tracking-wide">Cartel 24h Revenue</div>
                            <div className="text-2xl font-black text-[#4FF0E6]">${MOCK_REVENUE.toLocaleString()}</div>
                        </div>
                        <div className="text-2xl opacity-100 grayscale-0">📊</div>
                    </StatCard>
                </motion.div>

                {/* Your Cut */}
                <motion.div variants={fadeUp} className="col-span-2">
                    <StatCard className="border-[#3DFF72]/30 bg-gradient-to-b from-[#3DFF72]/5 to-transparent">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="text-xs text-[#3DFF72] font-bold uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#3DFF72] animate-pulse" />
                                    Your Cut
                                </h3>
                                <p className="text-[10px] text-zinc-400">Claimable Dividends</p>
                            </div>
                        </div>

                        <div className="flex justify-between items-end">
                            <div className="text-4xl font-black text-white tracking-tight">
                                <span className="text-[#3DFF72]">$</span>{MOCK_PROFIT.toLocaleString()}
                            </div>
                            <ClaimButton
                                onClick={handleClaim}
                                disabled={isClaiming}
                                className="h-9 min-w-[100px] px-4 text-xs font-bold bg-[#3DFF72] text-black shadow-[0_0_15px_rgba(61,255,114,0.4)]"
                            >
                                {isClaiming ? "CLAIMING..." : "CLAIM"}
                            </ClaimButton>
                        </div>
                    </StatCard>
                </motion.div>
            </motion.div>

            {/* ACTION BUTTONS (Visual Only) */}
            <motion.div variants={stagger} className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center justify-center h-24 rounded-xl bg-[#1A1111] border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                    <span className="text-3xl mb-1">⚔️</span>
                    <span className="text-[10px] font-bold text-red-500 tracking-wider uppercase">Raid</span>
                </div>
                <div className="flex flex-col items-center justify-center h-24 rounded-xl bg-[#0F131E] border border-[#3B82F6]/30 shadow-[0_0_10px_rgba(59,130,246,0.1)]">
                    <span className="text-3xl mb-1">🧬</span>
                    <span className="text-[10px] font-bold text-[#3B82F6] tracking-wider uppercase">Clan</span>
                </div>
                <div className="flex flex-col items-center justify-center h-24 rounded-xl bg-[#160B0B] border border-red-900/30">
                    <span className="text-3xl mb-1">🩸</span>
                    <span className="text-[10px] font-bold text-red-700 tracking-wider uppercase">Betray</span>
                </div>
            </motion.div>

            {/* Mock Activity Feed (Static) */}
            <motion.div variants={fadeUp} className="space-y-3">
                <div className="flex justify-between items-center px-1">
                    <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Live Wire</h2>
                </div>
                <div className="space-y-2">
                    <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800 flex items-center gap-3">
                        <span className="text-xl">💰</span>
                        <div className="flex-1">
                            <div className="text-xs text-zinc-300"><span className="text-[#3DFF72] font-bold">You</span> claimed <span className="text-white font-bold">$1,250</span></div>
                            <div className="text-[10px] text-zinc-600">2 min ago</div>
                        </div>
                    </div>
                    <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800 flex items-center gap-3">
                        <span className="text-xl">⚔️</span>
                        <div className="flex-1">
                            <div className="text-xs text-zinc-300"><span className="text-red-500 font-bold">Pablo_E</span> raided <span className="text-white font-bold">El_Chapo</span></div>
                            <div className="text-[10px] text-zinc-600">5 min ago</div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
