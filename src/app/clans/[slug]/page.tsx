"use client";

import { useEffect, useState, use } from "react";
import AppLayout from "@/components/AppLayout";
import AuthenticatedRoute from "@/components/AuthenticatedRoute";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { Copy, Shield, LogOut, ArrowLeft, Users, Crown, Calendar, Trophy } from "lucide-react";

// Types
interface ClanDetail {
    id: string;
    slug: string;
    name: string;
    tag: string;
    members: Array<{
        user: {
            walletAddress: string;
            farcasterHandle: string | null;
            rep: number;
        };
        role: string;
        joinedAt: string;
    }>;
    ownerId: string;
}

export default function ClanDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const { address } = useAccount();
    const router = useRouter();

    const [clan, setClan] = useState<ClanDetail | null>(null);
    const [myMembership, setMyMembership] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState("");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Load Data
    useEffect(() => {
        const load = async () => {
            if (!address || !slug) return;
            try {
                const res = await fetch(`/api/clans/${slug}`);
                if (!res.ok) throw new Error("Clan unavailable");
                const data = await res.json();
                setClan(data);

                const resMe = await fetch(`/api/me/clan?address=${address}`, {
                    headers: { 'x-wallet-address': address }
                });
                const dataMe = await resMe.json();
                setMyMembership(dataMe ? dataMe.clanId === data.id : false);

            } catch (e) {
                console.error(e);
                router.push('/clans');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [address, slug, router]);

    const handleJoin = async () => {
        if (!address) return;
        setActionLoading(true);
        try {
            const res = await fetch(`/api/clans/${slug}/join`, {
                method: 'POST', headers: { 'x-wallet-address': address }
            });
            if (res.ok) window.location.reload();
            else setError("Failed to join");
        } catch (e) { setError("Failed to join"); }
        finally { setActionLoading(false); }
    };

    const handleLeave = async () => {
        if (!address) return;
        if (!confirm("Leave this syndicate?")) return;
        setActionLoading(true);
        try {
            const res = await fetch(`/api/clans/${slug}/leave`, {
                method: 'POST', headers: { 'x-wallet-address': address }
            });
            if (res.ok) router.push('/clans');
            else setError("Failed to leave");
        } catch (e) { setError("Failed to leave"); }
        finally { setActionLoading(false); }
    };

    if (loading || !clan) {
        return (
            <AuthenticatedRoute>
                <AppLayout>
                    <div className="min-h-screen bg-black flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                            <div className="text-blue-400 text-xs font-mono animate-pulse uppercase tracking-widest">
                                Decrypting Syndicate Data...
                            </div>
                        </div>
                    </div>
                </AppLayout>
            </AuthenticatedRoute>
        );
    }

    const isMember = myMembership;
    // @ts-ignore
    const isOwner = clan.members.find(m => m.user.walletAddress === address)?.role === 'OWNER';

    return (
        <AuthenticatedRoute>
            <AppLayout>
                <div className="min-h-screen text-white pb-32 w-full overflow-x-hidden relative">
                    {/* Animated Background */}
                    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                        <div className="absolute inset-0 opacity-10 mafia-pattern"></div>
                        <div
                            className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-[#0066FF] rounded-full opacity-5 blur-3xl"
                            style={{ animation: "float 25s ease-in-out infinite" }}
                        ></div>
                        <div
                            className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-[#00D4FF] rounded-full opacity-5 blur-3xl"
                            style={{ animation: "float 20s ease-in-out infinite reverse" }}
                        ></div>
                    </div>

                    <div className="relative z-10 max-w-2xl mx-auto p-4 space-y-6">

                        {/* NAV */}
                        <div className="flex items-center gap-2 pt-2">
                            <button
                                onClick={() => router.push('/clans')}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-zinc-800"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Directory
                            </button>
                        </div>

                        {/* HERO BANNER */}
                        <div
                            className="relative overflow-hidden rounded-3xl bg-[#0F172A]/70 border border-zinc-800 backdrop-blur-xl shadow-2xl"
                            style={{ animation: mounted ? "scaleIn 0.4s ease-out" : "none" }}
                        >
                            {/* Decorative Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/5 pointer-events-none" />
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />

                            <div className="p-8 relative z-10 flex flex-col items-center text-center space-y-6">

                                {/* Avatar/Tag */}
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 rounded-full"></div>
                                    <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-zinc-900 to-black border border-zinc-700 flex items-center justify-center shadow-2xl relative z-10 group-hover:scale-105 transition-transform duration-300">
                                        <span className="text-3xl font-black text-white tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-white to-zinc-400">
                                            {clan.tag}
                                        </span>
                                        {isMember && (
                                            <div className="absolute -bottom-3 -right-3 bg-[#00FF88] border-[4px] border-[#0F172A] w-8 h-8 rounded-full flex items-center justify-center shadow-lg" title="Active Member">
                                                <Shield className="w-4 h-4 text-black fill-current" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight uppercase drop-shadow-lg">
                                        {clan.name}
                                    </h1>
                                    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                                        <span className="text-blue-400 text-[10px] font-mono uppercase tracking-[0.2em]">
                                            ID: {clan.slug.toUpperCase()}
                                        </span>
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-8 py-4 px-8 border-y border-zinc-800/50 w-full max-w-md">
                                    <div className="flex flex-col items-center">
                                        <div className="flex items-center gap-2 text-white">
                                            <Users className="w-5 h-5 text-blue-400" />
                                            <span className="text-2xl font-bold">{clan.members.length}</span>
                                        </div>
                                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Agents Active</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <div className="flex items-center gap-2 text-white">
                                            <Trophy className="w-5 h-5 text-yellow-400" />
                                            <span className="text-2xl font-bold">#--</span>
                                        </div>
                                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Rank (Beta)</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="pt-2">
                                    {isMember ? (
                                        <div className="flex items-center gap-3">
                                            <div className="px-6 py-3 rounded-xl bg-zinc-900/80 border border-zinc-700 text-zinc-300 font-bold text-sm cursor-default flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-[#00FF88] animate-pulse" />
                                                Active Operative
                                            </div>
                                            {!isOwner && (
                                                <button
                                                    onClick={handleLeave}
                                                    disabled={actionLoading}
                                                    className="p-3 rounded-xl border border-red-900/30 text-red-500 hover:bg-red-950/30 hover:text-red-400 hover:border-red-500/30 transition-all"
                                                    title="Leave Syndicate"
                                                >
                                                    <LogOut className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <button
                                            className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all hover:scale-105 disabled:opacity-50 disabled:grayscale"
                                            onClick={handleJoin}
                                            disabled={actionLoading}
                                        >
                                            <span className="relative z-10 flex items-center gap-2">
                                                {actionLoading ? "Processing..." : "Join Syndicate"}
                                                {!actionLoading && <Shield className="w-4 h-4 ml-1 group-hover:rotate-12 transition-transform" />}
                                            </span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* MEMBER ROSTER */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                    <Users className="w-4 h-4 text-blue-500" />
                                    Roster
                                </h3>
                                <div className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-500 font-mono">
                                    TOTAL REP: <span className="text-zinc-300">{clan.members.reduce((a, b) => a + b.user.rep, 0).toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="grid gap-3">
                                {clan.members.map((member, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between p-4 rounded-2xl bg-[#0F172A]/40 backdrop-blur-md border border-zinc-800/50 hover:border-blue-500/30 hover:bg-[#0F172A]/60 transition-all group"
                                        style={{ animation: mounted ? `slideUp 0.5s ease-out ${0.1 + (i * 0.05)}s backwards` : "none" }}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-lg bg-black/50 flex items-center justify-center text-xs text-zinc-600 font-mono border border-zinc-800/50 group-hover:border-blue-500/20 group-hover:text-blue-500 transition-colors">
                                                {String(i + 1).padStart(2, '0')}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-zinc-200 text-sm group-hover:text-white transition-colors">
                                                        {member.user.farcasterHandle || member.user.walletAddress.slice(0, 8)}
                                                    </p>
                                                    {member.role === 'OWNER' && (
                                                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                                                            <Crown className="w-3 h-3" /> BOSS
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-zinc-500 mt-0.5 uppercase tracking-wide">
                                                    Reputation: <span className="text-zinc-300 font-mono">{member.user.rep.toLocaleString()}</span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="flex items-center gap-1.5 text-[10px] text-zinc-600 font-mono group-hover:text-zinc-500">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(member.joinedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </AppLayout>
        </AuthenticatedRoute>
    );
}
