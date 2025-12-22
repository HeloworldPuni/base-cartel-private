"use client";
import {
    Trophy,
    Crown,
    Medal,
    Flame,
    TrendingUp,
    Users,
    DollarSign,
    Eye,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import AuthenticatedRoute from '@/components/AuthenticatedRoute'; // Integrating Auth Wrapper

export default function LeaderboardPage() {
    const [hoveredRank, setHoveredRank] = useState<number | null>(null);
    const [mounted, setMounted] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const playersPerPage = 8;
    // const totalPlayers = 100; // Will be dynamic

    const [players, setPlayers] = useState<any[]>([]);
    const [totalPlayers, setTotalPlayers] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchLeaderboard = async (pageNum: number) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/cartel/leaderboard?page=${pageNum}&limit=${playersPerPage}`);
            const data = await res.json();

            const entries = data.leaderboard?.entries || [];
            setTotalPlayers(data.leaderboard?.total || 0);

            const mappedPlayers = entries.map((entry: any) => {
                let color = "#64748b";
                let glow = "#64748b";
                let avatar = entry.rank <= 3 ? (entry.rank === 1 ? "👑" : entry.rank === 2 ? "🥈" : "🥉") : `${entry.rank}`;

                let title = entry.rank === 1 ? "👑 Boss of Bosses" :
                    entry.rank <= 3 ? "🩸 Caporegime" :
                        entry.rank <= 10 ? "📜 Consigliere" :
                            entry.rank <= 25 ? "⚔️ Soldier" : "👤 Associate";

                if (entry.rank === 1) { color = "#fbbf24"; glow = "#fbbf24"; }
                else if (entry.rank === 2) { color = "#cbd5e1"; glow = "#cbd5e1"; }
                else if (entry.rank === 3) { color = "#d97706"; glow = "#d97706"; }
                else if (entry.rank <= 10) { color = "#3b82f6"; glow = "#3b82f6"; }
                else if (entry.rank <= 25) { color = "#8b5cf6"; glow = "#8b5cf6"; }

                return {
                    rank: entry.rank,
                    address: entry.address,
                    name: entry.name,
                    title: title,
                    shares: entry.shares,
                    claimed: entry.totalClaimed,
                    avatar,
                    color,
                    glow
                };
            });
            setPlayers(mappedPlayers);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setMounted(true);
        fetchLeaderboard(1);
    }, []);



    const handleNextPage = () => {
        if (currentPage < totalPages) {
            const nextPage = currentPage + 1;
            setCurrentPage(nextPage);
            fetchLeaderboard(nextPage);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const handlePrevPage = () => {
        // but the new UI design has "Pages".
        // The user's new UI supports specific pages? 
        // "handleNextPage" in original code just incremented page for slicing mock array.
        // My fetch logic appends (Load More style).
        // Let's implement true pagination (Replace data) to match the UI's "Page X of Y" feel?
        // Actually, "Load More" is often better for mobile.
        // But the UI has "Page <X> of <Y>".
        // Let's stick to replacing data for pagination to match the UI controls.

        // RE-IMPLEMENTING fetch to REPLACE instead of APPEND for pagination support
    };

    // Pagination helpers
    // Pagination helpers
    // API returns `total`.
    const totalPages = Math.ceil(totalPlayers / playersPerPage) || 1;
    const currentPlayers = players; // Use players directly as they are the current page from API

    const stats = {
        totalPlayers: totalPlayers,
        totalPot: 0, // Placeholder until contract read
        activeSeason: 1,
        endsIn: "14d 6h 23m",
    };

    const formatAddress = (addr: string) => {
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    return (
        <AuthenticatedRoute>
            <div className="min-h-screen bg-cartel-dark text-white overflow-x-hidden">
                {/* Background Effects */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute inset-0 opacity-10 mafia-pattern"></div>
                    <div
                        className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"
                        style={{ animationDuration: "4s" }}
                    ></div>
                    <div
                        className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"
                        style={{ animationDuration: "6s", animationDelay: "1s" }}
                    ></div>
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 md:py-12 pb-24">
                    {/* Header */}
                    <div
                        className={`text-center mb-8 md:mb-12 transition-all duration-1000 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-10"}`}
                    >
                        <div className="inline-block mb-4 relative">
                            <Trophy className="w-16 h-16 md:w-20 md:h-20 text-amber-400 mx-auto drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
                            <div className="absolute inset-0 animate-ping opacity-20">
                                <Trophy className="w-16 h-16 md:w-20 md:h-20 text-amber-400 mx-auto" />
                            </div>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold mb-3 tracking-tight">
                            <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
                                CARTEL RANKINGS
                            </span>
                        </h1>
                        <p className="text-amber-400 text-lg md:text-xl font-semibold uppercase tracking-wider">
                            Season {stats.activeSeason}
                        </p>
                    </div>

                    {/* Stats Grid */}
                    <div
                        className={`grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8 transition-all duration-1000 delay-200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
                    >
                        {[
                            {
                                icon: Users,
                                label: "Total Players",
                                value: stats.totalPlayers.toLocaleString(),
                                color: "text-blue-400",
                                bg: "from-blue-500/20",
                            },
                            {
                                icon: DollarSign,
                                label: "Total Pot",
                                value: `$${(stats.totalPot / 1000).toFixed(1)}K`,
                                color: "text-green-400",
                                bg: "from-green-500/20",
                            },
                            {
                                icon: Flame,
                                label: "Active Season",
                                value: `S${stats.activeSeason}`,
                                color: "text-orange-400",
                                bg: "from-orange-500/20",
                            },
                            {
                                icon: TrendingUp,
                                label: "Season Ends",
                                value: stats.endsIn,
                                color: "text-purple-400",
                                bg: "from-purple-500/20",
                            },
                        ].map((stat, i) => (
                            <div
                                key={i}
                                className="relative group"
                                style={{ animationDelay: `${i * 100}ms` }}
                            >
                                <div
                                    className={`absolute inset-0 bg-gradient-to-br ${stat.bg} to-transparent rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                                ></div>
                                <div className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all duration-300 hover:scale-105">
                                    <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
                                    <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                                        {stat.label}
                                    </div>
                                    <div className={`text-xl md:text-2xl font-bold ${stat.color}`}>
                                        {stat.value}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Top 3 Podium - Desktop Only */}
                    <div
                        className={`hidden md:grid grid-cols-3 gap-6 mb-8 transition-all duration-1000 delay-300 ${mounted ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
                    >
                        {[players[1], players[0], players[2]].map(
                            (player, idx) => {
                                if (!player) return null; // Safe guard
                                const actualIndex = idx === 0 ? 1 : idx === 1 ? 0 : 2;
                                const heights = ["h-64", "h-80", "h-56"];
                                return (
                                    <div
                                        key={player.rank}
                                        className="relative group"
                                        style={{ animationDelay: `${actualIndex * 150}ms` }}
                                    >
                                        <div
                                            className={`absolute inset-0 bg-gradient-to-t from-${player.rank === 1 ? "amber" : player.rank === 2 ? "gray" : "orange"}-500/20 to-transparent rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                                        ></div>
                                        <div
                                            className={`relative ${heights[idx]} bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border-2 rounded-2xl p-6 flex flex-col justify-end hover:scale-105 transition-all duration-500`}
                                            style={{ borderColor: player.color }}
                                        >
                                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-5xl">
                                                {player.avatar}
                                            </div>
                                            <div
                                                className="text-6xl font-bold mb-2"
                                                style={{ color: player.color }}
                                            >
                                                #{player.rank}
                                            </div>
                                            <div className="text-sm text-gray-300 mb-1">
                                                {player.title}
                                            </div>
                                            <div className="font-mono text-xs text-gray-400 mb-4">
                                                {formatAddress(player.address)}
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <div>
                                                    <div className="text-gray-400 text-xs">Shares</div>
                                                    <div
                                                        className="font-bold text-lg"
                                                        style={{ color: player.color }}
                                                    >
                                                        {player.shares}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-gray-400 text-xs">Claimed</div>
                                                    <div className="font-bold text-lg text-green-400">
                                                        ${player.claimed.toFixed(2)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            },
                        )}
                    </div>

                    {/* Leaderboard List */}
                    <div
                        className={`space-y-3 transition-all duration-1000 delay-400 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
                    >
                        <div className="flex items-center justify-between mb-4 px-2">
                            <h2 className="text-xl md:text-2xl font-bold text-white">
                                Full Rankings
                            </h2>
                            <div className="text-sm text-gray-400">
                                Showing {(currentPage - 1) * playersPerPage + 1}-{Math.min(currentPage * playersPerPage, totalPlayers)} of{" "}
                                {totalPlayers}
                            </div>
                        </div>

                        {currentPlayers.map((player, index) => (
                            <div
                                key={player.rank}
                                onMouseEnter={() => setHoveredRank(player.rank)}
                                onMouseLeave={() => setHoveredRank(null)}
                                className="relative group"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                {/* Glow Effect */}
                                <div
                                    className={`absolute inset-0 rounded-2xl blur-xl transition-all duration-500 ${hoveredRank === player.rank ? "opacity-30" : "opacity-0"}`}
                                    style={{ backgroundColor: player.glow }}
                                ></div>

                                {/* Card */}
                                <div
                                    className={`relative glass-card p-4 md:p-6 transition-all duration-300 ${hoveredRank === player.rank ? "scale-[1.02] border-white/30" : ""}`}
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Rank Badge */}
                                        <div
                                            className={`flex-shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center font-bold text-2xl md:text-3xl relative overflow-hidden ${player.rank <= 3 ? "bg-gradient-to-br" : "bg-white/5"}`}
                                            style={
                                                player.rank <= 3
                                                    ? {
                                                        backgroundImage: `linear-gradient(135deg, ${player.color}40, ${player.color}20)`,
                                                    }
                                                    : {}
                                            }
                                        >
                                            {player.rank <= 3 ? (
                                                <span className="text-3xl md:text-4xl">
                                                    {player.avatar}
                                                </span>
                                            ) : (
                                                <span className="text-gray-300">#{player.rank}</span>
                                            )}
                                            {player.rank <= 3 && (
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                                            )}
                                        </div>

                                        {/* Player Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-lg md:text-xl font-bold text-white truncate">
                                                    {formatAddress(player.address)}
                                                </span>
                                                {player.rank === 1 && (
                                                    <Crown className="w-5 h-5 text-amber-400 animate-pulse" />
                                                )}
                                                {player.rank === 2 && (
                                                    <Medal className="w-5 h-5 text-gray-300" />
                                                )}
                                                {player.rank === 3 && (
                                                    <Medal className="w-5 h-5 text-orange-400" />
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-400 mb-2">
                                                {player.title}
                                            </div>

                                            {/* Stats Row */}
                                            <div className="flex flex-wrap gap-4 text-sm">
                                                <div className="flex items-center gap-1.5">
                                                    <TrendingUp className="w-4 h-4 text-blue-400" />
                                                    <span className="text-gray-400">Shares:</span>
                                                    <span className="font-bold text-blue-400">
                                                        {player.shares}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <DollarSign className="w-4 h-4 text-green-400" />
                                                    <span className="text-gray-400">Claimed:</span>
                                                    <span className="font-bold text-green-400">
                                                        ${player.claimed.toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* View Button */}
                                        <button
                                            className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${hoveredRank === player.rank ? "bg-white text-black scale-110" : "bg-white/10 text-white"}`}
                                        >
                                            <Eye className="w-4 h-4" />
                                            <span className="hidden lg:inline">View</span>
                                        </button>
                                    </div>

                                    {/* Mobile View Button */}
                                    <button className="md:hidden w-full mt-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2">
                                        <Eye className="w-4 h-4" />
                                        View Profile
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    <div className="mt-8 flex items-center justify-center gap-4">
                        <button
                            onClick={handlePrevPage}
                            disabled={currentPage === 1}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${currentPage === 1
                                ? "bg-white/5 text-gray-600 cursor-not-allowed"
                                : "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 hover:from-amber-500/30 hover:to-orange-500/30 hover:scale-105 border border-amber-500/30"
                                }`}
                        >
                            <ChevronLeft className="w-5 h-5" />
                            <span className="hidden sm:inline">Previous</span>
                        </button>

                        <div className="flex items-center gap-2 px-6 py-3 bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
                            <span className="text-gray-400 text-sm">Page</span>
                            <span className="text-amber-400 font-bold text-lg">
                                {currentPage}
                            </span>
                            <span className="text-gray-400 text-sm">of</span>
                            <span className="text-white font-semibold">{totalPages}</span>
                        </div>

                        <button
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${currentPage === totalPages
                                ? "bg-white/5 text-gray-600 cursor-not-allowed"
                                : "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 hover:from-amber-500/30 hover:to-orange-500/30 hover:scale-105 border border-amber-500/30"
                                }`}
                        >
                            <span className="hidden sm:inline">Next</span>
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Footer Info */}
                    <div
                        className={`mt-8 text-center transition-all duration-1000 delay-500 ${mounted ? "opacity-100" : "opacity-0"}`}
                    >
                        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 backdrop-blur-sm border border-amber-500/30 rounded-full px-6 py-3">
                            <Trophy className="w-5 h-5 text-amber-400" />
                            <span className="text-sm font-medium text-amber-300">
                                Top 100 players earn exclusive badges at season end
                            </span>
                        </div>
                    </div>

                    {/* Bottom Navigation - Mobile Only */}
                    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-white/10 px-4 py-3 z-50">
                        <div className="flex justify-around items-center">
                            {[
                                {
                                    icon: "https://raw.createusercontent.com/912711b4-2426-4697-8c5c-e64255c8d5e2/",
                                    label: "Home",
                                    href: "/dashboard",
                                },
                                {
                                    icon: "https://raw.createusercontent.com/1afeeb38-cb92-46d1-a6e7-cebff1aa2a70/",
                                    label: "Rank",
                                    href: "/leaderboard",
                                    active: true,
                                },
                                {
                                    icon: "https://raw.createusercontent.com/5bcd8f59-3702-4ba2-a92c-e0570ecde617/",
                                    label: "Quests",
                                    href: "/quests",
                                },
                                {
                                    icon: "https://raw.createusercontent.com/06da9d32-b959-4d32-9fe5-95d26814ddb7/",
                                    label: "Profile",
                                    href: "/profile",
                                },
                            ].map((nav, i) => (
                                <a
                                    key={i}
                                    href={nav.href}
                                    className={`flex flex-col items-center gap-1 transition-all duration-300 ${nav.active ? "scale-110" : "opacity-60"}`}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={nav.icon}
                                        alt={nav.label}
                                        className="w-7 h-7 object-contain"
                                        style={{
                                            filter: nav.active
                                                ? "brightness(1.2) drop-shadow(0 0 8px rgba(251, 191, 36, 0.6))"
                                                : "brightness(0.8)",
                                        }}
                                    />
                                    <span
                                        className={`text-xs font-medium ${nav.active ? "text-amber-400" : "text-gray-400"}`}
                                    >
                                        {nav.label}
                                    </span>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes glow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
      `}</style>
            </div>
        </AuthenticatedRoute>
    );
}
