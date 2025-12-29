
import { NextRequest, NextResponse } from 'next/server';
import { createWalletClient, http, publicActions, decodeEventLog } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import CartelCoreABI from '@/lib/abi/CartelCore.json';
import prisma from '@/lib/prisma';
// import { generateNewsFromEvents } from '@/lib/news-service'; // Optional: If we want instant AI news

// CONFIG
const CORE_ADDRESS = process.env.NEXT_PUBLIC_CARTEL_CORE_ADDRESS as `0x${string}`;
const PRIVATE_KEY = (process.env.PAYMENT_ADDRESS || process.env.DEPLOYER_PRIVATE_KEY) as `0x${string}`; // Admin/Relayer Key

export async function POST(req: NextRequest) {
    try {
        const { requestId, secret, salt, target } = await req.json();

        if (!requestId || !secret || !salt) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
        }

        if (!PRIVATE_KEY) {
            return NextResponse.json({ error: "Relayer not configured" }, { status: 500 });
        }

        // Setup Relayer
        const account = privateKeyToAccount(PRIVATE_KEY);
        const client = createWalletClient({
            account,
            chain: baseSepolia,
            transport: http()
        }).extend(publicActions);

        console.log(`[Relayer] Revealing Raid #${requestId}...`);

        const hash = await client.writeContract({
            address: CORE_ADDRESS,
            abi: CartelCoreABI,
            functionName: 'revealRaid',
            args: [BigInt(requestId), secret, salt]
        });

        console.log(`[Relayer] Tx Sent: ${hash}`);

        // FAST RETURN: Don't wait for receipt (Vercel Timeout Prevention)
        // The Client (RaidModal) will wait for the receipt and call /api/cartel/events/sync
        return NextResponse.json({ success: true, tx: hash });

    } catch (error: any) {
        console.error("[Relayer Error]", error);
        return NextResponse.json({ error: error.message || "Relayer failed" }, { status: 500 });
    }
}
