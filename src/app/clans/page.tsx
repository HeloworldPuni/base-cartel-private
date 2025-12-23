"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import AuthenticatedRoute from "@/components/AuthenticatedRoute";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { Users, Search, Crown, Shield, Plus, ArrowRight } from "lucide-react";

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
    const [myClan, setMyClan] = useState<Clan | null>(null);
    const [showCreate, setShowCreate] = useState(false);

    // Create Form
    const [newName, setNewName] = useState("");
    const [newTag, setNewTag] = useState("");
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

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
        } catch (e) {
            setError(e instanceof Error ? e.message : "An error occurred");
        } finally {
            setCreating(false);
        }
    };

    return (
        <AuthenticatedRoute>
            <AppLayout>
                <div className="min-h-screen text-white pb-32 w-full overflow-x-hidden relative">
                    {/* Animated Background from Dashboard */}
                    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                        <div className="absolute inset-0 opacity-10 mafia-pattern"></div>
                        <div
                            className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#0066FF] rounded-full opacity-10 blur-3xl"
                            style={{ animation: "float 20s ease-in-out infinite" }}
                        ></div>
                        <div
                            className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#00D4FF] rounded-full opacity-10 blur-3xl"
                            style={{ animation: "float 25s ease-in-out infinite reverse" }}
                        ></div>
                    </div>

                    <div className="relative z-10 max-w-7xl mx-auto p-4 space-y-8">

                        {/* HEADER & ACTIONS CONTAINER */}
                        <div className="max-w-3xl mx-auto space-y-8">
                            {/* HEADER */}
                            <header className="flex flex-col items-center pt-8 pb-4 text-center space-y-4">
                                <div className="relative">
                                    <span className="absolute -inset-4 bg-blue-500/20 rounded-full blur-xl animate-pulse"></span>
                                    <Crown className="w-12 h-12 text-[#FFD700] drop-shadow-[0_0_15px_rgba(255,215,0,0.5)] relative z-10" />
                                </div>

                                <div>
                                    <h1 className="text-4xl font-black tracking-tighter uppercase bg-gradient-to-br from-white via-blue-100 to-zinc-500 bg-clip-text text-transparent">
                                        Syndicates
                                    </h1>
                                    <p className="text-blue-400 text-xs font-mono tracking-[0.3em] uppercase mt-2">
                                        Dominion & Influence
                                    </p>
                                </div>
                            </header>

                            {/* ACTIONS / MY CLAN */}
                            <div style={{ animation: mounted ? "slideUp 0.5s ease-out 0.1s backwards" : "none" }}>
                                {myClan ? (
                                    <div className="bg-gradient-to-r from-blue-900/40 to-black/40 border border-blue-500/30 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden group hover:border-blue-500/50 transition-all">
                                        <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors"></div>
                                        <div className="relative flex items-center justify-between">
                                            <div>
                                                <p className="text-blue-300 text-xs font-bold uppercase tracking-widest mb-1">Your Allegiance</p>
                                                <h3 className="text-2xl font-bold text-white">{myClan.name} <span className="text-zinc-500 text-lg">[{myClan.tag}]</span></h3>
                                            </div>
                                            <Link href={`/clans/${myClan.slug}`}>
                                                <button
                                                    className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl shadow-lg shadow-blue-600/20 transition-all hover:scale-105"
                                                    aria-label={`View ${myClan.name}`}
                                                >
                                                    <ArrowRight className="w-6 h-6" />
                                                </button>
                                            </Link>
                                        </div>
                                    </div>
                                ) : (
                                    !showCreate && (
                                        <button
                                            onClick={() => setShowCreate(true)}
                                            className="w-full group relative bg-gradient-to-br from-[#00D4FF] via-[#0099CC] to-[#00D4FF] backdrop-blur-xl border border-[#00D4FF] rounded-2xl p-6 hover:shadow-xl hover:shadow-[#00D4FF]/50 transition-all duration-300 hover:scale-[1.02]"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-[#00D4FF]/20 to-transparent rounded-2xl"></div>
                                            <div className="relative flex items-center justify-center gap-3">
                                                <Plus className="w-6 h-6 text-white" />
                                                <span className="text-xl font-bold text-white uppercase tracking-wider">Establish New Syndicate</span>
                                            </div>
                                        </button>
                                    )
                                )}
                            </div>

                            {/* CREATE FORM */}
                            {showCreate && !myClan && (
                                <div
                                    className="bg-[#0F172A]/80 border border-blue-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl"
                                    style={{ animation: "scaleIn 0.3s ease-out" }}
                                >
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />

                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-lg font-bold text-white">New Syndicate</h3>
                                        <button onClick={() => setShowCreate(false)} className="text-zinc-500 hover:text-white transition-colors text-sm">Cancel</button>
                                    </div>

                                    <div className="space-y-5">
                                        <div className="space-y-2">
                                            <Label className="text-xs text-blue-400 font-bold uppercase tracking-wider">Syndicate Name</Label>
                                            <Input
                                                placeholder="The Iron Bank"
                                                value={newName}
                                                onChange={e => setNewName(e.target.value)}
                                                className="bg-black/50 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-blue-500/50 h-12 rounded-xl"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-blue-400 font-bold uppercase tracking-wider">Tag (Ticker)</Label>
                                            <Input
                                                placeholder="BANK"
                                                value={newTag}
                                                onChange={e => setNewTag(e.target.value.toUpperCase())}
                                                maxLength={5}
                                                className="bg-black/50 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-blue-500/50 font-mono h-12 rounded-xl"
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="mt-4 p-3 bg-red-900/20 border border-red-500/20 rounded-lg">
                                            <p className="text-red-400 text-xs flex items-center gap-2">
                                                <span>⚠️</span> {error}
                                            </p>
                                        </div>
                                    )}

                                    <button
                                        className="w-full mt-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:grayscale"
                                        onClick={handleCreate}
                                        disabled={creating}
                                    >
                                        {creating ? "Minting Syndicate..." : "Confirm & Create"}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* CLAN LIST */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 px-1 mb-2 border-b border-zinc-800 pb-2">
                                <Search className="w-4 h-4 text-zinc-500" />
                                <span className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Active Factions</span>
                            </div>

                            {loading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-24 bg-zinc-900/50 rounded-2xl border border-zinc-800/50 animate-pulse" />
                                    ))}
                                </div>
                            ) : clans.length === 0 ? (
                                <div className="text-center py-16 bg-[#0F172A]/30 rounded-2xl border border-dashed border-zinc-800">
                                    <Shield className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                                    <p className="text-zinc-500 font-medium">No syndicates found.</p>
                                    <p className="text-xs text-zinc-600 mt-1">Be the first to create one.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {clans.map((clan, idx) => (
                                        <Link
                                            href={`/clans/${clan.slug}`}
                                            key={clan.id}
                                            className="block group"
                                            style={{ animation: mounted ? `slideUp 0.5s ease-out ${0.2 + (idx * 0.1)}s backwards` : "none" }}
                                        >
                                            <div className="bg-[#0F172A]/60 backdrop-blur-md border border-zinc-800 rounded-2xl p-4 transition-all duration-300 group-hover:border-blue-500/50 group-hover:bg-[#0F172A]/80 group-hover:shadow-[0_0_20px_rgba(0,102,255,0.1)] group-active:scale-[0.99] flex items-center justify-between">

                                                <div className="flex items-center gap-4">
                                                    {/* Avatar */}
                                                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-zinc-800 to-black flex items-center justify-center border border-zinc-700 shadow-lg group-hover:border-blue-500/30 transition-colors">
                                                        <span className="text-sm font-black text-white tracking-tighter">{clan.tag}</span>
                                                    </div>

                                                    {/* Info */}
                                                    <div>
                                                        <h3 className="font-bold text-lg text-zinc-100 group-hover:text-blue-400 transition-colors">{clan.name}</h3>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-900/80 border border-zinc-800">
                                                                <Crown className="w-3 h-3 text-[#FFD700]" />
                                                                <span className="text-[10px] text-zinc-400 font-mono">
                                                                    {clan.owner.farcasterHandle || clan.owner.walletAddress.slice(0, 6)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Stats */}
                                                <div className="flex flex-col items-end justify-center pl-4 border-l border-zinc-800/50">
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">{clan.memberCount}</span>
                                                        <Users className="w-3 h-3 text-zinc-500" />
                                                    </div>
                                                    <span className="text-[9px] text-zinc-600 uppercase tracking-widest font-semibold">Members</span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </AppLayout>
        </AuthenticatedRoute>
    );
}
