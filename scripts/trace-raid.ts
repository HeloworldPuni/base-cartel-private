
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("--- TRACE START ---");

    // STEP 1: Confirm QuestEvent
    console.log("\n[STEP 1] Querying Latest QuestEvent...");
    const event = await prisma.questEvent.findFirst({
        where: { type: { in: ['RAID', 'HIGH_STAKES'] } },
        orderBy: { createdAt: 'desc' }
    });

    if (event) {
        console.log("Event Found:");
        console.log(` - ID: ${event.id}`);
        console.log(` - Type: ${event.type}`);
        console.log(` - Actor: ${event.actor}`);
        console.log(` - Processed: ${event.processed}`);
        console.log(` - CreatedAt: ${event.createdAt.toISOString()}`);
        console.log(` - Data: ${JSON.stringify(event.data)}`);
    } else {
        console.log("NO RAID EVENT FOUND.");
    }

    // STEP 3: Confirm QuestProgressV2
    if (event) {
        console.log("\n[STEP 3] Querying QuestProgressV2...");
        // Resolve User
        const user = await prisma.user.findUnique({ where: { walletAddress: event.actor } });
        if (user) {
            console.log(` - User ID resolved: ${user.id}`);
            const progress = await prisma.questProgressV2.findFirst({
                where: {
                    userId: user.id,
                    seasonId: 1
                },
                include: { quest: true }
            });

            if (progress) {
                console.log("Progress Found:");
                console.log(` - Quest: ${progress.questId}`);
                console.log(` - Count: ${progress.currentCount}`);
                console.log(` - Completed: ${progress.completed}`);
                console.log(` - UpdatedAt: ${progress.updatedAt.toISOString()}`);
            } else {
                console.log(`NO PROGRESS FOUND for User ${user.id} in Season 1.`);
            }
        } else {
            console.log(`USER NOT FOUND for address ${event.actor}`);
        }
    }

    console.log("--- TRACE END ---");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
