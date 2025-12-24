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

    // 3. Get Real Target
    // Strategy: Get a random target that isn't me
    let targetAddress = await getRandomTarget(address);

    // Fallback if DB empty or only self
    if (!targetAddress) {
        // Mock fallback only if absolutely no users in DB (rare in dev)
        targetAddress = "0x8342A48694A74044116F330db5050a267b28dD85";
    }

    // 4. Calculate Risk/Gain based on Real User Data
    const targetUser = await prisma.user.findUnique({
        where: { walletAddress: targetAddress },
        select: { shares: true, farcasterId: true }
    });

    const targetShares = targetUser?.shares || 0;
    const targetHandle = targetUser?.farcasterId ? `@${targetUser.farcasterId}` : `${targetAddress.slice(0, 6)}...`;

    // Simple heuristic: More shares = Higher Gain but Higher Risk (assumed defense)
    let estimatedGain = Math.floor(targetShares * 0.05); // 5% steal estimate
    if (estimatedGain < 10) estimatedGain = 10; // Min gain

    let risk = "low";
    let reason = "Safe target with decent yield.";

    if (targetShares > 10000) {
        risk = "high";
        reason = "High value target. Likely defended.";
    } else if (targetShares > 1000) {
        risk = "medium";
        reason = "Standard target. Moderate gains.";
    }

    const result = {
        attacker: address,
        targetHandle: targetHandle,
        targetAddress: targetAddress,
        estimatedGainShares: estimatedGain,
        riskLevel: risk,
        reason: reason,
    };

    return NextResponse.json(result);
}
