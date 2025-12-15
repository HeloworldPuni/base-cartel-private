
import prisma from './prisma';
import { QuestEvent, QuestProgressV2 } from '@prisma/client';

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

        if (events.length === 0) return;

        console.log(`[QuestEngine] Processing ${events.length} events...`);

        // 2. Process Each
        for (const event of events) {
            try {
                await this.routeEvent(event);

                // Mark Processed
                await prisma.questEvent.update({
                    where: { id: event.id },
                    data: { processed: true }
                });
            } catch (error) {
                console.error(`[QuestEngine] Error processing event ${event.id}:`, error);
                // We might want to mark 'failed' or retry count in future
            }
        }
    }

    private static async routeEvent(event: QuestEvent) {
        switch (event.type) {
            case 'RAID':
            case 'HIGH_STAKES':
                await this.handleRaid(event);
                break;
            case 'JOIN':
                await this.handleJoin(event);
                break;
            case 'REFER':
                await this.handleReferral(event);
                break;
            case 'CLAIM':
                await this.handleClaim(event);
                break;
            default:
                console.warn(`[QuestEngine] Unknown event type: ${event.type}`);
        }
    }

    // --- HANDLERS ---

    private static async handleRaid(event: QuestEvent) {
        const actor = event.actor;
        // Logic: Increment 'daily-raid-once', 'weekly-five-raids'
        await this.incrementProgress(actor, 'daily-raid-once', 1, 'DAILY');

        // Special: If High Stakes
        if (event.type === 'HIGH_STAKES') {
            await this.incrementProgress(actor, 'weekly-high-stakes', 1, 'WEEKLY');
        }

        // Generic: Raids
        await this.incrementProgress(actor, 'weekly-five-raids', 1, 'WEEKLY');
    }

    private static async handleJoin(event: QuestEvent) {
        // New user joined
        // Maybe 'onboarding' quests?
    }

    private static async handleReferral(event: QuestEvent) {
        const actor = event.actor; // The Referrer
        // Increment 'refer-1', 'refer-3', etc.
        await this.incrementProgress(actor, 'refer-1', 1, 'SEASONAL');
        await this.incrementProgress(actor, 'refer-3', 1, 'SEASONAL');
        await this.incrementProgress(actor, 'refer-10', 1, 'SEASONAL');
    }

    private static async handleClaim(event: QuestEvent) {
        const actor = event.actor;
        await this.incrementProgress(actor, 'daily-claim-once', 1, 'DAILY');
    }

    // --- CORE LOGIC ---

    private static async incrementProgress(userId: string, questSlug: string, amount: number, frequency: 'DAILY' | 'WEEKLY' | 'SEASONAL' | 'ONE_TIME') {
        const CURRENT_SEASON = 1; // Helper to get active season

        // 1. Get Quest Definition
        const quest = await prisma.quest.findUnique({ where: { slug: questSlug } });
        if (!quest || !quest.isActive) return;

        // 2. Get User Progress
        // Upsert logic is complex with unique constraints, let's find first
        let progress = await prisma.questProgressV2.findUnique({
            where: {
                userId_questId_seasonId: {
                    userId,
                    questId: quest.id,
                    seasonId: CURRENT_SEASON
                }
            }
        });

        if (!progress) {
            progress = await prisma.questProgressV2.create({
                data: {
                    userId,
                    questId: quest.id,
                    seasonId: CURRENT_SEASON,
                    currentCount: 0,
                    completed: false,
                    claimed: false
                }
            });
        }

        if (progress.completed) return; // Already done

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
            console.log(`[QuestEngine] User ${userId} COMPLETED ${questSlug}!`);
            // Award REP Immediately
            if (quest.rewardRep > 0) {
                await prisma.user.update({
                    where: { walletAddress: userId }, // Wait, userId in Progress is ID or Address? 
                    // Schema says userId String... pointing to User.id.
                    // But QuestEvent.actor is wallet address.
                    // IMPORTANT: We need to resolve Actor Address -> User ID.
                });
                // Fixing this logic below
            }

            // Queue Shares
            if (quest.rewardShares > 0) {
                // Create PendingShare
            }
        }
    }
}
