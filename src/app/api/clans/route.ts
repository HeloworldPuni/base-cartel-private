
import { NextResponse } from 'next/server';
import { ClanService } from '@/lib/clan-service';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const clans = await prisma.clan.findMany({
            where: { isActive: true },
            include: {
                _count: {
                    select: { members: true }
                },
                owner: {
                    select: { farcasterHandle: true, walletAddress: true }
                }
            },
            orderBy: {
                members: {
                    _count: 'desc'
                }
            },
            take: 50
        });

        // Transform for UI
        const result = clans.map(c => ({
            ...c,
            memberCount: c._count.members
        }));

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        const { name, tag, description } = body;

        if (!name || !tag) return NextResponse.json({ error: "Name and Tag required" }, { status: 400 });

        const clan = await ClanService.createClan(user.id, name, tag, description);
        return NextResponse.json(clan);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
