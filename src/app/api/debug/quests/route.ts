
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const address = searchParams.get('address');

        if (!address) {
            return NextResponse.json({ error: 'Address required' }, { status: 400 });
        }

        const stats: any = {
            target: address,
            userResolution: {},
            pendingEvents: [],
            questProgress: []
        };

        // 1. Resolve User
        const exactUser = await prisma.user.findUnique({ where: { walletAddress: address } });
        const insensitiveUser = await prisma.user.findFirst({
            where: { walletAddress: { equals: address, mode: 'insensitive' } }
        });

        stats.userResolution = {
            exactMatch: exactUser ? exactUser.id : null,
            insensitiveMatch: insensitiveUser ? insensitiveUser.id : null,
            walletAddressStored: insensitiveUser?.walletAddress
        };

        const resolvedId = exactUser?.id || insensitiveUser?.id;

        // 2. Pending Events
        const pending = await prisma.questEvent.findMany({
            where: {
                processed: false,
                // Simple textual check in JSON or actor field
                // Note: actor is a string.
                actor: { contains: address.substring(2, 6), mode: 'insensitive' }
            },
            take: 5,
            orderBy: { createdAt: 'desc' }
        });

        // 2b. Recent History (Processed)
        const history = await prisma.questEvent.findMany({
            where: {
                // actor: { equals: address, mode: 'insensitive' } // Ideally strict
                actor: { contains: address.substring(2, 6), mode: 'insensitive' }
            },
            take: 10,
            orderBy: { createdAt: 'desc' }
        });

        stats.pendingEvents = pending;
        stats.recentHistory = history;

        // 2c. Cartel Events (Raw Blockchain Index)
        const cartelEvents = await prisma.cartelEvent.findMany({
            where: {
                // attacker: { contains: address.substring(2, 6), mode: 'insensitive' },
                // Let's rely on loose match or strict if possible, but for debugging loose is safer
                attacker: { contains: address.substring(2, 6), mode: 'insensitive' },
                type: { in: ['RAID', 'HIGH_STAKES_RAID'] }
            },
            take: 5,
            orderBy: { timestamp: 'desc' }
        });

        stats.rawCartelEvents = cartelEvents;

        // 3. Progress
        if (resolvedId) {
            // Correct table: QuestProgressV2
            // @ts-ignore
            const progress = await prisma.questProgressV2.findMany({
                where: { userId: resolvedId }
            });
            // V2 doesn't have relation to Quest in schema? It might not.
            // schema.prisma line 297 doesn't show relation.
            // So we just dump raw progress.
            stats.questProgress = progress;
        }

        return NextResponse.json(stats);

    } catch (error: any) {
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}
