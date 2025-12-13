import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    // Simple protection: require a query param ?confirm=true
    const { searchParams } = new URL(request.url);
    if (searchParams.get('confirm') !== 'true') {
        return NextResponse.json({ error: 'Missing confirm=true' }, { status: 400 });
    }

    try {
        // Delete in order to satisfy Foreign Keys

        // 1. Child tables (Referrals, Clan Memberships, Activity)
        await prisma.cartelReferral.deleteMany({});
        await prisma.referral.deleteMany({}); // Delete Referrals before Invites

        // 2. User/Game Data
        await prisma.userQuestProgress.deleteMany({});
        await prisma.pendingShare.deleteMany({});
        await prisma.notificationToken.deleteMany({});
        await prisma.fraudEvent.deleteMany({});

        // 3. Invites (must be after Referrals)
        await prisma.invite.deleteMany({});

        // 4. Global Events (Optional, but cleaner)
        // await prisma.cartelNews.deleteMany({});
        // await prisma.cartelEvent.deleteMany({});

        // 5. Finally, Users
        const deleteUsers = await prisma.user.deleteMany({});

        return NextResponse.json({
            success: true,
            message: `Database wiped. Deleted ${deleteUsers.count} users.`
        });

    } catch (error: any) {
        console.error('Reset DB Error:', error);
        return NextResponse.json({
            error: 'Failed to reset DB',
            details: error.message
        }, { status: 500 });
    }
}
