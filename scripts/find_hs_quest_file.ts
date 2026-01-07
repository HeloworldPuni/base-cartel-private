
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
const prisma = new PrismaClient();

async function main() {
    try {
        const q = await prisma.quest.findUnique({
            where: { slug: 'weekly-high-stakes' }
        });
        const output = q ? `FOUND:${q.id}` : "NOT_FOUND";
        fs.writeFileSync('d:/demos/quest_id_log.txt', output);
    } catch (e: any) {
        fs.writeFileSync('d:/demos/quest_id_log.txt', `ERROR:${e.message}`);
    } finally {
        await prisma.$disconnect();
    }
}
main();
