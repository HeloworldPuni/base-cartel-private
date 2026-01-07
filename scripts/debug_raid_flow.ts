
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();
const dbUrl = process.env.DATABASE_URL || "";
console.log("DB URL:", dbUrl ? `${dbUrl.substring(0, 10)}...` : "UNDEFINED");
const TARGET_USER = '0xfe09c35AdB9200c90455d31a2BFdfD7e30c48F6d';

async function main() {
    console.log("--- DEBUG RAID FLOW ---");
    console.log(`Target: ${TARGET_USER}`);

    // 1. Did Indexer see a recent Raid?
    const recentRaid = await prisma.cartelEvent.findFirst({
        where: {
            attacker: TARGET_USER,
            type: { in: ['RAID', 'HIGH_STAKES_RAID'] }
        },
        orderBy: { timestamp: 'desc' }
    });

    if (!recentRaid) {
        console.log("❌ No Raid found in CartelEvent for this user.");
        return;
    }
    console.log(`✅ Found recent Raid: ${recentRaid.txHash} (${recentRaid.type}) at ${recentRaid.timestamp.toISOString()}`);

    // 2. Did it create a QuestEvent?
    // QuestEvent actor might be checksummed or not, let's try strict first then insensitive
    let questEvent = await prisma.questEvent.findFirst({
        where: {
            // We can't easily link by txHash because QuestEvent doesn't store txHash directly relative to CartelEvent in V2 (it stores data json)
            // But we can look for recent QuestEvent for this actor
            type: { in: ['RAID', 'HIGH_STAKES'] },
            createdAt: { gte: new Date(recentRaid.timestamp.getTime() - 1000 * 60) } // within 1 min of the raid
        },
        orderBy: { createdAt: 'desc' }
    });

    // If not found, try querying by actor manual check in memory if needed, but let's assume filtering works?
    // Actually, QuestEvent actor matches CartelEvent attacker usually.
    if (!questEvent) {
        console.log("❌ No corresponding QuestEvent found around that time.");
    } else {
        console.log(`✅ Found QuestEvent: #${questEvent.id} [${questEvent.type}] Processed: ${questEvent.processed}`);
        if (questEvent.actor.toLowerCase() !== TARGET_USER.toLowerCase()) {
            console.warn(`⚠️ QuestEvent actor (${questEvent.actor}) mismatch target!`);
        }
    }

    // 3. Check User
    const user = await prisma.user.findFirst({
        where: { walletAddress: { equals: TARGET_USER, mode: 'insensitive' } }
    });
    console.log(`User ID: ${user?.id}`);

    // 4. Check Quest Definition
    const questSlug = 'daily-raid-once';
    const quest = await prisma.quest.findUnique({ where: { slug: questSlug } });
    console.log(`Quest '${questSlug}' Active: ${quest?.isActive}`);

    // 5. Check Progress
    if (user && quest) {
        const progress = await prisma.userQuestProgress.findUnique({
            where: {
                userId_questId: {
                    userId: user.id,
                    questId: quest.id
                }
            }
        });
        console.log("UserQuestProgress:", progress);
    }
}

main()
    .catch(e => console.error("FULL ERROR:", JSON.stringify(e, null, 2)))
    .finally(() => prisma.$disconnect());
