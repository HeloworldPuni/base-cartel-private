import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { inviteCode } = body;

        // If no code, return null referrer (Open Access)
        if (!inviteCode) {
            return NextResponse.json({
                isValid: true,
                referrerAddress: "0x0000000000000000000000000000000000000000"
            });
        }

        // Validate Invite
        const invite = await prisma.invite.findUnique({
            where: { code: inviteCode },
            include: { creator: true }
        });

        // Check if exists and has uses left
        const isValid = invite && (invite.status === 'unused' || invite.maxUses > invite.usedCount);

        if (!isValid) {
            return NextResponse.json({
                isValid: false,
                error: "Invalid or expired invite code"
            });
        }

        // Resolve Referrer
        const referrerAddress = invite.creator?.walletAddress || "0x0000000000000000000000000000000000000000";

        return NextResponse.json({
            isValid: true,
            referrerAddress
        });

    } catch (error) {
        console.error('[ReferralResolve] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
