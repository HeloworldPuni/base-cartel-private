
"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import AuthenticatedRoute from "@/components/AuthenticatedRoute";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatCard } from "@/components/ui/StatCard";
import Link from "next/link";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { Users, Search, Sword } from "lucide-react"; // Import Premium Icons if available or generic

// Types
interface Clan {
    id: string;
    slug: string;
    name: string;
    tag: string;
    memberCount: number;
    owner: {
        farcasterHandle: string | null;
        walletAddress: string;
    };
}

export default function ClansPage() {
    const { address } = useAccount();
    const router = useRouter();
    const [clans, setClans] = useState<Clan[]>([]);
    const [loading, setLoading] = useState(true);
    const [myClan, setMyClan] = useState<any>(null);
    const [showCreate, setShowCreate] = useState(false);

    // Create Form
    const [newName, setNewName] = useState("");
    const [newTag, setNewTag] = useState("");
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");

    // Fetch Data
    useEffect(() => {
        const loadData = async () => {
            if (!address) return;
            try {
                // Fetch All Clans (Assume logic correct)
                const resClans = await fetch('/api/clans');
                const dataClans = await resClans.json();
                setClans(Array.isArray(dataClans) ? dataClans : []);

                // Check My Clan
                const resMe = await fetch(`/api/me/clan?address=${address}`, {
                    headers: { 'x-wallet-address': address }
                });
                const dataMe = await resMe.json();
                if (dataMe && dataMe.clan) {
                    setMyClan(dataMe.clan);
                }
            } catch (e) {
                console.error("Failed to load clans", e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [address]);

    const handleCreate = async () => {
        if (!address) return;
        setCreating(true);
        setError("");

        try {
            const res = await fetch('/api/clans', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-wallet-address': address
                },
                body: JSON.stringify({ name: newName, tag: newTag })
            });

            const data = await res.json();
            if (res.ok) {
                router.push(`/clans/${data.slug}`);
            } else {
                setError(data.error || "Failed to create clan");
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setCreating(false);
        }
    };

    return (
        <AuthenticatedRoute>
            <AppLayout>
                <div className="min-h-screen bg-[#0B0E12] text-white p-4 space-y-6 pb-32 max-w-[400px] mx-auto">
                    {/* HERO HEADER - Matches Dashboard */}
                    <header className="flex flex-col items-center pt-2 pb-4 relative z-10 w-full">
                        <div className="relative mb-2">
                            <div className="text-4xl filter drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">⚔️</div>
                        </div>

                        <div className="flex items-center justify-center gap-3 w-full px-8">
                            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#3B82F6]/20 to-transparent" />
                            <Badge variant="outline" className="bg-[#1A1D26] text-[#3B82F6] border-[#3B82F6]/30 text-[10px] tracking-wider uppercase px-3 py-1 shadow-[0_0_10px_rgba(59,130,246,0.1)]">
                                Syndicates
                            </Badge>
                            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#3B82F6]/20 to-transparent" />
                        </div>

                        <h2 className="text-zinc-500 text-[10px] font-mono tracking-[0.2em] mt-3 uppercase opacity-70">
                            Dominion & Influence
                        </h2>
                    </header>

                    {/* Actions */}
                    <div className="flex justify-between items-center px-1">
                        {myClan ? (
                            <Button
                                className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 border border-blue-400/20 shadow-[0_0_20px_rgba(37,99,235,0.2)] text-white font-bold tracking-wider"
                                onClick={() => router.push(`/clans/${myClan.slug}`)}
                            >
                                ENTER MY SYNDICATE
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                className="w-full border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300"
                                onClick={() => setShowCreate(!showCreate)}
                            >
                                {showCreate ? "Cancel Establishment" : "+ Establish New Syndicate"}
                            </Button>
                        )}
                    </div>

                    {/* Create Section (Styled) */}
                    {showCreate && !myClan && (
                        <div className="bg-[#11141D] border border-zinc-800 rounded-xl p-4 space-y-4 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />

                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <Label className="text-xs text-blue-400 font-bold uppercase tracking-wider">Syndicate Name</Label>
                                    <Input
                                        placeholder="EX: The Iron Bank"
                                        value={newName}
                                        onChange={e => setNewName(e.target.value)}
                                        className="bg-[#0B0E12] border-zinc-700 text-white placeholder:text-zinc-600 focus:border-blue-500/50"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-blue-400 font-bold uppercase tracking-wider">Tag (Ticker)</Label>
                                    <Input
                                        placeholder="BANK"
                                        value={newTag}
                                        onChange={e => setNewTag(e.target.value.toUpperCase())}
                                        maxLength={5}
                                        className="bg-[#0B0E12] border-zinc-700 text-white placeholder:text-zinc-600 focus:border-blue-500/50 font-mono"
                                    />
                                </div>
                            </div>

                            {error && <p className="text-red-400 text-xs bg-red-900/20 p-2 rounded border border-red-500/20">{error}</p>}

                            <Button
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold"
                                onClick={handleCreate}
                                disabled={creating}
                            >
                                {creating ? "Minting Syndicate..." : "Confirm & Create"}
                            </Button>
                        </div>
                    )}

                    {/* Clan List (Styled) */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 px-1 mb-2">
                            <Search className="w-3 h-3 text-zinc-500" />
                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Active Factions</span>
                        </div>

                        {loading ? (
                            <div className="space-y-2 animate-pulse">
                                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-zinc-900 rounded-xl border border-zinc-800" />)}
                            </div>
                        ) : clans.length === 0 ? (
                            <div className="text-center py-10 text-zinc-600 text-sm">
                                <p>No syndicates found.</p>
                                <p className="text-xs mt-1">Be the first to create one.</p>
                            </div>
                        ) : (
                            clans.map(clan => (
                                <Link href={`/clans/${clan.slug}`} key={clan.id} className="block group">
                                    <StatCard className="bg-[#11141D] border-zinc-800 group-hover:border-blue-500/30 transition-all group-active:scale-[0.98]">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                {/* Tag Avatar */}
                                                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-zinc-800 to-[#1A1D26] flex items-center justify-center border border-zinc-700 shadow-lg group-hover:shadow-blue-500/10 transition-shadow">
                                                    <span className="text-xs font-black text-white tracking-tighter">{clan.tag}</span>
                                                </div>

                                                {/* Info */}
                                                <div>
                                                    <h3 className="font-bold text-zinc-100 group-hover:text-blue-400 transition-colors text-sm">{clan.name}</h3>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[10px] text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                                                            Leader: {clan.owner.farcasterHandle || clan.owner.walletAddress.slice(0, 4)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Stats */}
                                            <div className="text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-white font-mono font-bold text-sm">{clan.memberCount}</span>
                                                    <span className="text-[9px] text-zinc-500 uppercase tracking-wide">Members</span>
                                                </div>
                                            </div>
                                        </div>
                                    </StatCard>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </AppLayout>
        </AuthenticatedRoute>
    );
}
