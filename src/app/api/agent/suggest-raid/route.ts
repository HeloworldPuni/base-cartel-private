import { NextRequest, NextResponse } from "next/server";
import { enforcePayment } from "@/lib/x402-server";
import { getRandomTarget } from "@/lib/leaderboard-service";
import prisma from "@/lib/prisma";

const PAYMENT_CONFIG = {
    receiver: process.env.PAYMENT_ADDRESS || "0x0000000000000000000000000000000000000000",
    network: process.env.X402_NETWORK || "base-sepolia",
    routes: [
        {
            path: "/api/agent/suggest-raid",
            price: "$0.005",
            description: "Raid target suggestion from Base Cartel AI",
        }
    ]
};

// CRON SECRET for internal bypass
const CRON_SECRET = process.env.CRON_SECRET || "internal_secret_bypass";

// returns a suggested raid target for a given address
export async function GET(req: NextRequest) {
    // 1. Check for Cron Secret (Internal Bypass)
    const cronSecret = req.headers.get("X-CRON-SECRET");
    const isCron = cronSecret === CRON_SECRET;

    // 2. Enforce Payment (if not Cron)
    if (!isCron) {
        const paymentResponse = await enforcePayment(req, PAYMENT_CONFIG);
        if (paymentResponse) return paymentResponse;
    }

    const address = req.nextUrl.searchParams.get("address");

    if (!address) {
        return NextResponse.json(
            { error: "Missing address" },
            { status: 400 }
        );
    }

    // 3. SMART HEURISTIC AI IMPLEMENTATION 🧠

    // Fetch potential targets (exclude self)
    const candidates = await prisma.user.findMany({
        where: {
            walletAddress: { not: { equals: address, mode: 'insensitive' } },
            shares: { gt: 0 } // Must have loot
        },
        select: {
            walletAddress: true,
            farcasterId: true,
            shares: true,
            lastSeenAt: true,
            createdAt: true
        },
        orderBy: { shares: 'desc' },
        take: 50 // Analyze top 50 richest
    });

    if (candidates.length === 0) {
        // Fallback for empty DB
        return NextResponse.json({
            attacker: address,
            targetHandle: "The Void",
            targetAddress: "0x0000000000000000000000000000000000000000",
            estimatedGainShares: 0,
            riskLevel: "none",
            reason: "No wealthy targets found in the database."
        });
    }

    // Scoring Algorithm
    // Target Score = (Shares * 0.4) + (DaysInactive * 100)
    let bestCandidate = candidates[0];
    let bestScore = -1;
    let bestReason = "";
    let bestRisk = "low";

    const now = Date.now();

    for (const cand of candidates) {
        let score = cand.shares * 0.4;
        let risk = "medium";
        let reasonParts = [];

        // 1. Inactivity Bonus (Sleeping Whales are vulnerable)
        const lastSeen = cand.lastSeenAt ? new Date(cand.lastSeenAt).getTime() : new Date(cand.createdAt).getTime();
        const daysInactive = (now - lastSeen) / (1000 * 60 * 60 * 24);

        if (daysInactive > 7) {
            score += 500; // HUGE Bonus for inactivity
            risk = "low";
            reasonParts.push("Target is asleep");
        } else if (daysInactive < 1) {
            score -= 200; // Penalty for active users (they might raid back)
            risk = "high";
            reasonParts.push("Target is active");
        }

        // 2. Wealth Factor
        if (cand.shares > 1000) {
            reasonParts.push("High Loot");
        }

        // Select Best
        if (score > bestScore) {
            bestScore = score;
            bestCandidate = cand;
            bestRisk = risk;
            bestReason = reasonParts.join(" + ") || "Opportunistic";
        }
    }

    const estimatedGain = Math.floor(bestCandidate.shares * 0.05); // 5% estimate

    return NextResponse.json({
        attacker: address,
        targetHandle: bestCandidate.farcasterId ? `@${bestCandidate.farcasterId}` : `${bestCandidate.walletAddress.slice(0, 6)}...`,
        targetAddress: bestCandidate.walletAddress,
        estimatedGainShares: estimatedGain,
        riskLevel: bestRisk,
        reason: bestReason,
        debugScore: Math.floor(bestScore)
    });
}
