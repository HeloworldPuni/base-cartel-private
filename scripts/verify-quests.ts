
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const count = await prisma.quest.count();
        console.log(`QUEST_COUNT: ${count}`);

        if (count > 0) {
            const quests = await prisma.quest.findMany({ select: { slug: true } });
            console.log("Quests found:", quests.map(q => q.slug).join(", "));
        }
    } catch (e) {
        console.error("Verification Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
