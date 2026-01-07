
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("START_DEBUG");
        const addr = '0x423c8a3A21D66CB2C6d91Cb851009534D0aDC5b8';
        console.log(`Looking for user: ${addr}`);

        const user = await prisma.user.findFirst({
            where: { walletAddress: { equals: addr, mode: 'insensitive' } }
        });

        if (!user) {
            console.log("USER_NOT_FOUND");
            return;
        }

        console.log(`FOUND_USER_ID: ${user.id}`);

        const progress = await prisma.questProgressV2.findMany({
            where: { userId: user.id }
        });

        console.log("PROGRESS_COUNT: " + progress.length);
        console.log("PROGRESS_DATA: " + JSON.stringify(progress));

        const event = await prisma.questEvent.findFirst({
            where: {
                type: 'HIGH_STAKES',
                actor: { equals: addr, mode: 'insensitive' }
            },
            orderBy: { createdAt: 'desc' }
        });
        console.log("LATEST_EVENT: " + JSON.stringify(event));

    } catch (e: any) {
        console.error("SCRIPT_ERROR:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}
main();
