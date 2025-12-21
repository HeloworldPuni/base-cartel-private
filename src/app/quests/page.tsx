"use client";

import { Award, Target, TrendingUp, Lock } from "lucide-react";
import Link from 'next/link';
import AuthenticatedRoute from '@/components/AuthenticatedRoute';
import BottomNav from '@/components/BottomNav';

export default function QuestsPage() {
    const userRep = 1250;
    const userRank = "Lieutenant";
    const nextRankRep = 2000;
    const repProgress = (userRep / nextRankRep) * 100;

    const activeQuests = [
        {
            id: 1,
            emoji: "⚔️",
            category: "Active Operations",
            title: "Daily Raid",
            description: "Complete a raid to earn respect.",
            repReward: 50,
            sharesReward: 10,
            progress: 0,
            total: 1,
            status: "IN PROGRESS",
        },
        {
            id: 2,
            emoji: "🔥",
            category: "Active Operations",
            title: "Hostile Takeover",
            description: "Burn 100 shares from rival cartels.",
            repReward: 150,
            sharesReward: 25,
            progress: 47,
            total: 100,
            status: "IN PROGRESS",
        },
    ];

    const syndicateQuests = [
        {
            id: 3,
            emoji: "🤝",
            category: "Syndicate Growth",
            title: "Recruitment Drive",
            description: "Recruit 3 new members to the cartel.",
            repReward: 100,
            sharesReward: 50,
            progress: 1,
            total: 3,
            status: "IN PROGRESS",
        },
        {
            id: 4,
            emoji: "👥",
            category: "Syndicate Growth",
            title: "Build Your Network",
            description: "Have 10 active members in your clan.",
            repReward: 300,
            sharesReward: 100,
            progress: 4,
            total: 10,
            status: "IN PROGRESS",
        },
    ];

    const lockedQuests = [
        {
            id: 5,
            emoji: "🏆",
            category: "Elite Operations",
            title: "Kingpin Status",
            description: "Reach Boss rank to unlock.",
            repReward: 500,
            sharesReward: 250,
            requiresRank: "Boss",
        },
    ];

    return (
        <AuthenticatedRoute>
            <div className="min-h-screen bg-[#0a0e1a] text-white overflow-x-hidden pb-24">
                {/* Navigation - Desktop */}
                <nav className="border-b border-[#1e2a45] bg-[#0a0e1a] sticky top-0 z-50 hidden md:block">
                    <div className="max-w-7xl mx-auto px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">🎩</span>
                                <h1 className="text-xl font-bold tracking-wider">BASE CARTEL</h1>
                            </div>
                            <div className="flex items-center gap-6">
                                <Link
                                    href="/dashboard"
                                    className="text-sm text-[#666666] hover:text-[#4FC3F7] transition-colors"
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    href="/leaderboard"
                                    className="text-sm text-[#666666] hover:text-[#4FC3F7] transition-colors"
                                >
                                    Leaderboard
                                </Link>
                                <Link
                                    href="/quests"
                                    className="text-sm text-[#4FC3F7] font-semibold border-b-2 border-[#4FC3F7] pb-1"
                                >
                                    Quests
                                </Link>
                                <Link
                                    href="/profile"
                                    className="text-sm text-[#666666] hover:text-[#4FC3F7] transition-colors"
                                >
                                    Profile
                                </Link>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-6 py-8 md:py-12">
                    {/* Header */}
                    <div className="mb-12">
                        <h1 className="text-3xl md:text-5xl font-extrabold tracking-wider mb-3">
                            OPERATIONS
                        </h1>
                        <p className="text-[#666666] text-base md:text-lg">
                            Complete missions to earn respect and climb the ranks
                        </p>
                    </div>

                    {/* Reputation Card */}
                    <div className="bg-[#141b2e] border border-[#1e2a45] rounded-2xl p-6 md:p-8 mb-12 relative overflow-hidden">
                        {/* Gradient Glow */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#4FC3F7] opacity-5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>

                        <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 relative z-10">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <Award size={28} color="#FFD700" />
                                    <div className="flex items-baseline gap-2">
                                        <h2 className="text-4xl md:text-5xl font-bold">
                                            {userRep.toLocaleString()}
                                        </h2>
                                        <span className="text-lg md:text-xl text-[#666666]">REP</span>
                                    </div>
                                </div>
                                <p className="text-xl md:text-2xl font-bold text-[#FFD700] mb-4 md:mb-0">{userRank}</p>
                            </div>
                            <div className="self-start bg-[rgba(255,215,0,0.1)] border border-[rgba(255,215,0,0.3)] px-5 py-2 rounded-lg">
                                <p className="text-xs font-bold text-[#FFD700] tracking-wider">
                                    FEE REDUCTION
                                </p>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-sm text-[#666666]">Next Rank</span>
                                <span className="text-sm text-white font-semibold">
                                    {userRep} / {nextRankRep}
                                </span>
                            </div>
                            <div className="h-3 bg-[#1e2a45] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-[#4FC3F7] rounded-full transition-all duration-500"
                                    style={{ width: `${repProgress}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Active Operations Section */}
                    <div className="mb-12">
                        <div className="flex items-center gap-3 mb-6">
                            <h3 className="text-sm font-bold text-[#666666] tracking-widest uppercase flex items-center gap-2">
                                Active Operations
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {activeQuests.map((quest) => (
                                <div
                                    key={quest.id}
                                    className="bg-[#141b2e] border border-[#1e2a45] rounded-xl p-6 hover:border-[#4FC3F7] transition-all duration-300"
                                >
                                    <div className="mb-5">
                                        <h4 className="text-2xl font-bold mb-2 flex items-center gap-2">
                                            <span>{quest.emoji}</span>
                                            {quest.title}
                                        </h4>
                                        <p className="text-[#666666] leading-relaxed">
                                            {quest.description}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-3 mb-5">
                                        <div className="bg-[rgba(79,195,247,0.1)] border border-[rgba(79,195,247,0.3)] px-4 py-2 rounded-lg">
                                            <p className="text-sm font-semibold text-[#4FC3F7]">
                                                +{quest.repReward} REP
                                            </p>
                                        </div>
                                        <div className="bg-[rgba(79,195,247,0.1)] border border-[rgba(79,195,247,0.3)] px-4 py-2 rounded-lg">
                                            <p className="text-sm font-semibold text-[#4FC3F7]">
                                                +{quest.sharesReward} Shares
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mb-5">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs text-[#666666] uppercase tracking-wider">
                                                Progress
                                            </span>
                                            <span className="text-sm font-semibold">
                                                {quest.progress} / {quest.total}
                                            </span>
                                        </div>
                                        <div className="h-2 bg-[#1e2a45] rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[#4FC3F7] rounded-full transition-all duration-500"
                                                style={{
                                                    width: `${(quest.progress / quest.total) * 100}%`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-5 border-t border-[#1e2a45]">
                                        <p className="text-xs font-bold text-[#4FC3F7] tracking-widest uppercase">
                                            {quest.status}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Syndicate Growth Section */}
                    <div className="mb-12">
                        <div className="flex items-center gap-3 mb-6">
                            <h3 className="text-sm font-bold text-[#666666] tracking-widest uppercase">
                                Syndicate Growth
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {syndicateQuests.map((quest) => (
                                <div
                                    key={quest.id}
                                    className="bg-[#141b2e] border border-[#1e2a45] rounded-xl p-6 hover:border-[#4FC3F7] transition-all duration-300"
                                >
                                    <div className="mb-5">
                                        <h4 className="text-2xl font-bold mb-2 flex items-center gap-2">
                                            <span>{quest.emoji}</span>
                                            {quest.title}
                                        </h4>
                                        <p className="text-[#666666] leading-relaxed">
                                            {quest.description}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-3 mb-5">
                                        <div className="bg-[rgba(79,195,247,0.1)] border border-[rgba(79,195,247,0.3)] px-4 py-2 rounded-lg">
                                            <p className="text-sm font-semibold text-[#4FC3F7]">
                                                +{quest.repReward} REP
                                            </p>
                                        </div>
                                        <div className="bg-[rgba(79,195,247,0.1)] border border-[rgba(79,195,247,0.3)] px-4 py-2 rounded-lg">
                                            <p className="text-sm font-semibold text-[#4FC3F7]">
                                                +{quest.sharesReward} Shares
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mb-5">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs text-[#666666] uppercase tracking-wider">
                                                Progress
                                            </span>
                                            <span className="text-sm font-semibold">
                                                {quest.progress} / {quest.total}
                                            </span>
                                        </div>
                                        <div className="h-2 bg-[#1e2a45] rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[#4FC3F7] rounded-full transition-all duration-500"
                                                style={{
                                                    width: `${(quest.progress / quest.total) * 100}%`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-5 border-t border-[#1e2a45]">
                                        <p className="text-xs font-bold text-[#4FC3F7] tracking-widest uppercase">
                                            {quest.status}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Locked Quests Section */}
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <h3 className="text-sm font-bold text-[#666666] tracking-widest uppercase">
                                Locked Operations
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {lockedQuests.map((quest) => (
                                <div
                                    key={quest.id}
                                    className="bg-[#141b2e] border border-[#1e2a45] rounded-xl p-6 opacity-50 relative"
                                >
                                    <div className="absolute top-4 right-4 text-[#666666]">
                                        <Lock size={20} />
                                    </div>
                                    <div className="flex items-center gap-3 mb-5">
                                        <span className="text-3xl">{quest.emoji}</span>
                                        <h4 className="text-2xl font-bold text-[#666666]">
                                            {quest.title}
                                        </h4>
                                    </div>

                                    <p className="text-[#666666] mb-5">{quest.description}</p>

                                    <div className="flex flex-wrap gap-3">
                                        <div className="bg-[#1e2a45] px-4 py-2 rounded-lg">
                                            <p className="text-sm font-semibold text-[#666666]">
                                                +{quest.repReward} REP
                                            </p>
                                        </div>
                                        <div className="bg-[#1e2a45] px-4 py-2 rounded-lg">
                                            <p className="text-sm font-semibold text-[#666666]">
                                                +{quest.sharesReward} Shares
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="border-t border-[#1e2a45] mt-20 py-8">
                    <div className="max-w-7xl mx-auto px-6">
                        <p className="text-center text-[#666666] text-sm">
                            Base Cartel - Rule The Chain
                        </p>
                    </div>
                </footer>

                {/* Mobile Bottom Nav */}
                <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
                    <BottomNav />
                </div>
            </div>
        </AuthenticatedRoute>
    );
}
