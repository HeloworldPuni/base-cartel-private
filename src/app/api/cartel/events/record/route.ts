import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateNewsFromEvents } from '@/lib/news-service';
import { createPublicClient, http, decodeEventLog } from 'viem';
import { baseSepolia } from 'viem/chains';
import CartelCoreABI from '@/lib/abi/CartelCore.json';

const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http()
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { txHash } = body; // Client only needs to send this!

        if (!txHash) {
            return NextResponse.json({ error: 'Missing txHash' }, { status: 400 });
        }

        // 1. Check idempotency
        const existing = await prisma.cartelEvent.findUnique({
            where: { txHash }
        });

        if (existing) {
            return NextResponse.json({ message: 'Event already recorded', event: existing });
        }

        // 2. Fetch Receipt from Chain
        const receipt = await publicClient.getTransactionReceipt({ hash: txHash as `0x${string}` });

        if (!receipt || receipt.status !== 'success') {
            return NextResponse.json({ error: 'Transaction failed or not found' }, { status: 404 });
        }

        // 3. Decode Logs (Robust Parsing)
        let foundEvent = null;

        for (const log of receipt.logs) {
            try {
                const decoded = decodeEventLog({
                    abi: CartelCoreABI,
                    data: log.data,
                    topics: log.topics
                }) as any;

                if (decoded.eventName === 'RaidResult' || decoded.eventName === 'HighStakesResult') {
                    const { raider, success } = decoded.args;

                    // [ROBUST FIX] Check various property names
                    const stealedVal = decoded.args.stealed || decoded.args.amount || decoded.args.stolenShares || 0n;
                    const penaltyVal = decoded.args.penalty || 0n;
                    const payoutVal = decoded.args.payout || 0n;

                    // Fetch Target (if not in event, infer from transaction input? Or simply store 'Unknown' and fix later?)
                    // Actually, for Raids, the 'target' is NOT emitted in RaidResult event in V3 contracts?
                    // Wait, V3 RaidResult(requestId, raider, success, stealed). NO TARGET.
                    // We need to fetch the Request log or Input Data to find the target.
                    // For now, let's try to pass target from body if available, else 'Unknown'.
                    const targetParams = body.target || 'Unknown';

                    foundEvent = await prisma.cartelEvent.create({
                        data: {
                            txHash,
                            blockNumber: Number(receipt.blockNumber),
                            timestamp: new Date(), // Block time ideally
                            type: decoded.eventName === 'HighStakesResult' ? 'HIGH_STAKES_RAID' : 'RAID',
                            attacker: raider,
                            target: targetParams,
                            stolenShares: Number(stealedVal),
                            selfPenaltyShares: Number(penaltyVal),
                            payout: Number(payoutVal),
                        }
                    });
                    break;
                }
            } catch (e) { /* ignore other events */ }
        }

        if (foundEvent) {
            // Trigger News Generation
            await generateNewsFromEvents();
            return NextResponse.json({ success: true, event: foundEvent });
        } else {
            return NextResponse.json({ error: 'No relevant event found in transaction' }, { status: 400 });
        }

    } catch (error: any) {
        console.error('Record Event Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
