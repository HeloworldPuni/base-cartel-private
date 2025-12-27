
import { NextRequest, NextResponse } from 'next/server';
import { createWalletClient, http, publicActions } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import CartelCoreABI from '@/lib/abi/CartelCore.json';

// CONFIG
const CORE_ADDRESS = process.env.NEXT_PUBLIC_CARTEL_CORE_ADDRESS as `0x${string}`;
const PRIVATE_KEY = process.env.PAYMENT_ADDRESS as `0x${string}`; // Admin/Relayer Key

export async function POST(req: NextRequest) {
    try {
        const { requestId, secret, salt } = await req.json();

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

        // Wait for block confirmation handled by frontend, but we can do a quick check? 
        // No, contract handles logic. We just send.

        const hash = await client.writeContract({
            address: CORE_ADDRESS,
            abi: CartelCoreABI,
            functionName: 'revealRaid',
            args: [BigInt(requestId), secret, salt]
        });

        console.log(`[Relayer] Tx Sent: ${hash}`);

        // Wait for confirmation to reply?
        // Yes, good for UX
        const receipt = await client.waitForTransactionReceipt({ hash });

        if (receipt.status === 'success') {
            // Parse Logs to find RaidResult
            let won = false;
            let stolen = '0';

            // Minimal parser for RaidResult(uint256,address,bool,uint256)
            // Topic0 for RaidResult ... we can just trust the boolean for now if we don't have full ABI parsing handy without 'viem' helpers inside route easily.
            // Actually, we can just return success and let UI refetch. 
            // Better: Return the boolean 'success' arg from the event.

            // For MVP, just return success. Front-end will refresh.
            return NextResponse.json({ success: true, tx: hash });
        } else {
            return NextResponse.json({ error: "Transaction reverted", tx: hash }, { status: 500 });
        }

    } catch (error: any) {
        console.error("[Relayer Error]", error);
        // Handle "Too soon" or other contract errors
        return NextResponse.json({ error: error.message || "Relayer failed" }, { status: 500 });
    }
}
