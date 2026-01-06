
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { QuestEngine } from '@/lib/quest-engine';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const logs: string[] = [];
    const log = (msg: string) => { console.log(msg); logs.push(msg); };

    try {
        log("Starting Manual Raid Fix...");

        // 1. Find Stuck Raids (Standard Logic)
        const stuckRaids = await prisma.cartelEvent.findMany({
            where: {
                type: 'RAID',
                processed: false
            },
            take: 50
        });

        // 2. Deep Repair for High Stakes (Check verified processed ones too)
        // because they might have been marked processed but skipped Quest creation
        const highStakes = await prisma.cartelEvent.findMany({
            where: {
                type: 'HIGH_STAKES_RAID'
            },
            take: 20,
            orderBy: { timestamp: 'desc' }
        });

        const allEvents = [...stuckRaids, ...highStakes];
        log(`Found ${stuckRaids.length} stuck raids and ${highStakes.length} recent high stakes.`);

        let fixedCount = 0;

        for (const raid of allEvents) {
            // Dedupe loop if event is in both lists (unlikely due to type filter)

            // ... (rest of logic)
            log(`Fixing Raid ${raid.txHash}...`);

            // A. Ensure User Exists
            if (raid.attacker) {
                // Determine shares (fallback to DB or 0 if unknown, assuming sync handles it or subsequent event)
                // actually we just need user record for QuestEngine to attach progress.
                // We'll trust existing record or create stub.
                const user = await prisma.user.findFirst({
                    where: { walletAddress: { equals: raid.attacker, mode: 'insensitive' } }
                });

                if (!user) {
                    log(`Creating missing user ${raid.attacker}`);
                    await prisma.user.create({
                        data: { walletAddress: raid.attacker, shares: 0 }
                    });
                }
            }

            // B. Create Quest Event (Idempotent check)
            const existingQe = await prisma.questEvent.findFirst({
                where: {
                    createdAt: raid.timestamp,
                    type: raid.type === 'HIGH_STAKES_RAID' ? 'HIGH_STAKES' : 'RAID'
                }
            });

            if (!existingQe) {
                await prisma.questEvent.create({
                    data: {
                        type: raid.type === 'HIGH_STAKES_RAID' ? 'HIGH_STAKES' : 'RAID',
                        actor: raid.attacker!,
                        data: {
                            target: raid.target,
                            stolen: Number(raid.stolenShares),
                            penalty: raid.selfPenaltyShares ? Number(raid.selfPenaltyShares) : 0,
                            success: true
                        },
                        processed: false, // Let QuestEngine process it
                        createdAt: raid.timestamp
                    }
                });
                log(`Created QuestEvent for ${raid.txHash}`);
                fixedCount++;
            } else {
                log(`QuestEvent already exists for ${raid.txHash}`);
            }

            // C. Mark CartelEvent processed so we don't fix it again
            await prisma.cartelEvent.update({
                where: { id: raid.id },
                data: { processed: true }
            });
        }

        log(`Fixed ${fixedCount} events. Triggering QuestEngine...`);

        // 2. Run Engine
        const questStats = await QuestEngine.processPendingEvents();

        return NextResponse.json({
            success: true,
            fixedCount,
            logs,
            questLogs: questStats.logs
        });

    } catch (error: any) {
        log(`Error: ${error.message}`);
        return NextResponse.json({ success: false, logs }, { status: 500 });
    }
}
