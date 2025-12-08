"use client";

import AuthenticatedRoute from '@/components/AuthenticatedRoute';
import AppLayout from '@/components/AppLayout';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function QuestsPage() {
    return (
        <AuthenticatedRoute>
            <AppLayout>
                <div className="min-h-screen bg-[#0B0E12] text-white p-4 space-y-6 max-w-[400px] mx-auto">
                    <header className="pt-2">
                        <h1 className="text-2xl font-black heading-font text-neon-blue">QUESTS</h1>
                        <p className="text-sm text-zinc-400">Complete challenges to earn reputation</p>
                    </header>

                    {/* Daily Tasks */}
                    <Card className="card-glow border-[#D4AF37]/30">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg heading-font text-white flex justify-between items-center">
                                <span>Daily Ops</span>
                                <span className="text-xs font-normal text-zinc-500 bg-zinc-900 px-2 py-1 rounded">Resets in 12h</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <QuestItem
                                    title="Raid a Rival"
                                    reward="10 Rep"
                                    progress={1}
                                    total={1}
                                    completed={true}
                                />
                                <QuestItem
                                    title="Claim Profit"
                                    reward="5 Rep"
                                    progress={0}
                                    total={1}
                                />
                                <QuestItem
                                    title="Recruit an Associate"
                                    reward="20 Shares"
                                    progress={0}
                                    total={1}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Weekly Challenges */}
                    <Card className="card-glow border-[#4A87FF]/30">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg heading-font text-white">Weekly Syndicate</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <QuestItem
                                    title="Execute 5 Raids"
                                    reward="50 Shares"
                                    progress={3}
                                    total={5}
                                />
                                <QuestItem
                                    title="Go High-Stakes"
                                    reward="100 Rep"
                                    progress={0}
                                    total={1}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </AppLayout>
        </AuthenticatedRoute>
    );
}

function QuestItem({ title, reward, progress, total, completed = false }: any) {
    const pct = (progress / total) * 100;

    return (
        <div className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-xl border border-zinc-800">
            <div className="flex-1 mr-4">
                <div className="flex justify-between mb-1">
                    <span className={completed ? "text-zinc-500 line-through" : "text-zinc-200 font-medium"}>{title}</span>
                    <span className="text-xs text-[#D4AF37] font-bold">{reward}</span>
                </div>
                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${completed ? "bg-[#3DFF72]" : "bg-[#4A87FF]"}`}
                        style={{ width: `${pct}%` }}
                    />
                </div>
            </div>
            <div>
                {completed ? (
                    <div className="text-[#3DFF72] text-xl">✓</div>
                ) : (
                    <div className="text-zinc-500 text-xs font-mono">{progress}/{total}</div>
                )}
            </div>
        </div>
    );
}
