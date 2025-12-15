
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("--- QUEST SYSTEM DIAGNOSTICS ---");

    // 1. Check Events
    const recentEvents = await prisma.questEvent.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
    });
    console.log(`\n1. Recent Quest Events (${recentEvents.length} found):`);
    recentEvents.forEach(e => {
        console.log(` - [${e.createdAt.toISOString()}] ${e.type} | Actor: ${e.actor} | Processed: ${e.processed}`);
    });

    // 2. Check Progress
    const progress = await prisma.questProgressV2.findMany({
        take: 5,
        orderBy: { updatedAt: 'desc' }
    });
    console.log(`\n2. Recent Progress Updates (${progress.length} found):`);
    progress.forEach(p => {
        console.log(` - User: ${p.userId} | Quest: ${p.questId} | Count: ${p.currentCount}/${p.targetCount} | Completed: ${p.completed}`);
    });

    // 3. Check Quests
    const quests = await prisma.quest.findMany();
    console.log(`\n3. Active Quests (${quests.length} found):`);
    quests.forEach(q => console.log(` - ${q.slug} (${q.frequency})`));

}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
