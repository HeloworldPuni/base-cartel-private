import { NextRequest, NextResponse } from "next/server";
import { enforcePayment } from "@/lib/x402-server";

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

// returns a suggested raid target for a given address
export async function GET(req: NextRequest) {
    // 1. Enforce Payment
    const paymentResponse = await enforcePayment(req, PAYMENT_CONFIG);
    if (paymentResponse) return paymentResponse;

    const address = req.nextUrl.searchParams.get("address");

    if (!address) {
        return NextResponse.json(
            { error: "Missing address" },
            { status: 400 }
        );
    }

    // TODO: use real logic based on player’s state.
    // For now, return a mocked suggestion in correct shape.
    const estimatedGain = Math.floor(Math.random() * 20) + 10;

    // Determine risk/reason based on gain
    let risk = "low";
    let reason = "Safe target with decent yield.";

    if (estimatedGain > 25) {
        risk = "high";
        reason = "High reward but active defense. Proceed with caution.";
    } else if (estimatedGain > 15) {
        risk = "medium";
        reason = "Standard target. Moderate gains expected.";
    }

    const result = {
        attacker: address,
        targetHandle: "@UserC",
        targetAddress: "0xTarget...",
        estimatedGainShares: estimatedGain,
        riskLevel: risk,
        reason: reason,
    };

    return NextResponse.json(result);
}
