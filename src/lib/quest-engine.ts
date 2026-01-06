
import prisma from './prisma';
import { QuestEvent, UserQuestProgress } from '@prisma/client';

export class QuestEngine {

    // Core Processor
    static async processPendingEvents() {
        console.log("[QuestEngine] Checking for pending events...");

        // 1. Fetch Unprocessed Events
        const events = await prisma.questEvent.findMany({
            where: { processed: false },
            take: 50, // Batch limit
            orderBy: { createdAt: 'asc' }
        });

        if (events.length === 0) {
            console.log("[QuestEngine] No pending events found.");
            return;
        }

        console.log(`[QuestEngine] Found ${events.length} pending events. Processing...`);

        // 2. Process Each
        for (const event of events) {
            console.log(`[QuestEngine] Processing Event ${event.id} type=${event.type} actor=${event.actor}`);
            try {
                await this.routeEvent(event);

                // Mark Processed
                await prisma.questEvent.update({
                    where: { id: event.id },
                    data: { processed: true }
                });
                console.log(`[QuestEngine] Event ${event.id} processed successfully.`);
            } catch (error) {
                console.error(`[QuestEngine] Error processing event ${event.id}:`, error);
            }
        }
    }

    private static async routeEvent(event: QuestEvent, log: (m: string) => void) {
        switch (event.type) {
            case 'RAID':
            case 'HIGH_STAKES':
                await this.handleRaid(event, log);
                break;
            case 'JOIN':
                await this.handleJoin(event, log);
                break;
            case 'REFER':
                await this.handleReferral(event, log);
                break;
            case 'CLAIM':
                await this.handleClaim(event, log);
                break;
            default:
                console.warn(`[QuestEngine] Unknown event type: ${event.type}`);
        }
    }

    // --- HANDLERS ---

    private static async handleRaid(event: QuestEvent, log: (m: string) => void) {
        const actor = event.actor;
        log(`[QuestEngine] Handling Raid for ${actor}`);
        await this.incrementProgress(actor, 'daily-raid-once', 1, 'DAILY', log);

        if (event.type === 'HIGH_STAKES') {
            await this.incrementProgress(actor, 'weekly-high-stakes', 1, 'WEEKLY', log);
        }

        await this.incrementProgress(actor, 'weekly-five-raids', 1, 'WEEKLY', log);
    }

    private static async handleJoin(event: QuestEvent, log: (m: string) => void) {
        // No quest for joining yet
    }

    private static async handleReferral(event: QuestEvent, log: (m: string) => void) {
        const actor = event.actor;
        log(`[QuestEngine] Handling Referral for ${actor}`);
        await this.incrementProgress(actor, 'refer-1', 1, 'SEASONAL', log);
        await this.incrementProgress(actor, 'refer-3', 1, 'SEASONAL', log);
        await this.incrementProgress(actor, 'refer-10', 1, 'SEASONAL', log);
    }

    private static async handleClaim(event: QuestEvent, log: (m: string) => void) {
        const actor = event.actor;
        log(`[QuestEngine] Handling Claim for ${actor}`);
        await this.incrementProgress(actor, 'daily-claim-once', 1, 'DAILY', log);
    }

    // --- CORE LOGIC ---

    private static async incrementProgress(actorAddress: string, questSlug: string, amount: number, frequency: 'DAILY' | 'WEEKLY' | 'SEASONAL' | 'ONE_TIME', log: (m: string) => void) {
        const CURRENT_SEASON = 1;

        // 0. Resolve User (Wallet -> ID)
        // We need the User's UUID to link to QuestProgress
        // 0. Resolve User (Wallet -> ID)
        // We need the User's UUID to link to QuestProgress
        let user = await prisma.user.findUnique({ where: { walletAddress: actorAddress } });

        if (!user) {
            // Try case-insensitive lookup to be robust against checksum diffs
            user = await prisma.user.findFirst({
                where: {
                    walletAddress: { equals: actorAddress, mode: 'insensitive' }
                }
            });
        }

        if (!user) {
            log(`[QuestEngine] User not found for address ${actorAddress}. Skipping quest ${questSlug}.`);
            return;
        }

        // 1. Get Quest Definition
        const quest = await prisma.quest.findUnique({ where: { slug: questSlug } });
        if (!quest) {
            log(`[QuestEngine] Quest not found: ${questSlug}`);
            return;
        }
        if (!quest.isActive) {
            log(`[QuestEngine] Quest not active: ${questSlug}`);
            return;
        }

        log(`[QuestEngine] Updating ${questSlug} for ${actorAddress} (ID: ${user.id}). +${amount}`);

        // 2. Get User Progress
        let progress = await prisma.questProgressV2.findUnique({
            where: {
                userId_questId_seasonId: {
                    userId: user.id, // Correct ID Type
                    questId: quest.id,
                    seasonId: CURRENT_SEASON
                }
            }
        });

        if (!progress) {
            progress = await prisma.questProgressV2.create({
                data: {
                    userId: user.id,
                    questId: quest.id,
                    seasonId: CURRENT_SEASON,
                    currentCount: 0,
                    completed: false,
                    claimed: false
                }
            });
        }

        if (progress.completed) {
            log(`[QuestEngine] Quest ${questSlug} already completed for ${actorAddress}.`);
            return;
        }

        // 3. Increment
        const newCount = progress.currentCount + amount;
        const isCompleted = newCount >= quest.maxCompletions;

        await prisma.questProgressV2.update({
            where: { id: progress.id },
            data: {
                currentCount: newCount,
                completed: isCompleted
            }
        });

        if (isCompleted) {
            log(`[QuestEngine] User ${actorAddress} COMPLETED ${questSlug}!`);

            // Award REP
            if (quest.rewardRep > 0) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { rep: { increment: quest.rewardRep } }
                });
                log(`[QuestEngine] Awarded ${quest.rewardRep} REP to ${actorAddress}`);
            }

            // Award Shares (Queue)
            if (quest.rewardShares > 0) {
                // Logic for pending shares...
                // For now just log
                console.log(`[QuestEngine] Queued ${quest.rewardShares} Shares for ${actorAddress}`);
            }
        }
    }
}
