
"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAccount } from 'wagmi';

interface Quest {
    id: string;
    title: string;
    description: string;
    category: string;
    rewardRep: number;
    rewardShares: number;
    progress: {
        current: number;
        target: number;
        completed: boolean;
        claimed: boolean;
    };
}

interface Tier {
    title: string;
    perks: string[];
}

export default function QuestBoard() {
    const { address } = useAccount();
    const [quests, setQuests] = useState<Quest[]>([]);
    const [rep, setRep] = useState(0);
    const [tier, setTier] = useState<Tier | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!address) return;

        const fetchQuests = async () => {
            try {
                const res = await fetch(`/api/quests/active?address=${address}`);
                const data = await res.json();
                if (data.quests) {
                    setQuests(data.quests);
                    setRep(data.rep);
                    setTier(data.tier);
                }
            } catch (e) {
                console.error("Failed to load quests", e);
            } finally {
                setLoading(false);
            }
        };

        fetchQuests();
        // Poll every 10s for event updates
        const interval = setInterval(fetchQuests, 10000);
        return () => clearInterval(interval);
    }, [address]);

    // if (!address) return <div className="text-zinc-500 text-sm p-4 text-center">Connect wallet to view operations.</div>;
    // MOCK MODE: If no address, load mock quests
    useEffect(() => {
        if (!address) {
            setQuests([
                {
                    id: 'mock-1', title: 'Daily Raid', description: 'Complete a raid to earn respect.', category: 'GAMEPLAY', rewardRep: 50, rewardShares: 10,
                    progress: { current: 0, target: 1, completed: false, claimed: false }
                },
                {
                    id: 'mock-2', title: 'Syndicate Growth', description: 'Recruit 3 new members.', category: 'REFERRAL', rewardRep: 100, rewardShares: 50,
                    progress: { current: 1, target: 3, completed: false, claimed: false }
                }
            ]);
            setRep(1250);
            setTier({ title: 'Lieutenant', perks: ['Fee Reduction'] });
            setLoading(false);
        }
    }, [address]);
    if (loading) return <div className="text-zinc-500 text-sm p-4 text-center animate-pulse">Loading operations data...</div>;

    const gameplayQuests = quests.filter(q => q.category === 'GAMEPLAY');
    const referralQuests = quests.filter(q => q.category === 'REFERRAL' || q.category === 'SOCIAL');

    return (
        <div className="space-y-6">

            {/* REP HEADER */}
            <div className="flex items-center justify-between bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                <div>
                    <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Reputation</div>
                    <div className="text-2xl font-black text-[#D4AF37] flex items-center gap-2">
                        {rep} <span className="text-sm text-zinc-400 font-normal">REP</span>
                    </div>
                </div>
                <div className="text-right">
                    <Badge variant="outline" className="bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/30 mb-1">
                        {tier?.title || "Unknown"}
                    </Badge>
                    <div className="text-[10px] text-zinc-500">
                        {tier?.perks?.[0] || "No Active Perks"}
                    </div>
                </div>
            </div>

            {/* GAMEPLAY */}
            <div className="space-y-3">
                <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                    ⚔️ Active Operations
                </h3>
                {gameplayQuests.map(q => (
                    <QuestItem key={q.id} quest={q} />
                ))}
            </div>

            {/* GROWTH */}
            <div className="space-y-3">
                <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                    🤝 Syndicate Growth
                </h3>
                {referralQuests.map(q => (
                    <QuestItem key={q.id} quest={q} />
                ))}
            </div>

        </div>
    );
}

function QuestItem({ quest }: { quest: Quest }) {
    const isCompleted = quest.progress.completed;
    const percent = Math.min(100, Math.floor((quest.progress.current / quest.progress.target) * 100));

    return (
        <div className={`p-3 rounded-md border transition-all ${isCompleted ? 'bg-green-900/10 border-green-500/30' : 'bg-zinc-900/40 border-zinc-800'}`}>
            <div className="flex justify-between items-start mb-2">
                <div>
                    <div className={`text-sm font-bold ${isCompleted ? 'text-green-400' : 'text-zinc-200'}`}>
                        {quest.title}
                    </div>
                    <div className="text-[10px] text-zinc-500">{quest.description}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                    {quest.rewardRep > 0 && (
                        <Badge variant="secondary" className="text-[10px] h-5 bg-blue-500/10 text-blue-400">
                            +{quest.rewardRep} REP
                        </Badge>
                    )}
                    {quest.rewardShares > 0 && (
                        <Badge variant="secondary" className="text-[10px] h-5 bg-orange-500/10 text-orange-400">
                            +{quest.rewardShares} Shares
                        </Badge>
                    )}
                </div>
            </div>

            {/* Progress */}
            <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-zinc-500">
                    <span>Progress</span>
                    <span>{quest.progress.current} / {quest.progress.target}</span>
                </div>
                <Progress value={percent} className="h-1 bg-zinc-800" indicatorClassName={isCompleted ? 'bg-green-500' : 'bg-blue-500'} />
            </div>

            {/* Status Footer */}
            <div className="mt-2 text-[10px] flex justify-end">
                {isCompleted ? (
                    <span className="text-green-500 font-bold flex items-center gap-1">
                        ✓ COMPLETED
                    </span>
                ) : (
                    <span className="text-zinc-600">
                        IN PROGRESS
                    </span>
                )}
            </div>
        </div>
    );
}
