"use client";

import { useAccount, useReadContract } from 'wagmi';
import AuthenticatedRoute from '@/components/AuthenticatedRoute';
import AppLayout from '@/components/AppLayout';
import CartelDashboard from '@/components/CartelDashboard';
import JoinCartel from '@/components/JoinCartel';
import { motion } from "framer-motion";
import { motionPage } from "@/components/ui/motionTokens";
import CartelSharesABI from '@/lib/abi/CartelShares.json';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
    const { address: realAddress } = useAccount();
    // MOCK ADDRESS FOR SCREENSHOTS
    const address = realAddress || "0x1234567890abcdef1234567890abcdef12345678";
    const [justJoined, setJustJoined] = useState(false);

    // CRITICAL: Check membership on chain.
    // If user is connected but has 0 shares, they are NOT a member yet (Zombie State or New).
    // The Dashboard should only be visible to actual shareholders.
    const sharesAddress = process.env.NEXT_PUBLIC_CARTEL_SHARES_ADDRESS as `0x${string}`;

    const { data: shareBalance, refetch, isError, isLoading } = useReadContract({
        address: sharesAddress,
        abi: CartelSharesABI,
        functionName: 'balanceOf',
        args: [address as `0x${string}`, 1n],
        query: {
            enabled: !!address && !!sharesAddress,
            staleTime: 5000 // Refresh often
        }
    });

    // SYNC DB WITH CHAIN (Fixes Leaderboard lag)
    useEffect(() => {
        if (address && shareBalance !== undefined) {
            const currentShares = Number(shareBalance);
            // Fire and forget sync
            fetch('/api/cartel/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address, shares: currentShares })
            }).catch(e => console.error("Sync failed", e));
        }
    }, [address, shareBalance]);

    // MOCK MODE: Allow access without address
    // FORCE MEMBER TRUE for screenshots
    const isMember = true; // shareBalance && Number(shareBalance) > 0;

    // If loading or just joined, assume member to prevent flash
    // If error, maybe network issue? safe to show dashboard or error? 
    // Let's safe-fail to Join screen if we definitively know shares == 0.

    // showJoin: !isLoading && !isMember && !!address && !justJoined
    // With isMember=true, showJoin will be false, showing dashboard.
    const showJoin = false;

    return (
        <AuthenticatedRoute>
            {showJoin ? (
                <div className="min-h-screen bg-cartel-dark text-white">
                    <JoinCartel onJoin={() => {
                        setJustJoined(true);
                        refetch(); // Update balance
                    }} />
                </div>
            ) : (
                <CartelDashboard address={address} />
            )}
        </AuthenticatedRoute>
    );
}
