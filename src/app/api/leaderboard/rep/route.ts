
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '20');

        const users = await prisma.user.findMany({
            orderBy: { rep: 'desc' },
            take: limit,
            select: {
                walletAddress: true,
                farcasterId: true,
                rep: true,
                shares: true
            }
        });

        return NextResponse.json({
            leaderboard: users.map((u, i) => ({
                rank: i + 1,
                address: u.walletAddress,
                name: u.walletAddress, // or resolve farcaster
                rep: u.rep,
                shares: u.shares
            }))
        });

    } catch (error) {
        console.error('Rep Leaderboard API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
