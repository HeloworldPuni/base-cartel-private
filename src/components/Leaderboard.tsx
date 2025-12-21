"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RankRow } from "@/components/ui/RankRow";
import { haptics } from "@/lib/haptics";
import { getCartelTitle, getTitleTheme } from "@/lib/cartel-titles";
import MyClanModal from "./MyClanModal";
import { SFX, playSound } from "@/lib/audio";
import { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { fadeUp, staggerList, shimmer } from "@/components/ui/motionTokens";

import { useViewProfile } from '@coinbase/onchainkit/minikit';

interface Player {
    rank: number;
    name: string;
    shares: number;
    totalClaimed: number;
    fid?: number;
    address: string;
}

function LeaderboardRow({ player, index, onInternalView }: { player: Player, index: number, onInternalView: () => void }) {
    // Gracefully handle missing hook context if testing outside MiniApp
    let viewProfile: any = () => { };
    try {
        // eslint-disable-next-line
        viewProfile = useViewProfile(player.fid ? String(player.fid) : undefined);
    } catch (e) {
        // Fallback or ignore
    }

    const handleView = () => {
        if (player.fid) {
            viewProfile();
        } else {
            onInternalView();
        }
    };

    const title = getCartelTitle(player.rank, player.shares);
    const theme = getTitleTheme(title);
    const isTopThree = player.rank <= 3;
    const isTopTen = player.rank <= 10;

    return (
        <motion.div variants={fadeUp}>
            <RankRow
                index={index}
                className={`p-3 border transition-all duration-300 ${player.rank === 1
                    ? "bg-gradient-to-r from-[#D4AF37]/20 to-[#D4AF37]/5 border-[#D4AF37]/50 glow-gold scale-[1.02]"
                    : player.rank === 2
                        ? "bg-gradient-to-r from-zinc-400/20 to-zinc-400/5 border-zinc-400/50"
                        : player.rank === 3
                            ? "bg-gradient-to-r from-orange-600/20 to-orange-600/5 border-orange-600/50"
                            : isTopTen
                                ? "bg-[#1B1F26] border-[#4A87FF]/20"
                                : "bg-[#1B1F26] border-zinc-800"
                    }`}
            >
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`text-2xl font-black ${player.rank === 1 ? "text-[#D4AF37]" :
                            player.rank === 2 ? "text-zinc-300" :
                                player.rank === 3 ? "text-orange-500" :
                                    "text-zinc-500"
                            }`}>
                            {player.rank === 1 && (
                                <motion.div
                                    animate={{ opacity: [1, 0.6, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="inline-block"
                                >
                                    👑
                                </motion.div>
                            )}
                            {player.rank === 2 && "🥈"}
                            {player.rank === 3 && "🥉"}
                            {player.rank > 3 && `#${player.rank}`}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <div
                                    onClick={handleView}
                                    className={`font-bold truncate cursor-pointer hover:underline ${isTopThree ? "text-white" : "text-zinc-300"}`}
                                >
                                    {player.name}
                                </div>
                                <div className={`text-[10px] px-1.5 py-0.5 rounded border border-white/10 ${theme.color} bg-black/30 flex items-center gap-1 whitespace-nowrap`}>
                                    <span>{theme.icon}</span>
                                    <span className="uppercase tracking-wider font-bold">{title}</span>
                                </div>
                            </div>
                            <div className="text-xs text-zinc-500 flex items-center gap-2 mt-0.5">
                                <span className="text-[#4A87FF]">{player.shares} shares</span>
                                <span>•</span>
                                <span className="text-[#3DFF72]">${player.totalClaimed.toLocaleString()} claimed</span>
                            </div>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleView}
                        className="text-xs h-7 border-[#4A87FF]/30 hover:border-[#4A87FF] hover:bg-[#4A87FF]/10 text-[#4A87FF]"
                    >
                        View
                    </Button>

                </div>
            </RankRow>
        </motion.div>
    );
}

export default function Leaderboard() {
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchLeaderboard = async (pageNum: number, isLoadMore = false) => {
        try {
            if (isLoadMore) setLoadingMore(true);
            const res = await fetch(`/api/cartel/leaderboard?page=${pageNum}&limit=10`);
            const data = await res.json();

            console.log("Leaderboard API Data:", data); // Diagnostic Log

            const entries = data.leaderboard?.entries || [];
            const total = data.leaderboard?.total || 0;

            if (entries && entries.length > 0) {
                if (isLoadMore) {
                    setPlayers(prev => [...prev, ...entries]);
                } else {
                    setPlayers(entries);
                }

                // Check if we reached the end or max limit (100)
                const currentTotal = isLoadMore ? players.length + entries.length : entries.length;
                if (currentTotal >= (total || 100) || currentTotal >= 100 || entries.length === 0) {
                    setHasMore(false);
                }
            } else if (!isLoadMore) {
                // MOCK DATA FOR AGENT/DEMO
                setPlayers([
                    { rank: 1, name: "AgentZero", shares: 1000, totalClaimed: 5000, address: "0x123...mock", fid: 1 },
                    { rank: 2, name: "NeonBlade", shares: 850, totalClaimed: 3200, address: "0x456...mock" },
                    { rank: 3, name: "CyberPunk", shares: 720, totalClaimed: 2100, address: "0x789...mock" },
                    { rank: 4, name: "ShadowRunner", shares: 600, totalClaimed: 1500, address: "0xabc...mock" },
                    { rank: 5, name: "NetStalker", shares: 450, totalClaimed: 900, address: "0xdef...mock" }
                ]);
                setHasMore(false);
            }
        } catch (error: any) {
            console.error("Failed to fetch leaderboard:", error);
            setError(error.message || "Unknown error occurred");
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard(1);
    }, []);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchLeaderboard(nextPage, true);
        playSound('click');
        haptics.light();
    };

    const handleViewProfile = async (address?: string) => {
        if (address) {
            playSound('click');
            await haptics.light();
            setSelectedPlayer(address);
        }
    };

    return (
        <div className="min-h-screen bg-[#0B0E12] text-white p-4 pb-24 max-w-[400px] mx-auto">
            <Card className="card-glow border-[#4A87FF]/30">
                <CardHeader className="pb-4">
                    <div className="text-center">
                        <CardTitle className="text-2xl heading-font text-neon-blue mb-1">
                            🏆 Cartel Rankings
                        </CardTitle>
                        <p className="text-sm text-[#D4AF37]">Season 1</p>
                    </div>
                </CardHeader>
                <CardContent>
                    {error ? (
                        <div className="p-4 bg-red-900/20 border border-red-500/50 rounded text-red-200 text-center">
                            <p className="font-bold">Error loading leaderboard</p>
                            <p className="text-xs mt-2 font-mono">{error}</p>
                            <Button onClick={() => window.location.reload()} variant="outline" className="mt-4 border-red-500 text-red-500 hover:bg-red-500/10">
                                Retry
                            </Button>
                        </div>
                    ) : loading ? (
                        <div className="space-y-4 animate-pulse">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-16 bg-zinc-900 rounded-lg"></div>
                            ))}
                        </div>
                    ) : (
                        <>
                            <motion.div
                                initial="hidden"
                                animate="visible"
                                variants={staggerList}
                                className="space-y-2"
                            >
                                {players.map((player, index) => (
                                    <LeaderboardRow
                                        key={`${player.rank}-${player.address}`}
                                        player={player}
                                        index={index}
                                        onInternalView={() => handleViewProfile(player.address)}
                                    />
                                ))}
                            </motion.div>

                            {hasMore && (
                                <div className="mt-4 text-center">
                                    <Button
                                        onClick={handleLoadMore}
                                        disabled={loadingMore}
                                        variant="ghost"
                                        className="text-[#4A87FF] hover:text-[#4A87FF]/80 hover:bg-[#4A87FF]/10 w-full border border-dashed border-[#4A87FF]/30"
                                    >
                                        {loadingMore ? (
                                            <span className="flex items-center gap-2">
                                                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                Loading...
                                            </span>
                                        ) : (
                                            "Load More Agents (Next 10)"
                                        )}
                                    </Button>
                                </div>
                            )}
                        </>
                    )}

                    {!loading && players.length === 0 && (
                        <div className="text-center py-10 text-zinc-500 bg-zinc-900/50 rounded-lg border border-zinc-800 m-4">
                            <p>No agents found.</p>
                            <p className="text-xs mt-2 text-zinc-700">Debug: Check /api/cartel/leaderboard - {page} </p>
                        </div>
                    )}

                    <div className="mt-6 p-4 bg-[#4A87FF]/5 border border-[#4A87FF]/20 rounded-lg text-center">
                        <p className="text-sm text-zinc-400">
                            Top 100 players earn <span className="text-[#D4AF37] font-bold">exclusive badges</span> at season end
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Profile Modal */}
            {selectedPlayer && (
                <MyClanModal
                    isOpen={!!selectedPlayer}
                    onClose={() => setSelectedPlayer(null)}
                    address={selectedPlayer}
                />
            )}
        </div>
    );
}
