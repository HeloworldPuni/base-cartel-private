
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

        // 2. Deep Repair for High Stakes
        // Hypothesis: Contract emits 'Raid' for both, but High Stakes has higher fee.
        // RAID_FEE = 0.005 USDC (5e15), HIGH_STAKES = 0.015 USDC (1.5e16)
        // Check recent (processed) RAIDs for high fee.
        const recentRaids = await prisma.cartelEvent.findMany({
            where: {
                type: 'RAID',
                processed: true // Processed by Indexer already
            },
            take: 100,
            orderBy: { timestamp: 'desc' }
        });

        const HIGH_FEE_THRESHOLD = 10000000000000000; // 0.01 USDC (1e16)

        const allEvents = [...stuckRaids];
        let fixedCount = 0;

        for (const raid of recentRaids) {
            // Check if fee indicates High Stakes
            // Use feePaid if available, else fee (indexer maps feePaid->fee in memory, likely similar in DB)
            // If TS error on 'fee', using 'any' cast to be safe or check schema.
            // Based on indexer-service, DB model likely has 'feePaid'. Let's check 'feePaid' or 'fee'.
            // Actually, best to cast to any to avoid property check issues if type is loose.
            const r = raid as any;
            const fee = r.fee || r.feePaid || 0;

            if (fee > HIGH_FEE_THRESHOLD) {
                log(`Found potential High Stakes Raid: ${raid.txHash} Fee: ${fee}`);
                // Treat as High Stakes Candidate

                // Check if we already have the High Stakes Quest Event
                const hsEvent = await prisma.questEvent.findFirst({
                    where: {
                        type: 'HIGH_STAKES', // QuestEvent type
                        createdAt: raid.timestamp // Correlate by time
                    }
                });

                if (!hsEvent) {
                    log(`Creating missing HIGH_STAKES QuestEvent for ${raid.txHash}`);
                    await prisma.questEvent.create({
                        data: {
                            type: 'HIGH_STAKES',
                            actor: raid.attacker!,
                            data: {
                                target: raid.target,
                                stolen: Number(raid.stolenShares), // Re-use stolen
                                penalty: 0, // Unknown if not in log, assume 0
                                success: true
                            },
                            processed: false,
                            createdAt: raid.timestamp
                        }
                    });
                    fixedCount++;
                }
            }
        }

        log(`Found ${stuckRaids.length} stuck raids and scanned ${recentRaids.length} recent raids for High Stakes.`);

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
