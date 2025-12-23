"use client";

import React, { useState, useEffect } from "react";
import { Crown, Zap, TrendingUp, Swords, Flame, Users, Shield, Copy, Target, Trophy, Activity } from "lucide-react";

// Components
import RaidModal from "@/components/RaidModal";
import BetrayModal from "@/components/BetrayModal";
import MostWantedList from "./MostWantedList";
import ActivityFeed from "./ActivityFeed";

// Wagmi & Data
import { useReadContracts } from 'wagmi';
import { formatUnits } from 'viem';
import CartelPotABI from '@/lib/abi/CartelPot.json';
import CartelSharesABI from '@/lib/abi/CartelShares.json';


interface CartelDashboardProps {
    address?: string;
}

export default function CartelDashboard({ address }: CartelDashboardProps) {
    // --- STATE ---
    const [revenue24h, setRevenue24h] = useState<number>(0);
    const [isRaidModalOpen, setIsRaidModalOpen] = useState(false);
    const [isBetrayModalOpen, setIsBetrayModalOpen] = useState(false);

    // --- CONTRACT ADDRESSES ---
    const POT_ADDRESS = process.env.NEXT_PUBLIC_CARTEL_POT_ADDRESS as `0x${string}`;
    const SHARES_ADDRESS = process.env.NEXT_PUBLIC_CARTEL_SHARES_ADDRESS as `0x${string}`;

    // --- ON-CHAIN READS ---
    const { data: contractData, refetch } = useReadContracts({
        contracts: [
            {
                address: SHARES_ADDRESS,
                abi: CartelSharesABI,
                functionName: 'balanceOf',
                args: address ? [address, 1n] : undefined // Token ID 1
            },
            {
                address: POT_ADDRESS,
                abi: CartelPotABI,
                functionName: 'getBalance',
            },
            {
                address: SHARES_ADDRESS,
                abi: CartelSharesABI,
                functionName: 'totalSupply',
                args: [1n]
            }
        ],
        query: {
            enabled: !!address,
            staleTime: 5000
        }
    });

    // Parse Data (Safe Fallbacks)
    const shares = contractData?.[0]?.result
        ? Number(contractData[0].result)
        : 0;

    const potBalance = contractData?.[1]?.result
        ? Number(formatUnits(contractData[1].result as bigint, 6))
        : 0;

    const totalShares = contractData?.[2]?.result
        ? Number(contractData[2].result)
        : 1;

    // Calculate Claimable: (User Shares / Total Shares) * Pot Balance
    const claimable = totalShares > 0 ? (shares / totalShares) * potBalance : 0;

    // DEBUG: Trace where the number comes from
    useEffect(() => {
        if (contractData) {
            console.log("--- CARTEL DASHBOARD DEBUG ---");
            console.log("Shares (Index 0):", shares);
            console.log("Pot Balance (Index 1):", potBalance);
            console.log("Total Shares (Index 2):", totalShares);
            console.log("Calculated Claimable:", claimable);
            console.log("Raw Contract Data:", contractData);
            console.log("------------------------------");
        }
    }, [contractData, shares, potBalance, totalShares, claimable]);

    // --- OFF-CHAIN READS ---
    const [userRank, setUserRank] = useState<number>(0);

    // --- OFF-CHAIN READS ---
    useEffect(() => {
        // 1. Fetch Revenue
        fetch('/api/cartel/revenue/summary')
            .then(res => res.json())
            .then(data => {
                if (data.revenue24h) setRevenue24h(data.revenue24h);
            })
            .catch(err => console.error("Failed to fetch revenue", err));

        // 2. Fetch User Summary (Rank)
        if (address) {
            fetch(`/api/cartel/me/summary?address=${address}`)
                .then(res => res.json())
                .then(data => {
                    if (data.rank) setUserRank(data.rank);
                })
                .catch(err => console.error("Failed to fetch rank", err));
        }
    }, [address]);

    const handleRaidClick = () => {
        setIsRaidModalOpen(true);
    };

    const handleModalClose = () => {
        setIsRaidModalOpen(false);
        // Optimistic/Lazy refetch on close to see updated stats
        refetch();
    };

    const [showCopied, setShowCopied] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleCopyAddress = () => {
        if (address) {
            navigator.clipboard.writeText(address);
            setShowCopied(true);
            setTimeout(() => setShowCopied(false), 2000);
        }
    };

    return (
        <div className="min-h-screen bg-transparent text-white w-full overflow-x-hidden relative">
            {/* Animated Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 opacity-10 mafia-pattern"></div>
                <div
                    className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#0066FF] rounded-full opacity-10 blur-3xl"
                    style={{ animation: "float 20s ease-in-out infinite" }}
                ></div>
                <div
                    className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#00D4FF] rounded-full opacity-10 blur-3xl"
                    style={{ animation: "float 25s ease-in-out infinite reverse" }}
                ></div>
                <div
                    className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-[#FF0066] rounded-full opacity-5 blur-3xl"
                    style={{ animation: "float 30s ease-in-out infinite" }}
                ></div>
            </div>

            {/* Top Header */}
            <div className="relative z-10 w-full mb-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                        <div className="relative w-12 h-12">
                            <img
                                src="https://raw.createusercontent.com/e124f442-2805-4811-86dd-03e89202dfc9/"
                                alt="Logo"
                                className="w-full h-full hue-rotate-180 object-contain drop-shadow-[0_0_10px_rgba(74,135,255,0.5)]"
                            />
                        </div>
                        <div>
                            <h1
                                className="text-3xl font-bold bg-gradient-to-r from-[#0066FF] via-[#00D4FF] to-[#0066FF] bg-clip-text text-transparent"
                                style={{
                                    backgroundSize: "200% auto",
                                    animation: "gradient-shift 3s ease infinite",
                                }}
                            >
                                BASE CARTEL
                            </h1>
                            <p className="text-xs text-gray-500 tracking-widest uppercase">
                                Rule The Chain
                            </p>
                        </div>
                    </div>
                    {address && (
                        <button
                            onClick={handleCopyAddress}
                            className="relative px-4 py-2 bg-[#0F172A]/50 backdrop-blur-xl border border-[#1E293B] rounded-lg hover:border-[#0066FF] transition-all duration-300 flex items-center space-x-2 group"
                        >
                            <span className="text-sm font-mono text-zinc-400">{address.slice(0, 6)}...{address.slice(-4)}</span>
                            <Copy
                                size={14}
                                className="group-hover:text-[#0066FF] transition-colors"
                            />
                            {showCopied && (
                                <span
                                    className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-[#0066FF] px-3 py-1 rounded-lg text-xs whitespace-nowrap"
                                    style={{ animation: "slideDown 0.3s ease-out" }}
                                >
                                    Copied!
                                </span>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Hero Stats Section */}
            <div className="relative z-10 w-full mb-8">
                <div
                    className="relative bg-gradient-to-br from-[#0F172A]/80 via-[#1E293B]/60 to-[#0F172A]/80 backdrop-blur-xl border border-[#1E293B] rounded-3xl p-8 overflow-hidden"
                    style={{ animation: mounted ? "scaleIn 0.6s ease-out" : "none" }}
                >
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#0066FF] opacity-5 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#00D4FF] opacity-5 rounded-full blur-3xl"></div>

                    <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Main Stat - Shares */}
                        <div className="md:col-span-1 flex flex-col justify-center items-center md:items-start text-center md:text-left border-b md:border-b-0 md:border-r border-[#1E293B] pb-8 md:pb-0 md:pr-8">
                            <div className="flex items-center space-x-2 mb-4">
                                <Crown className="text-[#FFD700]" size={32} />
                                <span className="text-xs px-3 py-1 bg-[#FFD700]/10 text-[#FFD700] rounded-full font-semibold">
                                    RANK #{userRank || '-'}
                                </span>
                            </div>
                            <div className="text-6xl font-bold mb-2 bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent">
                                {shares.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-400 uppercase tracking-wide">
                                Your Shares
                            </div>
                        </div>

                        {/* Cartel Pot */}
                        <div className="md:col-span-1 flex flex-col justify-center items-center md:items-start text-center md:text-left border-b md:border-b-0 md:border-r border-[#1E293B] pb-8 md:pb-0 md:pr-8">
                            <div className="flex items-center space-x-2 mb-4">
                                <Zap className="text-[#0066FF]" size={32} />
                                <span className="text-xs px-3 py-1 bg-[#0066FF]/10 text-[#0066FF] rounded-full font-semibold">
                                    USDC
                                </span>
                            </div>
                            <div className="text-5xl font-bold mb-2 text-white">
                                ${potBalance.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-400 uppercase tracking-wide">
                                Cartel Pot
                            </div>
                            <div className="mt-2 text-xs text-gray-500">
                                24h Revenue: ${revenue24h.toLocaleString()}
                            </div>
                        </div>

                        {/* Your Cut */}
                        <div className="md:col-span-1 flex flex-col justify-center items-center md:items-start text-center md:text-left">
                            <div className="flex items-center space-x-2 mb-4">
                                <TrendingUp className="text-[#00FF88]" size={32} />
                            </div>
                            <div className="text-5xl font-bold mb-2 text-[#00FF88]">
                                ${claimable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="text-sm text-gray-400 uppercase tracking-wide mb-4">
                                Claimable
                            </div>
                            <button className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-[#0066FF] to-[#00D4FF] rounded-xl font-semibold hover:shadow-lg hover:shadow-[#0066FF]/50 transition-all duration-300 hover:scale-105 text-white">
                                Claim Dividends
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <button
                    onClick={handleRaidClick}
                    className="group relative bg-gradient-to-br from-[#FF0066] via-[#CC0052] to-[#FF0066] backdrop-blur-xl border border-[#FF0066] rounded-2xl p-6 hover:shadow-xl hover:shadow-[#FF0066]/50 transition-all duration-300 hover:scale-105"
                    style={{
                        animation: mounted
                            ? "slideUp 0.5s ease-out 0.1s backwards"
                            : "none",
                    }}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#FF0066]/20 to-transparent rounded-2xl"></div>
                    <div className="relative flex items-center justify-between mb-3">
                        <Swords className="text-white" size={28} />
                        <div
                            className="w-2 h-2 bg-white rounded-full"
                            style={{ animation: "pulse 2s ease-in-out infinite" }}
                        ></div>
                    </div>
                    <div className="relative text-xl font-bold text-white text-left">Raid</div>
                    <div className="relative text-xs text-white/80 mt-1 text-left">
                        Attack rivals
                    </div>
                </button>

                <button
                    onClick={() => setIsBetrayModalOpen(true)}
                    className="group relative bg-gradient-to-br from-[#FF0066] via-[#CC0052] to-[#FF0066] backdrop-blur-xl border border-[#FF0066] rounded-2xl p-6 hover:shadow-xl hover:shadow-[#FF0066]/50 transition-all duration-300 hover:scale-105"
                    style={{
                        animation: mounted
                            ? "slideUp 0.5s ease-out 0.2s backwards"
                            : "none",
                    }}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#FF0066]/20 to-transparent rounded-2xl"></div>
                    <div className="relative flex items-center justify-between mb-3">
                        <Flame className="text-white" size={28} />
                        <div
                            className="w-2 h-2 bg-white rounded-full"
                            style={{ animation: "pulse 2s ease-in-out infinite 0.5s" }}
                        ></div>
                    </div>
                    <div className="relative text-xl font-bold text-white text-left">Betray</div>
                    <div className="relative text-xs text-white/80 mt-1 text-left">
                        High stakes
                    </div>
                </button>

                <button
                    onClick={() => window.location.href = '/clans'}
                    className="group relative bg-gradient-to-br from-[#00D4FF] via-[#0099CC] to-[#00D4FF] backdrop-blur-xl border border-[#00D4FF] rounded-2xl p-6 hover:shadow-xl hover:shadow-[#00D4FF]/50 transition-all duration-300 hover:scale-105"
                    style={{
                        animation: mounted
                            ? "slideUp 0.5s ease-out 0.3s backwards"
                            : "none",
                    }}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#00D4FF]/20 to-transparent rounded-2xl"></div>
                    <div className="relative flex items-center justify-between mb-3">
                        <Users className="text-white" size={28} />
                        {/* Mock Members for now or fetch? */}
                        <span className="text-xs px-2 py-1 bg-white/20 text-white rounded-full font-semibold">
                            CLAN
                        </span>
                    </div>
                    <div className="relative text-xl font-bold text-white text-left">Clan</div>
                    <div className="relative text-xs text-white/80 mt-1 text-left">
                        Join forces
                    </div>
                </button>

                <button
                    className="group relative bg-gradient-to-br from-[#FFD700] via-[#CCB000] to-[#FFD700] backdrop-blur-xl border border-[#FFD700] rounded-2xl p-6 hover:shadow-xl hover:shadow-[#FFD700]/50 transition-all duration-300 hover:scale-105 opacity-80"
                    style={{
                        animation: mounted
                            ? "slideUp 0.5s ease-out 0.4s backwards"
                            : "none",
                    }}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700]/20 to-transparent rounded-2xl"></div>
                    <div className="relative flex items-center justify-between mb-3">
                        <Shield className="text-white" size={28} />
                        <span className="text-xs px-2 py-1 bg-white/20 text-white rounded-full font-semibold">
                            BETA
                        </span>
                    </div>
                    <div className="relative text-xl font-bold text-white text-left">
                        Auto-Agent
                    </div>
                    <div className="relative text-xs text-white/80 mt-1 text-left">Deploy AI</div>
                </button>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Live Activity - Takes 2 columns */}
                <div className="lg:col-span-2">
                    <ActivityFeed />
                </div>

                {/* Right Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                    {/* Most Wanted Leaderboard */}
                    <MostWantedList />

                    {/* Quick Access */}
                    <div className="bg-[#0F172A]/40 backdrop-blur-xl border border-[#1E293B] rounded-2xl p-6">
                        <h3 className="text-lg font-bold mb-4 text-white">Quick Access</h3>
                        <div className="space-y-3">
                            <button onClick={() => window.location.href = '/leaderboard'} className="w-full group bg-gradient-to-r from-[#1E293B]/50 to-transparent border border-[#1E293B] rounded-xl px-4 py-3 text-left hover:border-[#0066FF] hover:from-[#0066FF]/10 transition-all duration-300 flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <span className="text-lg">🏆</span>
                                    <span className="text-sm font-medium text-zinc-300 group-hover:text-white">Leaderboard</span>
                                </div>
                                <div className="w-1.5 h-1.5 bg-[#0066FF] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </button>
                            <button onClick={() => window.location.href = '/quests'} className="w-full group bg-gradient-to-r from-[#1E293B]/50 to-transparent border border-[#1E293B] rounded-xl px-4 py-3 text-left hover:border-[#0066FF] hover:from-[#0066FF]/10 transition-all duration-300 flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <span className="text-lg">📜</span>
                                    <span className="text-sm font-medium text-zinc-300 group-hover:text-white">Quests</span>
                                </div>
                                <div className="w-1.5 h-1.5 bg-[#0066FF] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </button>
                            <button onClick={() => window.location.href = '/profile'} className="w-full group bg-gradient-to-r from-[#1E293B]/50 to-transparent border border-[#1E293B] rounded-xl px-4 py-3 text-left hover:border-[#0066FF] hover:from-[#0066FF]/10 transition-all duration-300 flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <span className="text-lg">👤</span>
                                    <span className="text-sm font-medium text-zinc-300 group-hover:text-white">Profile</span>
                                </div>
                                <div className="w-1.5 h-1.5 bg-[#0066FF] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </button>
                        </div>
                    </div>

                    {/* Stats Summary - Static for now based on design */}
                    <div className="relative bg-gradient-to-br from-[#0066FF]/20 via-[#00D4FF]/10 to-[#0066FF]/20 backdrop-blur-xl border border-[#0066FF]/40 rounded-2xl p-6 overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#0066FF] opacity-10 rounded-full blur-2xl"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#00D4FF] opacity-10 rounded-full blur-2xl"></div>

                        <h3 className="relative text-lg font-bold mb-4 flex items-center space-x-2 text-white">
                            <Target className="text-[#0066FF]" size={20} />
                            <span>Performance</span>
                        </h3>
                        <div className="relative space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-gray-400 uppercase tracking-wide">
                                        Win Rate
                                    </span>
                                    <span className="text-sm font-bold text-[#00FF88]">
                                        73%
                                    </span>
                                </div>
                                <div className="h-2 bg-[#1E293B] rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-[#00FF88] to-[#00D4FF] rounded-full shadow-lg shadow-[#00FF88]/50"
                                        style={{
                                            width: "73%",
                                            animation: "expandWidth 1s ease-out",
                                        }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODALS */}
            <RaidModal isOpen={isRaidModalOpen} onClose={handleModalClose} />
            <BetrayModal isOpen={isBetrayModalOpen} onClose={() => setIsBetrayModalOpen(false)} />

            {/* Animations */}
            <style jsx global>{`
                @keyframes float {
                0%, 100% {
                    transform: translate(0, 0) scale(1);
                }
                33% {
                    transform: translate(30px, -30px) scale(1.1);
                }
                66% {
                    transform: translate(-20px, 20px) scale(0.9);
                }
                }

                @keyframes gradient-shift {
                0%, 100% {
                    background-position: 0% 50%;
                }
                50% {
                    background-position: 100% 50%;
                }
                }

                @keyframes scaleIn {
                from {
                    opacity: 0;
                    transform: scale(0.95);
                }
                to {
                    opacity: 1;
                    transform: scale(1);
                }
                }

                @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
                }

                @keyframes slideRight {
                from {
                    opacity: 0;
                    transform: translateX(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
                }

                @keyframes slideDown {
                from {
                    opacity: 0;
                    transform: translate(-50%, -10px);
                }
                to {
                    opacity: 1;
                    transform: translate(-50%, 0);
                }
                }

                @keyframes pulse {
                0%, 100% {
                    opacity: 1;
                    transform: scale(1);
                }
                50% {
                    opacity: 0.5;
                    transform: scale(1.2);
                }
                }

                @keyframes expandWidth {
                from {
                    width: 0;
                }
                }

                .custom-scrollbar::-webkit-scrollbar {
                width: 4px;
                }

                .custom-scrollbar::-webkit-scrollbar-track {
                background: transparent;
                }

                .custom-scrollbar::-webkit-scrollbar-thumb {
                background: #1E293B;
                border-radius: 10px;
                }

                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #0066FF;
                }
            `}</style>
        </div>
    );
}
