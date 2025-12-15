
"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import AuthenticatedRoute from "@/components/AuthenticatedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";

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
                // Fetch All Clans
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
                // Redirect to new clan
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
                <div className="space-y-6 pb-20">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Clans</h1>
                            <p className="text-zinc-400 text-sm">Join forces, conquer together.</p>
                        </div>
                        {myClan ? (
                            <Button variant="outline" asChild>
                                <Link href={`/clans/${myClan.slug}`}>My Clan</Link>
                            </Button>
                        ) : (
                            <Button onClick={() => setShowCreate(!showCreate)}>
                                {showCreate ? "Cancel" : "Create Clan"}
                            </Button>
                        )}
                    </div>

                    {/* Create Section */}
                    {showCreate && !myClan && (
                        <Card className="bg-zinc-900 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="text-lg">Establish New Syndicate</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Clan Name</Label>
                                    <Input
                                        placeholder="The Base Cartel"
                                        value={newName}
                                        onChange={e => setNewName(e.target.value)}
                                        className="bg-black/50 border-zinc-700"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Tag (2-5 chars)</Label>
                                    <Input
                                        placeholder="BASE"
                                        value={newTag}
                                        onChange={e => setNewTag(e.target.value.toUpperCase())}
                                        maxLength={5}
                                        className="bg-black/50 border-zinc-700 w-24"
                                    />
                                </div>
                                {error && <p className="text-red-400 text-sm">{error}</p>}
                                <Button
                                    className="w-full bg-blue-600 hover:bg-blue-700"
                                    onClick={handleCreate}
                                    disabled={creating}
                                >
                                    {creating ? "Establishing..." : "Pay Fee & Create (Free for V1)"}
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Clan List */}
                    <div className="space-y-3">
                        <h2 className="text-sm font-uppercase text-zinc-500 tracking-wider">Active Syndicates</h2>

                        {loading ? (
                            <p className="text-zinc-500">Scanning network...</p>
                        ) : clans.length === 0 ? (
                            <p className="text-zinc-500">No clans established yet. Be the first.</p>
                        ) : (
                            clans.map(clan => (
                                <Link href={`/clans/${clan.slug}`} key={clan.id}>
                                    <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors mb-3">
                                        <CardContent className="flex items-center justify-between p-4">
                                            <div className="flex items-center space-x-4">
                                                <div className="h-10 w-10 rounded bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center border border-zinc-700 font-bold text-zinc-300">
                                                    {clan.tag}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-zinc-200">{clan.name}</h3>
                                                    <p className="text-xs text-zinc-400">
                                                        Leader: {clan.owner.farcasterHandle || clan.owner.walletAddress.slice(0, 6)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-bold text-zinc-300">
                                                    {clan.memberCount} <span className="text-xs font-normal text-zinc-500">members</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </AppLayout>
        </AuthenticatedRoute>
    );
}
