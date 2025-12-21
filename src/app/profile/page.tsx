"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    User,
    Trophy,
    Target,
    TrendingUp,
    Coins,
    Users,
    Award,
    LogOut,
    Settings,
    Copy,
    Check,
    Shield,
} from "lucide-react";
import { useAccount, useDisconnect, useEnsName } from 'wagmi';
import AuthenticatedRoute from '@/components/AuthenticatedRoute';
import BottomNav from '@/components/BottomNav';
import { useFrameContext } from "@/components/providers/FrameProvider";


export default function ProfilePage() {
    const { address } = useAccount();
    const { disconnect } = useDisconnect();
    // @ts-ignore
    const { data: ensName } = useEnsName({ address, chainId: 8453 }); // Base Chain ID
    const { context } = useFrameContext();

    const [copiedAddress, setCopiedAddress] = useState(false);
    const [activeTab, setActiveTab] = useState("stats");

    // Derive display data from real sources or fallbacks
    const displayAddress = address;
    // @ts-ignore
    const displayUsername = context?.user?.username ? `@${context.user.username}` : (ensName || "Agent Zero");

    // Mock user data - mixed with real address/name
    const userData = {
        address: displayAddress,
        username: displayUsername,
        reputation: 12847,
        rank: "Kingpin",
        rankNumber: 7,
        totalPlayers: 2451,
        shares: 8542,
        operations: 234,
        earnings: 45.67,
        raids: { won: 187, lost: 47 },
        clanSize: 23,
        joinedDate: "March 2024",
        badges: [
            { id: 1, name: "First Blood", icon: "🩸", rarity: "common" },
            { id: 2, name: "Raid Master", icon: "⚔️", rarity: "rare" },
            { id: 3, name: "Diamond Hands", icon: "💎", rarity: "epic" },
            { id: 4, name: "Cartel Boss", icon: "👑", rarity: "legendary" },
            { id: 5, name: "Betrayer", icon: "🗡️", rarity: "rare" },
            { id: 6, name: "Untouchable", icon: "🛡️", rarity: "epic" },
        ],
        recentActivity: [
            {
                id: 1,
                type: "raid",
                target: "0x5a2...4f3",
                result: "won",
                amount: "+234 shares",
                time: "2 hours ago",
            },
            {
                id: 2,
                type: "quest",
                name: "Daily Operation",
                result: "completed",
                amount: "+50 REP",
                time: "5 hours ago",
            },
            {
                id: 3,
                type: "raid",
                target: "0x8b1...9c2",
                result: "lost",
                amount: "-89 shares",
                time: "1 day ago",
            },
            { id: 4, type: "dividend", amount: "+2.34 ETH", time: "1 day ago" },
        ],
    };

    const copyAddress = () => {
        if (userData.address) {
            navigator.clipboard.writeText(userData.address);
            setCopiedAddress(true);
            setTimeout(() => setCopiedAddress(false), 2000);
        }
    };

    const getRarityColor = (rarity: string) => {
        switch (rarity) {
            case "legendary":
                return "from-yellow-500 to-orange-500";
            case "epic":
                return "from-purple-500 to-pink-500";
            case "rare":
                return "from-blue-500 to-cyan-500";
            default:
                return "from-gray-500 to-gray-600";
        }
    };

    return (
        <AuthenticatedRoute>
            <div className="min-h-screen bg-gradient-to-b from-[#0a0e27] via-[#0f1435] to-[#0a0e27] text-white pb-24 md:pb-8 overflow-x-hidden">
                {/* Hero Section */}
                <div className="relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <div
                            className="absolute inset-0"
                            style={{
                                backgroundImage:
                                    "radial-gradient(circle at 2px 2px, rgba(0, 212, 255, 0.3) 1px, transparent 0)",
                                backgroundSize: "40px 40px",
                            }}
                        ></div>
                    </div>

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative pt-8 px-4 md:px-8"
                    >
                        <div className="max-w-7xl mx-auto">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-[#00d4ff] to-[#0066ff] rounded-full flex items-center justify-center">
                                        <User className="w-6 h-6 md:w-8 md:h-8" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl md:text-4xl font-bold tracking-wider uppercase">
                                            {userData.username}
                                        </h1>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-sm md:text-base text-gray-400 font-mono">
                                                {userData.address.slice(0, 8)}...
                                                {userData.address.slice(-6)}
                                            </span>
                                            <button
                                                onClick={copyAddress}
                                                className="p-1 hover:bg-white/10 rounded transition-colors"
                                            >
                                                {copiedAddress ? (
                                                    <Check className="w-4 h-4 text-green-400" />
                                                ) : (
                                                    <Copy className="w-4 h-4 text-gray-400" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <button className="p-2 md:p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                                    <Settings className="w-5 h-5 md:w-6 md:h-6" />
                                </button>
                            </div>

                            {/* Reputation & Rank Card */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.1 }}
                                className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-white/10 mb-6"
                            >
                                <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                                    <div>
                                        <div className="text-sm md:text-base text-gray-400 uppercase tracking-wider mb-2">
                                            Reputation
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.3 }}
                                                className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-[#00d4ff] to-[#0066ff] bg-clip-text text-transparent"
                                            >
                                                {userData.reputation.toLocaleString()}
                                            </motion.div>
                                            <span className="text-xl md:text-2xl text-gray-400">
                                                REP
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <div className="text-sm md:text-base text-gray-400 uppercase tracking-wider mb-2">
                                            Current Rank
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Shield className="w-8 h-8 md:w-10 md:h-10 text-[#ffd700]" />
                                            <div>
                                                <div className="text-2xl md:text-3xl font-bold text-[#ffd700] uppercase tracking-wider">
                                                    {userData.rank}
                                                </div>
                                                <div className="text-sm text-gray-400">
                                                    #{userData.rankNumber} of{" "}
                                                    {userData.totalPlayers.toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6">
                    {/* Stats Grid */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6"
                    >
                        <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 md:p-6 border border-white/10 hover:border-[#00d4ff]/50 transition-all hover:scale-105">
                            <Coins className="w-6 h-6 md:w-8 md:h-8 text-[#00d4ff] mb-2" />
                            <div className="text-sm text-gray-400 uppercase tracking-wider mb-1">
                                Shares
                            </div>
                            <div className="text-2xl md:text-3xl font-bold">
                                {userData.shares.toLocaleString()}
                            </div>
                        </div>
                        <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 md:p-6 border border-white/10 hover:border-[#00d4ff]/50 transition-all hover:scale-105">
                            <Target className="w-6 h-6 md:w-8 md:h-8 text-[#ff6b6b] mb-2" />
                            <div className="text-sm text-gray-400 uppercase tracking-wider mb-1">
                                Operations
                            </div>
                            <div className="text-2xl md:text-3xl font-bold">
                                {userData.operations}
                            </div>
                        </div>
                        <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 md:p-6 border border-white/10 hover:border-[#00d4ff]/50 transition-all hover:scale-105">
                            <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-[#4ade80] mb-2" />
                            <div className="text-sm text-gray-400 uppercase tracking-wider mb-1">
                                Earnings
                            </div>
                            <div className="text-2xl md:text-3xl font-bold">
                                {userData.earnings} Ξ
                            </div>
                        </div>
                        <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 md:p-6 border border-white/10 hover:border-[#00d4ff]/50 transition-all hover:scale-105">
                            <Users className="w-6 h-6 md:w-8 md:h-8 text-[#ffd700] mb-2" />
                            <div className="text-sm text-gray-400 uppercase tracking-wider mb-1">
                                Clan
                            </div>
                            <div className="text-2xl md:text-3xl font-bold">
                                {userData.clanSize}
                            </div>
                        </div>
                    </motion.div>

                    {/* Tabs */}
                    <div className="flex gap-2 md:gap-4 mb-6 overflow-x-auto">
                        {["stats", "badges", "activity"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 md:px-6 py-2 md:py-3 rounded-lg uppercase tracking-wider text-sm md:text-base font-semibold transition-all whitespace-nowrap ${activeTab === tab
                                    ? "bg-gradient-to-r from-[#00d4ff] to-[#0066ff] text-white"
                                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    {activeTab === "stats" && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid md:grid-cols-2 gap-4 md:gap-6"
                        >
                            {/* Raid Stats */}
                            <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
                                <div className="flex items-center gap-3 mb-4">
                                    <Trophy className="w-6 h-6 text-[#ffd700]" />
                                    <h3 className="text-xl font-bold uppercase tracking-wider">
                                        Raid Record
                                    </h3>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-gray-400">Victories</span>
                                            <span className="font-bold text-green-400">
                                                {userData.raids.won}
                                            </span>
                                        </div>
                                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{
                                                    width: `${(userData.raids.won / (userData.raids.won + userData.raids.lost)) * 100}%`,
                                                }}
                                                transition={{ delay: 0.3, duration: 0.8 }}
                                                className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-gray-400">Defeats</span>
                                            <span className="font-bold text-red-400">
                                                {userData.raids.lost}
                                            </span>
                                        </div>
                                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{
                                                    width: `${(userData.raids.lost / (userData.raids.won + userData.raids.lost)) * 100}%`,
                                                }}
                                                transition={{ delay: 0.3, duration: 0.8 }}
                                                className="h-full bg-gradient-to-r from-red-500 to-rose-400"
                                            />
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-white/10">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Win Rate</span>
                                            <span className="font-bold text-[#00d4ff]">
                                                {(
                                                    (userData.raids.won /
                                                        (userData.raids.won + userData.raids.lost)) *
                                                    100
                                                ).toFixed(1)}
                                                %
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Member Since */}
                            <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
                                <div className="flex items-center gap-3 mb-4">
                                    <Award className="w-6 h-6 text-[#00d4ff]" />
                                    <h3 className="text-xl font-bold uppercase tracking-wider">
                                        Cartel Member
                                    </h3>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-gray-400 mb-2">Joined</div>
                                        <div className="text-2xl font-bold">
                                            {userData.joinedDate}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-gray-400 mb-2">Total Operations</div>
                                        <div className="text-2xl font-bold">
                                            {userData.operations}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-gray-400 mb-2">Status</div>
                                        <div className="inline-block px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-semibold">
                                            ACTIVE MEMBER
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "badges" && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <Award className="w-6 h-6 text-[#ffd700]" />
                                <h3 className="text-xl font-bold uppercase tracking-wider">
                                    Achievements
                                </h3>
                                <span className="ml-auto text-gray-400">
                                    {userData.badges.length} Badges
                                </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                {userData.badges.map((badge, index) => (
                                    <motion.div
                                        key={badge.id}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.1 }}
                                        className={`relative bg-gradient-to-br ${getRarityColor(badge.rarity)} p-[2px] rounded-xl hover:scale-110 transition-transform cursor-pointer group`}
                                    >
                                        <div className="bg-[#0a0e27] rounded-xl p-4 h-full flex flex-col items-center justify-center">
                                            <div className="text-4xl mb-2">{badge.icon}</div>
                                            <div className="text-xs text-center font-semibold">
                                                {badge.name}
                                            </div>
                                            <div className="text-xs text-gray-400 uppercase mt-1">
                                                {badge.rarity}
                                            </div>
                                        </div>
                                        {/* Tooltip */}
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                            {badge.name}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "activity" && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <TrendingUp className="w-6 h-6 text-[#00d4ff]" />
                                <h3 className="text-xl font-bold uppercase tracking-wider">
                                    Recent Activity
                                </h3>
                            </div>
                            <div className="space-y-3">
                                {userData.recentActivity.map((activity, index) => (
                                    <motion.div
                                        key={activity.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="flex items-center gap-4 p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                                    >
                                        <div
                                            className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.type === "raid"
                                                ? activity.result === "won"
                                                    ? "bg-green-500/20"
                                                    : "bg-red-500/20"
                                                : activity.type === "quest"
                                                    ? "bg-blue-500/20"
                                                    : "bg-yellow-500/20"
                                                }`}
                                        >
                                            {activity.type === "raid" ? (
                                                <Target
                                                    className={`w-5 h-5 ${activity.result === "won" ? "text-green-400" : "text-red-400"}`}
                                                />
                                            ) : activity.type === "quest" ? (
                                                <Trophy className="w-5 h-5 text-blue-400" />
                                            ) : (
                                                <Coins className="w-5 h-5 text-yellow-400" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-semibold">
                                                {activity.type === "raid" &&
                                                    `Raid ${activity.result} vs ${activity.target}`}
                                                {activity.type === "quest" && `Quest: ${activity.name}`}
                                                {activity.type === "dividend" && "Dividend Claimed"}
                                            </div>
                                            <div className="text-sm text-gray-400">{activity.time}</div>
                                        </div>
                                        <div
                                            className={`font-bold ${activity.amount.startsWith("+")
                                                ? "text-green-400"
                                                : "text-red-400"
                                                }`}
                                        >
                                            {activity.amount}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Logout Button */}
                    <motion.button
                        onClick={() => disconnect()}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="w-full md:w-auto mt-8 px-8 py-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl font-semibold uppercase tracking-wider flex items-center justify-center gap-3 transition-all border border-red-500/30 hover:border-red-500/50"
                    >
                        <LogOut className="w-5 h-5" />
                        Disconnect Wallet
                    </motion.button>
                </div>

                {/* Bottom Navigation - Mobile Only */}
                <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
                    <BottomNav />
                </div>
            </div>
        </AuthenticatedRoute>
    );
}
