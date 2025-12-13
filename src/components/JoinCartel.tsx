"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import PaymentModal from "./PaymentModal";
import { JOIN_FEE, formatUSDC } from "@/lib/basePay";

import { useAccount, useConnect, useWriteContract, usePublicClient } from 'wagmi';
import { useFrameContext } from "./providers/FrameProvider";
import CartelCoreABI from '@/lib/abi/CartelCore.json';

interface JoinCartelProps {
    onJoin: (inviteCode: string) => void;
}

export default function JoinCartel({ onJoin }: JoinCartelProps) {
    const { isConnected, address } = useAccount();
    const { connect, connectors } = useConnect();
    const frameContext = useFrameContext();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { context, isInMiniApp } = (frameContext || {}) as any;

    const [inviteCode, setInviteCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const { writeContractAsync } = useWriteContract();

    // Auto-connect if in MiniApp
    useEffect(() => {
        if (isInMiniApp && !isConnected) {
            const farcasterConnector = connectors.find(c => c.id === 'farcaster-miniapp');
            if (farcasterConnector) {
                connect({ connector: farcasterConnector });
            }
        }
    }, [isInMiniApp, isConnected, connectors, connect]);

    const handleJoinClick = () => {
        // Validation format check only if provided
        if (inviteCode && !inviteCode.startsWith("BASE-")) {
            alert("Invalid referral code format! Must start with BASE-");
            return;
        }
        setShowPayment(true);
    };

    const handleConfirmPayment = async () => {
        setIsProcessing(true);
        setErrorMessage(null);

        try {
            console.log("--- STARTING JOIN FLOW ---");

            // 1. PREPARE (DB)
            console.log("Step 1: Preparing DB Record...");
            const prepRes = await fetch('/api/auth/prepare-join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: address,
                    farcasterId: context?.user?.fid,
                    inviteCode: inviteCode
                })
            });

            if (!prepRes.ok) throw new Error("Failed to prepare user record");
            const prepData = await prepRes.json();

            // If user already exists in DB, we treat it as success (login)
            if (prepData.isNewUser === false) {
                console.log("User already exists in DB. Logging in...");
                setIsProcessing(false);
                setShowPayment(false);
                onJoin(inviteCode);
                return;
            }

            const referrer = prepData.referrerAddress || "0x0000000000000000000000000000000000000000";
            console.log("Referrer:", referrer);

            const contractAddress = process.env.NEXT_PUBLIC_CARTEL_CORE_ADDRESS as `0x${string}`;
            if (!contractAddress) {
                alert("CONFIG ERROR: Missing Contract Address");
                throw new Error("Missing config");
            }

            // 2. SIMULATE (Chain Check) & 3. EXECUTE
            console.log("Step 2/3: Executing Join...");

            try {
                // We attempt to write directly. 
                // If the user is already joined on-chain, this will throw an error (Simulation Revert).
                const hash = await writeContractAsync({
                    address: contractAddress,
                    abi: CartelCoreABI,
                    functionName: 'join',
                    args: [referrer]
                });
                console.log("Tx Hash:", hash);
                // We rely on the indexer sync below.

            } catch (txError: any) {
                const msg = (txError.message || "").toLowerCase();
                console.log("Tx Error:", msg);

                // RECOVERY LOGIC (The Safety Net)
                if (msg.includes("alreadyjoined") || msg.includes("execution reverted") || msg.includes("reverted")) {
                    console.warn("User already joined! Attempting recovery...");
                    alert("⚠️ You are already in the Cartel on-chain.\n\nRecovering your account settings...");

                    // Trigger Sync to fixing "Zombie State"
                    await fetch('/api/cartel/sync', {
                        method: 'POST',
                        body: JSON.stringify({ address: address }),
                        headers: { 'Content-Type': 'application/json' }
                    });

                    // Success after recovery
                    setIsProcessing(false);
                    setShowPayment(false);
                    setIsLoading(true);
                    setTimeout(() => onJoin(inviteCode), 1500);
                    return;
                }

                throw txError; // Re-throw other errors (user rejected, etc)
            }

            // 4. SYNC (FinalConsistency)
            console.log("Step 4: Syncing State...");
            // We force a sync for this user to ensure the new shares appear immediately
            await fetch('/api/cartel/sync', {
                method: 'POST',
                body: JSON.stringify({ address: address }),
                headers: { 'Content-Type': 'application/json' }
            });

            // FINISH
            setIsProcessing(false);
            setShowPayment(false);
            setIsLoading(true);
            setTimeout(() => onJoin(inviteCode), 2000);

        } catch (error: any) {
            console.error("Join Flow Failed:", error);
            alert(`JOIN FAILED:\n${error.message || "Unknown error"}`);
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0B0E12] text-white flex items-center justify-center p-4">
            <Card className="w-full max-w-[400px] bg-[#1B1F26] border-[#4A87FF]/30 shadow-2xl">
                <CardHeader className="text-center pb-8 pt-8">
                    <div className="mb-6">
                        <div className="text-6xl mb-4">🎩</div>
                        <CardTitle className="text-4xl font-black heading-font text-neon-blue mb-2">
                            ENTER THE CARTEL
                        </CardTitle>
                        <p className="text-sm text-[#D4AF37] font-medium tracking-wider">
                            INVITE-ONLY ACCESS
                        </p>
                    </div>
                    {isInMiniApp && context?.user && (
                        <div className="flex flex-col items-center gap-2 mt-4 animate-fade-in">
                            {context.user.pfpUrl && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={context.user.pfpUrl} alt="Profile" className="w-16 h-16 rounded-full border-2 border-[#4A87FF] glow-blue" />
                            )}
                            <p className="text-zinc-300 font-medium">
                                Welcome, <span className="text-[#4A87FF]">@{context.user.username}</span>
                            </p>
                        </div>
                    )}
                </CardHeader>
                <CardContent className="space-y-6 px-6 pb-8">
                    <p className="text-center text-zinc-400 text-sm leading-relaxed">
                        Open Access for limited time. Join now.
                    </p>

                    <div className="card-glow p-5 rounded-xl space-y-3">
                        <div className="flex justify-between text-sm items-center">
                            <span className="text-zinc-400">Entry Fee</span>
                            <span className="text-[#3DFF72] font-bold text-lg">FREE</span>
                        </div>
                        <div className="h-px bg-gradient-to-r from-transparent via-[#4A87FF]/20 to-transparent"></div>
                        <div className="flex justify-between text-sm items-center">
                            <span className="text-zinc-400">Initial Shares</span>
                            <span className="text-white font-bold text-lg">100</span>
                        </div>
                    </div>

                    {!isConnected ? (
                        <div className="space-y-4">
                            <p className="text-center text-sm text-zinc-400">
                                {isInMiniApp ? "Connecting to your account..." : "Connect your wallet to verify eligiblity."}
                            </p>
                            {!isInMiniApp && (
                                <Button
                                    className="w-full bg-[#4A87FF] hover:bg-[#5A97FF] text-white font-bold py-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                                    onClick={() => {
                                        const connector = connectors.find(c => c.id === 'coinbaseWalletSDK');
                                        if (connector) {
                                            connect({ connector });
                                        } else {
                                            const first = connectors[0];
                                            if (first) connect({ connector: first });
                                        }
                                    }}
                                >
                                    Connect Wallet
                                </Button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm text-zinc-400 font-medium">Referral Code (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="BASE-XXXXXX"
                                    className="w-full bg-[#0B0E12] border-2 border-[#4A87FF]/30 rounded-lg p-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#4A87FF] focus:glow-blue transition-all"
                                    value={inviteCode}
                                    onChange={(e) => setInviteCode(e.target.value)}
                                />
                            </div>

                            <Button
                                className="w-full bg-gradient-to-r from-[#4A87FF] to-[#4FF0E6] hover:from-[#5A97FF] hover:to-[#5FFFF6] text-white font-bold py-6 text-lg rounded-lg glow-blue transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={handleJoinClick}
                                disabled={isLoading}
                            >
                                {isLoading ? "Joining..." : "Join the Cartel (v2.0 Fix)"}
                            </Button>
                        </>
                    )}

                    <p className="text-center text-xs text-zinc-600 mt-4">
                        Open Access · Referrals earn bonus shares
                    </p>
                </CardContent>
            </Card>

            <PaymentModal
                isOpen={showPayment}
                amount={formatUSDC(JOIN_FEE)}
                action="Join the Cartel"
                onConfirm={handleConfirmPayment}
                onCancel={() => {
                    setShowPayment(false);
                    setErrorMessage(null);
                }}
                isProcessing={isProcessing}
                errorMessage={errorMessage}
            />
        </div>
    );
}
