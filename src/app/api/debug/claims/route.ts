
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
        return NextResponse.json({ error: "Address required" }, { status: 400 });
    }

    try {
        // 1. Fetch User
        const user = await prisma.user.findUnique({
            where: { walletAddress: address }
        });

        // 2. Fetch Raw Claim Events
        const events = await prisma.cartelEvent.findMany({
            where: {
                attacker: address,
                type: 'CLAIM'
            },
            orderBy: { blockNumber: 'desc' },
            take: 50
        });

        // 3. Aggregate
        const aggregation = await prisma.cartelEvent.aggregate({
            where: {
                attacker: address,
                type: 'CLAIM'
            },
            _sum: {
                feePaid: true
            }
        });

        return NextResponse.json({
            user: user || "Not found in DB",
            rawEvents: events,
            dbAggregation: aggregation._sum.feePaid || 0,
            calculatedTotal: (user?.referralRewardsClaimed || 0) + (aggregation._sum.feePaid || 0),
            debugMessage: "If rawEvents is empty, the Indexer missed the events on-chaine."
        });

    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
