import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log("--- DEBUGGING REVENUE ---");

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    console.log(`Checking events since: ${yesterday.toISOString()}`);

    // 1. Get All Events in 24h
    const events = await prisma.cartelEvent.findMany({
        where: { timestamp: { gte: yesterday } },
        orderBy: { timestamp: 'desc' },
        take: 5
    });

    console.log(`Found ${events.length} recent events.`);
    events.forEach(e => {
        console.log(`[${e.type}] Hash: ${e.txHash.substring(0, 10)}... | Fee: ${e.feePaid} | Stolen: ${e.stolenShares}`);
    });

    // 2. Aggregate Revenue
    const revenueAgg = await prisma.cartelEvent.aggregate({
        _sum: { feePaid: true },
        where: { timestamp: { gte: yesterday } }
    });

    console.log(`AGGREGATE REVENUE: ${revenueAgg._sum.feePaid}`);

    // 3. Count Raids
    const raids = await prisma.cartelEvent.count({
        where: {
            timestamp: { gte: yesterday },
            type: { in: ['RAID', 'HIGH_STAKES_RAID'] }
        }
    });
    console.log(`TOTAL RAIDS 24H: ${raids}`);

    await prisma.$disconnect();
}

main().catch(e => console.error(e));
