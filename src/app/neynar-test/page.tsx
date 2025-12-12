"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { useReadContract } from "wagmi";
import { NEYNAR_USER_SCORE_ABI, NEYNAR_USER_SCORE_ADDRESS } from "~/lib/contracts/neynar-user-score";
import { baseSepolia } from "viem/chains";

export default function NeynarTestPage() {
    const [address, setAddress] = useState("");
    const [resolvedUser, setResolvedUser] = useState<any>(null);

    const [fid, setFid] = useState("");
    const [graphData, setGraphData] = useState<any>(null);

    const [scoreFid, setScoreFid] = useState("");

    // 1. Identity Resolution
    const resolveAddress = async () => {
        const res = await fetch(`/api/farcaster/resolve?address=${address}`);
        const data = await res.json();
        setResolvedUser(data);
    };

    // 2. Social Graph
    const fetchFriends = async () => {
        const res = await fetch(`/api/farcaster/friends?fid=${fid}`);
        const data = await res.json();
        setGraphData(data);
    };

    // 3. Trust Score (Wagmi Hooks need to be top-level, so we use a sub-component or just render it if we have an FID to check)
    // For simplicity in this test page, we'll just check the score for the 'scoreFid' state
    const { data: score } = useReadContract({
        address: NEYNAR_USER_SCORE_ADDRESS,
        abi: NEYNAR_USER_SCORE_ABI,
        functionName: "getScore",
        args: scoreFid ? [BigInt(scoreFid)] : undefined,
        chainId: baseSepolia.id,
        query: {
            enabled: !!scoreFid
        }
    });


    return (
        <div className="min-h-screen bg-black text-white p-8 space-y-8 font-mono">
            <h1 className="text-4xl font-bold text-emerald-500 border-b border-zinc-800 pb-4">
                Neynar Feature Verification
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* FEATURE 1: IDENTITY */}
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-emerald-400">1. Identity Resolution</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-zinc-400">Resolve 0x Address to Farcaster Profile</p>
                        <Input
                            placeholder="0x..."
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="bg-zinc-950 border-zinc-700"
                        />
                        <Button onClick={resolveAddress} className="w-full bg-emerald-600">Resolve</Button>
                        {resolvedUser && (
                            <div className="mt-4 p-2 bg-zinc-950 rounded text-xs overflow-auto h-48">
                                <pre>{JSON.stringify(resolvedUser, null, 2)}</pre>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* FEATURE 2: SOCIAL GRAPH */}
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-emerald-400">2. Social Graph</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-zinc-400">Get Friends/Following for FID</p>
                        <Input
                            placeholder="FID (e.g. 3)"
                            value={fid}
                            onChange={(e) => setFid(e.target.value)}
                            className="bg-zinc-950 border-zinc-700"
                        />
                        <Button onClick={fetchFriends} className="w-full bg-emerald-600">Fetch Graph</Button>
                        {graphData && (
                            <div className="mt-4 p-2 bg-zinc-950 rounded text-xs overflow-auto h-48">
                                <p className="mb-2 text-emerald-500">Found {graphData.users?.length || 0} friends</p>
                                <pre>{JSON.stringify(graphData.users?.[0], null, 2)}...</pre>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* FEATURE 3: TRUST SCORE */}
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-emerald-400">3. Onchain Trust Score</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-zinc-400">Check User Quality (Sybil Resistance)</p>
                        <Input
                            placeholder="FID to Check"
                            value={scoreFid}
                            onChange={(e) => setScoreFid(e.target.value)}
                            className="bg-zinc-950 border-zinc-700"
                        />

                        <div className="p-8 border border-dashed border-zinc-700 rounded flex flex-col items-center justify-center">
                            <div className="text-sm text-zinc-500 mb-2">SCORE</div>
                            <div className="text-5xl font-bold text-white">
                                {score ? score.toString() : "---"}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

        </div>
    );
}
