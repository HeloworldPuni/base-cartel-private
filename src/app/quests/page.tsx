"use client";

import AuthenticatedRoute from '@/components/AuthenticatedRoute';
import AppLayout from '@/components/AppLayout';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { fadeUp, slideLeft, scaleHover, scaleTap, motionPage, motionList } from "@/components/ui/motionTokens";
import { SFX, playSound } from "@/lib/audio";
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { toast } from 'sonner';

interface Quest {
    id: string;
    slug: string;
    title: string;
    description: string;
    category: string;
    frequency: string;
    rewardRep: number;
    rewardShares: number;
    maxCompletions: number;
    progress: {
        completedCount: number;
        completed: boolean;
    };
}

interface LevelInfo {
    current: { id: number; title: string; minRep: number };
    next: { id: number; title: string; minRep: number } | null;
    progress: number;
}

export default function QuestsPage() {
    const { address } = useAccount();
    const [quests, setQuests] = useState<Quest[]>([]);
    const [rep, setRep] = useState(0);
    const [level, setLevel] = useState<LevelInfo | null>(null);
    const [pendingShares, setPendingShares] = useState({ count: 0, totalAmount: 0 });
    const [loading, setLoading] = useState(true);
    const [completing, setCompleting] = useState<string | null>(null);

    const fetchQuests = async () => {
        if (!address) return;
        try {
            const res = await fetch(`/api/quests?address=${address}`);
            const data = await res.json();
            if (data.quests) {
                setQuests(data.quests);
                setRep(data.rep);
                setLevel(data.level);
                setPendingShares(data.pendingShares);
            }
        } catch (error) {
            console.error("Failed to fetch quests", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuests();
    }, [address]);

    const handleComplete = async (questSlug: string) => {
        if (!address || completing) return;
        setCompleting(questSlug);
        playSound('click');

        try {
            const res = await fetch('/api/quests/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address, questSlug })
            });
            const data = await res.json();

            if (data.success) {
                playSound('success');
                if (data.shareStatus === 'PENDING') {
                    toast.success(`Quest Completed! +${data.sharesAwarded} Shares (Pending Review)`);
                } else {
                    toast.success(`Quest Completed! +${data.newRep} REP`);
                }
                // Refresh data
                fetchQuests();
            } else {
                playSound('error');
                toast.error(data.error || "Failed to complete quest");
            }
        } catch (error) {
            console.error("Error completing quest", error);
            toast.error("Network error");
        } finally {
            setCompleting(null);
        }
    };

    const dailyQuests = quests.filter(q => q.frequency === 'DAILY');
    const weeklyQuests = quests.filter(q => q.frequency === 'WEEKLY');
    const referralQuests = quests.filter(q => q.category === 'REFERRAL');

    return (
        <AuthenticatedRoute>
            <AppLayout>
                <motion.div {...motionPage}>
                    <header className="pt-2">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h1 className="text-2xl font-black heading-font text-neon-blue">QUESTS</h1>
                                <p className="text-sm text-zinc-400">Complete challenges to earn reputation</p>
                            </div>
                            <div className="flex flex-col items-end">
                                <div className="bg-zinc-900 border border-zinc-700 px-3 py-1 rounded-full flex items-center gap-2 mb-1">
                                    <span className="text-xs text-zinc-400">REP</span>
                                    <span className="text-lg font-bold text-[#D4AF37]">{rep}</span>
                                </div>
                                {level && (
                                    <span className="text-xs text-zinc-500 font-mono">
                                        LVL {level.current.id}: {level.current.title}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Level Progress */}
                        {level && (
                            <div className="mb-6">
                                <div className="flex justify-between text-xs text-zinc-500 mb-1">
                                    <span>Progress to {level.next?.title || "Max Level"}</span>
                                    <span>{level.progress}%</span>
                                </div>
                                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-blue-600 to-purple-600"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${level.progress}%` }}
                                        transition={{ duration: 1 }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Pending Shares Alert */}
                        {pendingShares.totalAmount > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg flex justify-between items-center"
                            >
                                <div className="text-sm text-blue-200">
                                    <span className="font-bold">{pendingShares.totalAmount} Shares</span> are pending seasonal approval.
                                </div>
                                <span className="text-xs text-blue-400">Reviewing...</span>
                            </motion.div>
                        )}
                    </header>

                    {/* Daily Tasks */}
                    <Card className="card-glow border-[#D4AF37]/30 mt-6">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg heading-font text-white flex justify-between items-center">
                                <span>Daily Ops</span>
                                <span className="text-xs font-normal text-zinc-500 bg-zinc-900 px-2 py-1 rounded">Resets daily UTC</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {loading ? (
                                <div className="space-y-2 animate-pulse">
                                    <div className="h-12 bg-zinc-900 rounded"></div>
                                    <div className="h-12 bg-zinc-900 rounded"></div>
                                </div>
                            ) : dailyQuests.length > 0 ? (
                                <motion.div className="space-y-3" initial="hidden" animate="visible" variants={motionList}>
                                    {dailyQuests.map((q, i) => (
                                        <QuestItem
                                            key={q.slug}
                                            quest={q}
                                            onComplete={() => handleComplete(q.slug)}
                                            isCompleting={completing === q.slug}
                                            delay={i * 0.1}
                                        />
                                    ))}
                                </motion.div>
                            ) : (
                                <p className="text-zinc-500 text-sm">No daily quests available.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Referral / Share Rewards */}
                    <Card className="card-glow border-purple-500/30 mt-6">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg heading-font text-white">Recruitment Drive</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {loading ? (
                                <div className="space-y-2 animate-pulse">
                                    <div className="h-12 bg-zinc-900 rounded"></div>
                                </div>
                            ) : referralQuests.length > 0 ? (
                                <motion.div className="space-y-3" initial="hidden" animate="visible" variants={motionList}>
                                    {referralQuests.map((q, i) => (
                                        <QuestItem
                                            key={q.slug}
                                            quest={q}
                                            onComplete={() => handleComplete(q.slug)}
                                            isCompleting={completing === q.slug}
                                            delay={i * 0.1}
                                        />
                                    ))}
                                </motion.div>
                            ) : (
                                <p className="text-zinc-500 text-sm">No referral quests available.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Weekly Challenges */}
                    <Card className="card-glow border-[#4A87FF]/30 mt-6">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg heading-font text-white">Weekly Syndicate</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {loading ? (
                                <div className="space-y-2 animate-pulse">
                                    <div className="h-12 bg-zinc-900 rounded"></div>
                                </div>
                            ) : weeklyQuests.length > 0 ? (
                                <motion.div className="space-y-3" initial="hidden" animate="visible" variants={motionList}>
                                    {weeklyQuests.map((q, i) => (
                                        <QuestItem
                                            key={q.slug}
                                            quest={q}
                                            onComplete={() => handleComplete(q.slug)}
                                            isCompleting={completing === q.slug}
                                            delay={i * 0.1 + 0.2}
                                        />
                                    ))}
                                </motion.div>
                            ) : (
                                <p className="text-zinc-500 text-sm">No weekly quests available.</p>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </AppLayout>
        </AuthenticatedRoute>
    );
}

function QuestItem({ quest, onComplete, isCompleting, delay = 0 }: { quest: Quest, onComplete: () => void, isCompleting: boolean, delay: number }) {
    const isCompleted = quest.progress.completed;
    const progressText = `${quest.progress.completedCount}/${quest.maxCompletions}`;
    const pct = (quest.progress.completedCount / quest.maxCompletions) * 100;

    return (
        <motion.div
            variants={slideLeft}
            transition={{ delay, duration: 0.3 }}
            className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-xl border border-zinc-800"
        >
            <div className="flex-1 mr-4">
                <div className="flex justify-between mb-1">
                    <span className={isCompleted ? "text-zinc-500 line-through" : "text-zinc-200 font-medium"}>{quest.title}</span>
                    <div className="flex gap-2">
                        {quest.rewardRep > 0 && <span className="text-xs text-[#D4AF37] font-bold">+{quest.rewardRep} REP</span>}
                        {quest.rewardShares > 0 && <span className="text-xs text-purple-400 font-bold">+{quest.rewardShares} Shares*</span>}
                    </div>
                </div>
                <div className="flex justify-between items-center text-xs text-zinc-500 mb-1">
                    <span>{quest.description}</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                        className={`h-full ${isCompleted ? "bg-[#3DFF72]" : "bg-[#4A87FF]"}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, delay: delay + 0.2 }}
                    />
                </div>
            </div>
            <div className="flex flex-col items-end gap-1">
                {isCompleted ? (
                    <div className="text-[#3DFF72] text-xl">✓</div>
                ) : (
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={onComplete}
                        disabled={isCompleting}
                        className="h-7 text-xs bg-[#4A87FF]/10 text-[#4A87FF] hover:bg-[#4A87FF]/20 border border-[#4A87FF]/30"
                    >
                        {isCompleting ? "..." : "Verify"}
                    </Button>
                )}
                <div className="text-zinc-600 text-[10px] font-mono">{progressText}</div>
            </div>
        </motion.div>
    );
}
