
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getActiveQuestsForUser } from '@/lib/quest-service';
import { getUserLevel } from '@/lib/config/levels';
import { getPendingShares } from '@/lib/quest-service';

export async function GET(request: Request) {
    // ❌ Legacy quest system — do not use
    console.warn("Legacy usage of /api/quests detected");

    try {
        const { searchParams } = new URL(request.url);
        const address = searchParams.get('address');

        if (!address) {
            return NextResponse.json({ error: 'Address required' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { walletAddress: address }
        });

        if (!user) {
            return NextResponse.json({
                quests: [],
                rep: 0,
                level: getUserLevel(0),
                pendingShares: { count: 0, totalAmount: 0 }
            });
        }

        const quests = await getActiveQuestsForUser(user.id);
        const level = getUserLevel(user.rep);
        const pendingShares = await getPendingShares(user.id);

        return NextResponse.json({
            quests,
            rep: user.rep,
            level,
            pendingShares
        });

    } catch (error) {
        console.error('Apps API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
