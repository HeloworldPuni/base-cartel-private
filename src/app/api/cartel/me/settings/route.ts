import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { address, xHandle, farcasterHandle } = body;

        if (!address) {
            return NextResponse.json({ error: 'Address required' }, { status: 400 });
        }

        // Validate basic length to prevent abuse
        if ((xHandle && xHandle.length > 50) || (farcasterHandle && farcasterHandle.length > 50)) {
            return NextResponse.json({ error: 'Handle too long' }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { walletAddress: address },
            data: {
                xHandle: xHandle || null,
                farcasterHandle: farcasterHandle || null
            }
        });

        return NextResponse.json({ success: true, user: updatedUser });
    } catch (error) {
        console.error('Settings API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
