
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    try {
        const q = await prisma.quest.findUnique({
            where: { slug: 'weekly-high-stakes' }
        });
        if (q) {
            console.log(`QUEST_FOUND: ${q.slug} | ID: ${q.id}`);
        } else {
            console.log("QUEST_NOT_FOUND: weekly-high-stakes");
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
