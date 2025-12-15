
"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import AuthenticatedRoute from "@/components/AuthenticatedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { use } from "react";

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
    const [myMembership, setMyMembership] = useState<any>(null); // Am I in THIS clan?
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState("");

    // Load Data
    useEffect(() => {
        const load = async () => {
            if (!address || !slug) return;
            try {
                // Get Clan Info
                const res = await fetch(`/api/clans/${slug}`);
                if (!res.ok) throw new Error("Clan unavailable");
                const data = await res.json();
                setClan(data);

                // Check MY membership
                const resMe = await fetch(`/api/me/clan?address=${address}`, {
                    headers: { 'x-wallet-address': address }
                });
                const dataMe = await resMe.json();
                setMyMembership(dataMe ? dataMe.clanId === data.id : false);

            } catch (e) {
                console.error(e);
                router.push('/clans'); // Fallback
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
                method: 'POST',
                headers: { 'x-wallet-address': address }
            });
            const data = await res.json();
            if (res.ok) {
                window.location.reload(); // Simple refresh to update state
            } else {
                setError(data.error);
            }
        } catch (e) {
            setError("Failed to join");
        } finally {
            setActionLoading(false);
        }
    };

    const handleLeave = async () => {
        if (!address) return;
        if (!confirm("Are you sure you want to leave this clan?")) return;

        setActionLoading(true);
        try {
            const res = await fetch(`/api/clans/${slug}/leave`, {
                method: 'POST',
                headers: { 'x-wallet-address': address }
            });
            if (res.ok) {
                router.push('/clans');
            } else {
                const data = await res.json();
                setError(data.error);
            }
        } catch (e) {
            setError("Failed to leave");
        } finally {
            setActionLoading(false);
        }
    };

    if (loading || !clan) {
        return (
            <AuthenticatedRoute>
                <AppLayout>
                    <div className="flex justify-center items-center h-64 text-zinc-500">Decoding Signal...</div>
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
                <div className="space-y-6 pb-20">
                    <Button variant="ghost" className="pl-0 text-zinc-500 hover:text-white" onClick={() => router.push('/clans')}>
                        ← Back to List
                    </Button>

                    {/* Banner Card */}
                    <Card className="bg-zinc-900 border-zinc-800 overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-purple-600" />
                        <CardContent className="pt-8 text-center space-y-4">
                            <div className="inline-flex h-20 w-20 items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700 text-3xl font-black text-white shadow-xl">
                                {clan.tag}
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white">{clan.name}</h1>
                                <p className="text-zinc-500 text-sm mt-1">{clan.members.length} Members</p>
                            </div>

                            {/* Actions */}
                            <div className="pt-4 flex justify-center gap-3">
                                {isMember ? (
                                    <>
                                        <Button disabled={true} className="bg-green-600/20 text-green-400 border border-green-600/50">
                                            ✓ Member
                                        </Button>
                                        {!isOwner && (
                                            <Button variant="destructive" onClick={handleLeave} disabled={actionLoading}>
                                                Leave
                                            </Button>
                                        )}
                                    </>
                                ) : (
                                    <Button
                                        className="bg-blue-600 hover:bg-blue-500 min-w-[120px]"
                                        onClick={handleJoin}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? "Joining..." : "Join Clan"}
                                    </Button>
                                )}
                            </div>
                            {error && <p className="text-red-400 text-sm">{error}</p>}
                        </CardContent>
                    </Card>

                    {/* Roster */}
                    <div className="space-y-3">
                        <h2 className="text-sm font-uppercase text-zinc-500 tracking-wider">Roster</h2>
                        {clan.members.map((member, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded bg-zinc-900/40 border border-zinc-800/50">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-zinc-500">
                                        {i + 1}
                                    </div>
                                    <div>
                                        <p className="font-medium text-zinc-200 text-sm">
                                            {member.user.farcasterHandle || member.user.walletAddress.slice(0, 8)}
                                            {member.role === 'OWNER' && <span className="ml-2 text-[10px] bg-yellow-500/20 text-yellow-500 px-1 rounded">OWNER</span>}
                                        </p>
                                        <p className="text-[10px] text-zinc-500">REP: {member.user.rep}</p>
                                    </div>
                                </div>
                                <div className="text-xs text-zinc-600">
                                    {new Date(member.joinedAt).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </AppLayout>
        </AuthenticatedRoute>
    );
}
