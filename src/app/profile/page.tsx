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
import SettingsModal from "@/components/SettingsModal";


export default function ProfilePage() {
    const { address } = useAccount();
    const { disconnect } = useDisconnect();
    const { data: ensName } = useEnsName({ address, chainId: 8453 }); // Base Chain ID
    const { context } = useFrameContext();

    const [copiedAddress, setCopiedAddress] = useState(false);
    const [activeTab, setActiveTab] = useState("stats");
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Derive display data from real sources or fallbacks
    const displayAddress = address || "";
    const displayUsername = context?.user?.username ? `@${context.user.username}` : (ensName || "Agent Zero");

    interface Badge {
        id: number;
        name: string;
        icon: string;
        rarity: string;
    }

    interface ActivityLog {
        id: string;
        type: string;
        target?: string;
        result?: string;
        amount: string;
        time: string;
        timestamp: number;
        name?: string;
    }

    interface ProfileData {
        reputation: number;
        rank: string;
        rankNumber: number;
        totalPlayers: number;
        shares: number;
        operations: number;
        earnings: number;
        clanSize: number;
        joinedDate: string;
        badges: Badge[];
        recentActivity: ActivityLog[];
        socials?: {
            twitter: string;
            farcaster: string;
        };
    }

    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [raidStats, setRaidStats] = useState({ won: 0, lost: 0, total: 0 });

    useEffect(() => {
        if (!address) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Basic Stats & Rank
                const statsRes = await fetch(`/api/cartel/me/stats?address=${address}`);
                const statsData = await statsRes.json();

                // 2. Fetch Quests & Reputation (Tier info)
                const questsRes = await fetch(`/api/quests/active?address=${address}`);
                const questsData = await questsRes.json();

                // 3. Fetch Raid History
                const raidsRes = await fetch(`/api/cartel/history/raids?address=${address}&limit=50`);
                const raidsData = await raidsRes.json();

                // Process Raid History for Win/Loss & Activity
                const raids = raidsData.events || [];
                let won = 0;
                let lost = 0;

                interface RaidEvent {
                    direction: string;
                    target: string;
                    attacker: string;
                    stolenShares: number;
                    timestamp: string;
                }

                // Map raids to activity format
                const activityLog: ActivityLog[] = raids.map((raid: RaidEvent, index: number) => {
                    let result = 'won';
                    if (raid.direction === 'by') {
                        // I attacked
                        result = raid.stolenShares > 0 ? 'won' : 'failed';
                    } else {
                        // I was attacked
                        result = raid.stolenShares > 0 ? 'lost' : 'defended';
                    }

                    return {
                        id: `raid-${index}`,
                        type: 'raid',
                        target: raid.direction === 'by' ? raid.target : raid.attacker,
                        result,
                        amount: raid.direction === 'by' ? `+${raid.stolenShares} shares` : `-${raid.stolenShares} shares`,
                        time: new Date(raid.timestamp).toLocaleDateString(),
                        timestamp: new Date(raid.timestamp).getTime()
                    };
                });

                // Calculate stats
                raids.forEach((r: RaidEvent) => {
                    if (r.direction === 'by' && r.stolenShares > 0) won++;
                    else if (r.direction === 'on' && r.stolenShares > 0) lost++;
                });

                setRaidStats({ won, lost, total: won + lost });

                // Construct User Data Object
                setProfileData({
                    reputation: questsData.rep || 0,
                    rank: questsData.tier?.title || "Soldier",
                    rankNumber: statsData.rank || 9999,
                    totalPlayers: statsData.totalPlayers || 1,
                    shares: statsData.shares || 0,
                    operations: (statsData.highStakesCount || 0) + (questsData.quests?.length || 0), // Approx
                    earnings: statsData.earnings || 0, // Calculated in API
                    clanSize: 0,
                    joinedDate: statsData.joinedDate ? new Date(statsData.joinedDate).getFullYear().toString() : "2024",
                    badges: [
                        ...(won > 0 ? [{ id: 1, name: "First Blood", icon: "🩸", rarity: "common" }] : []),
                        ...(statsData.shares > 1000 ? [{ id: 2, name: "Whale", icon: "💎", rarity: "epic" }] : []),
                        ...(statsData.rank === 1 ? [{ id: 3, name: "The Boss", icon: "👑", rarity: "legendary" }] : [])
                    ],
                    recentActivity: activityLog.slice(0, 10),
                    socials: statsData.socials
                });

            } catch (error) {
                console.error("Failed to fetch profile data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [address]);

    const copyAddress = () => {
        if (address) {
            navigator.clipboard.writeText(address);
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

    // Loading State
    if (loading || !profileData) {
        return (
            <AuthenticatedRoute>
                <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center text-white">
                    <div className="animate-pulse flex flex-col items-center">
                        <div className="h-16 w-16 bg-white/10 rounded-full mb-4"></div>
                        <div className="h-6 w-32 bg-white/10 rounded mb-2"></div>
                        <div className="text-gray-500 text-sm">Loading Profile...</div>
                    </div>
                </div>
            </AuthenticatedRoute>
        );
    }

    // Use the fetched data
    const userData = {
        address: displayAddress,
        username: displayUsername,
        ...profileData,
        raids: raidStats
    };

    return (
        <AuthenticatedRoute>
            <div className="min-h-screen bg-cartel-dark text-white pb-24 md:pb-8 overflow-x-hidden">
                {/* Hero Section */}
                <div className="relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10 mafia-pattern pointer-events-none"></div>

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative pt-8 px-4 md:px-8"
                    >
                        <div className="max-w-7xl mx-auto">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-[#00d4ff] to-[#0066ff] rounded-full flex items-center justify-center glow-text-blue">
                                        <User className="w-6 h-6 md:w-8 md:h-8" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl md:text-4xl font-display tracking-wider uppercase">
                                            {userData.username}
                                        </h1>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-sm md:text-base text-gray-400 font-mono">
                                                {userData.address?.slice(0, 8)}...
                                                {userData.address?.slice(-6)}
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
                                <button
                                    onClick={() => setIsSettingsOpen(true)}
                                    className="p-2 md:p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                                    aria-label="Settings"
                                >
                                    <Settings className="w-5 h-5 md:w-6 md:h-6" />
                                </button>
                            </div>

                            <SettingsModal
                                isOpen={isSettingsOpen}
                                onClose={() => setIsSettingsOpen(false)}
                                initialData={userData.socials}
                            />

                            {/* Reputation & Rank Card */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.1 }}
                                className="glass-card p-6 md:p-8 mb-6"
                            >
                                <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                                    <div>
                                        <div className="text-sm md:text-base text-gray-400 uppercase tracking-wider mb-2 font-display">
                                            Reputation
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.3 }}
                                                className="text-5xl md:text-7xl font-bold text-gradient-blue font-display"
                                            >
                                                {userData.reputation.toLocaleString()}
                                            </motion.div>
                                            <span className="text-xl md:text-2xl text-gray-400 font-display">
                                                REP
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <div className="text-sm md:text-base text-gray-400 uppercase tracking-wider mb-2 font-display">
                                            Current Rank
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Shield className="w-8 h-8 md:w-10 md:h-10 text-[#ffd700]" />
                                            <div>
                                                <div className="text-2xl md:text-3xl font-bold text-gold uppercase tracking-wider font-display">
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
                        <div className="glass-card-hover p-4 md:p-6 hover:border-[#00d4ff]/50">
                            <Coins className="w-6 h-6 md:w-8 md:h-8 text-[#00d4ff] mb-2" />
                            <div className="text-xs md:text-sm text-gray-400 uppercase tracking-wider mb-1 font-display">
                                Shares
                            </div>
                            <div className="text-2xl md:text-3xl font-bold">
                                {userData.shares.toLocaleString()}
                            </div>
                        </div>
                        <div className="glass-card-hover p-4 md:p-6 hover:border-[#00d4ff]/50">
                            <Target className="w-6 h-6 md:w-8 md:h-8 text-[#ff6b6b] mb-2" />
                            <div className="text-xs md:text-sm text-gray-400 uppercase tracking-wider mb-1 font-display">
                                Operations
                            </div>
                            <div className="text-2xl md:text-3xl font-bold">
                                {userData.operations}
                            </div>
                        </div>
                        <div className="glass-card-hover p-4 md:p-6 hover:border-[#00d4ff]/50">
                            <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-[#4ade80] mb-2" />
                            <div className="text-xs md:text-sm text-gray-400 uppercase tracking-wider mb-1 font-display">
                                Earnings
                            </div>
                            <div className="text-2xl md:text-3xl font-bold">
                                {userData.earnings} Ξ
                            </div>
                        </div>
                        <div className="glass-card-hover p-4 md:p-6 hover:border-[#00d4ff]/50">
                            <Users className="w-6 h-6 md:w-8 md:h-8 text-[#ffd700] mb-2" />
                            <div className="text-xs md:text-sm text-gray-400 uppercase tracking-wider mb-1 font-display">
                                Clan
                            </div>
                            <div className="text-2xl md:text-3xl font-bold">
                                {userData.clanSize}
                            </div>
                        </div>
                    </motion.div>

                    {/* Tabs */}
                    <div className="flex gap-2 md:gap-4 mb-6 overflow-x-auto no-scrollbar">
                        {["stats", "badges", "activity"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 md:px-6 py-2 md:py-3 rounded-xl uppercase tracking-wider text-sm md:text-base font-display transition-all whitespace-nowrap ${activeTab === tab
                                    ? "bg-gradient-to-r from-[#00d4ff] to-[#0066ff] text-white shadow-lg shadow-blue-500/20"
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
                            <div className="glass-card p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <Trophy className="w-6 h-6 text-[#ffd700]" />
                                    <h3 className="text-xl font-bold uppercase tracking-wider font-display">
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
                                                        (userData.raids.won + userData.raids.lost || 1)) * // safe div
                                                    100
                                                ).toFixed(1)}
                                                %
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Member Since */}
                            <div className="glass-card p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <Award className="w-6 h-6 text-[#00d4ff]" />
                                    <h3 className="text-xl font-bold uppercase tracking-wider font-display">
                                        Cartel Member
                                    </h3>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-gray-400 mb-2">Joined</div>
                                        <div className="text-2xl font-bold font-mono">
                                            {userData.joinedDate}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-gray-400 mb-2">Total Operations</div>
                                        <div className="text-2xl font-bold font-mono">
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
                            className="glass-card p-6"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <Award className="w-6 h-6 text-[#ffd700]" />
                                <h3 className="text-xl font-bold uppercase tracking-wider font-display">
                                    Achievements
                                </h3>
                                <span className="ml-auto text-gray-400">
                                    {userData.badges.length} Badges
                                </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                {userData.badges.map((badge: Badge, index: number) => (
                                    <motion.div
                                        key={badge.id}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.1 }}
                                        className={`relative bg-gradient-to-br ${getRarityColor(badge.rarity)} p-[1px] rounded-xl hover:scale-105 transition-transform cursor-pointer group`}
                                    >
                                        <div className="bg-[#0a0e27] rounded-xl p-4 h-full flex flex-col items-center justify-center relative overflow-hidden">
                                            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            <div className="text-4xl mb-2">{badge.icon}</div>
                                            <div className="text-xs text-center font-bold font-display">
                                                {badge.name}
                                            </div>
                                            <div className="text-[10px] text-gray-400 uppercase mt-1">
                                                {badge.rarity}
                                            </div>
                                        </div>
                                        {/* Tooltip */}
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
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
                            className="glass-card p-6"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <TrendingUp className="w-6 h-6 text-[#00d4ff]" />
                                <h3 className="text-xl font-bold uppercase tracking-wider font-display">
                                    Recent Activity
                                </h3>
                            </div>
                            <div className="space-y-3">
                                {userData.recentActivity.map((activity: ActivityLog, index: number) => (
                                    <motion.div
                                        key={activity.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="flex items-center gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors border border-transparent hover:border-white/10"
                                    >
                                        <div
                                            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${activity.type === "raid"
                                                ? (activity.result === "won" || activity.result === "defended")
                                                    ? "bg-green-500/20"
                                                    : "bg-red-500/20"
                                                : activity.type === "quest"
                                                    ? "bg-blue-500/20"
                                                    : "bg-yellow-500/20"
                                                }`}
                                        >
                                            {activity.type === "raid" ? (
                                                <Target
                                                    className={`w-5 h-5 ${activity.result === "won" || activity.result === "defended"
                                                        ? "text-green-400"
                                                        : "text-red-400"
                                                        }`}
                                                />
                                            ) : activity.type === "quest" ? (
                                                <Trophy className="w-5 h-5 text-blue-400" />
                                            ) : (
                                                <Coins className="w-5 h-5 text-yellow-400" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold truncate">
                                                {activity.type === "raid" && (
                                                    activity.result === "failed"
                                                        ? `Raid Failed vs ${(activity.target || "").slice(0, 6)}...`
                                                        : activity.result === "defended"
                                                            ? `Defended vs ${(activity.target || "").slice(0, 6)}...`
                                                            : `Raid ${activity.result} vs ${(activity.target || "").slice(0, 6)}...`
                                                )}
                                                {activity.type === "quest" && `Quest: ${activity.name}`}
                                                {activity.type === "dividend" && "Dividend Claimed"}
                                            </div>
                                            <div className="text-sm text-gray-400">{activity.time}</div>
                                        </div>
                                        <div
                                            className={`font-bold whitespace-nowrap ${(activity.amount.startsWith("+") && activity.amount !== "+0 shares") || activity.result === "defended"
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
                        className="w-full md:w-auto mt-8 px-8 py-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl font-display uppercase tracking-wider flex items-center justify-center gap-3 transition-all border border-red-500/20 hover:border-red-500/40"
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
