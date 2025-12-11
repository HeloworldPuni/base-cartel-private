
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { completeQuest } from '@/lib/quest-service';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { address, questSlug } = body;

        if (!address || !questSlug) {
            return NextResponse.json({ error: 'Missing address or questSlug' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { walletAddress: address }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        try {
            const result = await completeQuest(user.id, questSlug);

            // Fetch updated rep
            const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });

            return NextResponse.json({
                success: true,
                ...result,
                totalRep: updatedUser?.rep || 0
            });
        } catch (e: any) {
            return NextResponse.json({ error: e.message }, { status: 400 });
        }

    } catch (error) {
        console.error('Quest Complete API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
