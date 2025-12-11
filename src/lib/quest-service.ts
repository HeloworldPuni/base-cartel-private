
import prisma from './prisma';
import { Quest, UserQuestProgress, QuestFrequency } from '@prisma/client';

export type QuestWithProgress = Quest & {
    progress: {
        completedCount: number;
        completed: boolean;
    }
};

export async function getActiveQuestsForUser(userId: string): Promise<QuestWithProgress[]> {
    const quests = await prisma.quest.findMany({
        where: { isActive: true },
        include: {
            progress: {
                where: { userId }
            }
        }
    });

    const now = new Date();

    return quests.map(quest => {
        let progress = quest.progress[0]; // Could be undefined

        let completedCount = 0;
        let lastReset = progress?.lastResetAt;

        if (progress) {
            // Check for resets
            const shouldReset = checkReset(quest.frequency, progress.lastResetAt, now);
            if (shouldReset) {
                completedCount = 0;
                // We don't update DB here, strictly read-time calculation or lazy update?
                // Better to treat it as 0, and update on next completion.
                // Or better, just return 0. 
            } else {
                completedCount = progress.completedCount;
            }
        }

        const isCompleted = completedCount >= quest.maxCompletions;

        return {
            ...quest,
            progress: {
                completedCount,
                completed: isCompleted
            }
        };
    });
}

function checkReset(frequency: QuestFrequency, lastReset: Date, now: Date): boolean {
    const reset = new Date(lastReset);

    if (frequency === 'DAILY') {
        // Different day?
        return reset.getUTCDate() !== now.getUTCDate() ||
            reset.getUTCMonth() !== now.getUTCMonth() ||
            reset.getUTCFullYear() !== now.getUTCFullYear();
    }

    if (frequency === 'WEEKLY') {
        // Simple logic: > 7 days
        const diff = now.getTime() - reset.getTime();
        return diff > 7 * 24 * 60 * 60 * 1000;
    }

    if (frequency === 'SEASONAL') {
        // TODO: Hook into actual seasons
        return false;
    }

    return false; // ONE_TIME never resets
}

export async function completeQuest(userId: string, questSlug: string) {
    const quest = await prisma.quest.findUnique({
        where: { slug: questSlug }
    });

    if (!quest || !quest.isActive) {
        throw new Error("Quest not found or inactive");
    }

    // Transaction to ensure atomicity
    return await prisma.$transaction(async (tx) => {
        // Get or create progress
        let progress = await tx.userQuestProgress.findUnique({
            where: {
                userId_questId: {
                    userId,
                    questId: quest.id
                }
            }
        });

        const now = new Date();
        let currentCount = 0;

        if (!progress) {
            // Create new
            progress = await tx.userQuestProgress.create({
                data: {
                    userId,
                    questId: quest.id,
                    completedCount: 0,
                    lastResetAt: now
                }
            });
        } else {
            // Check reset logic inside transaction to be safe
            if (checkReset(quest.frequency, progress.lastResetAt, now)) {
                // It's a reset!
                currentCount = 0;
                // Update reset time
                await tx.userQuestProgress.update({
                    where: { id: progress.id },
                    data: {
                        completedCount: 0,
                        lastResetAt: now
                    }
                });
            } else {
                currentCount = progress.completedCount;
            }
        }

        if (currentCount >= quest.maxCompletions) {
            throw new Error("Quest cap reached for this period");
        }

        // Increment
        const updatedProgress = await tx.userQuestProgress.update({
            where: { id: progress.id },
            data: {
                completedCount: { increment: 1 },
                lastCompletedAt: now
            }
        });

        // Award Rep
        if (quest.rewardRep > 0) {
            await tx.user.update({
                where: { id: userId },
                data: {
                    rep: { increment: quest.rewardRep }
                }
            });
        }

        let shareStatus = null;
        if (quest.rewardShares > 0) {
            // Create Pending Share
            await tx.pendingShare.create({
                data: {
                    userId,
                    amount: quest.rewardShares,
                    reason: `quest:${quest.slug}`,
                    status: 'PENDING'
                }
            });
            shareStatus = 'PENDING';
        }

        // Log it
        console.log(`[QUEST COMPLETED] User: ${userId}, Quest: ${questSlug}, Rep: ${quest.rewardRep}, Shares: ${quest.rewardShares} (${shareStatus})`);

        return {
            quest: quest.slug,
            newRep: quest.rewardRep,
            sharesAwarded: quest.rewardShares,
            shareStatus,
            newCount: updatedProgress.completedCount
        };
    });
}

export async function getPendingShares(userId: string) {
    const pending = await prisma.pendingShare.findMany({
        where: { userId, status: 'PENDING' }
    });

    const totalPending = pending.reduce((sum, item) => sum + item.amount, 0);
    return { count: pending.length, totalAmount: totalPending, items: pending };
}
