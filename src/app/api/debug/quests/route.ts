
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

        // 2. Pending Events (using strict filter first, then try to scan recent)
        const pending = await prisma.questEvent.findMany({
            where: {
                processed: false,
                // We can't easily filter purely by address if casing is mismatch, 
                // but let's try to find any that 'look like' the address
                actor: { contains: address.substring(2, 8), mode: 'insensitive' }
            },
            take: 10,
            orderBy: { createdAt: 'desc' }
        });
        stats.pendingEvents = pending;

        // 3. Progress
        if (resolvedId) {
            const progress = await prisma.questProgressV2.findMany({
                where: { userId: resolvedId }
            });
            stats.questProgress = progress;
        }

        return NextResponse.json(stats);

    } catch (error: any) {
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}
