
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const quests = await prisma.quest.findMany();
    console.log("--- Quest ID Mapping ---");
    quests.forEach(q => {
        console.log(`Slug: ${q.slug.padEnd(25)} | ID: ${q.id}`);
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
