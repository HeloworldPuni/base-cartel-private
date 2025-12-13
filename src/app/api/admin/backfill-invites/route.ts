import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        console.log("[Backfill] Starting invite code backfill...");

        // 1. Find users with 0 invites
        // Prisma doesn't support filtering by relation count easily in findMany where clause in all versions,
        // but we can fetch all and filter or use a raw query.
        // Let's fetch all active users and their invite count.
        const users = await prisma.user.findMany({
            where: { active: true },
            include: { invites: true }
        });

        const usersNeedingInvites = users.filter(u => u.invites.length === 0);
        console.log(`[Backfill] Found ${usersNeedingInvites.length} users needing invites out of ${users.length} total.`);

        let createdCount = 0;

        // 2. Generate Invites
        for (const user of usersNeedingInvites) {
            const newInvites = Array.from({ length: 3 }).map(() => ({
                code: 'BASE-' + uuidv4().substring(0, 6).toUpperCase(),
                creatorId: user.id,
                type: 'user',
                maxUses: 1000,
                status: 'unused'
            }));

            await prisma.$transaction(
                newInvites.map(inv => prisma.invite.create({ data: inv }))
            );
            createdCount += 3;
            console.log(`[Backfill] Generated 3 invites for ${user.walletAddress}`);
        }

        return NextResponse.json({
            success: true,
            processedUsers: usersNeedingInvites.length,
            createdInvites: createdCount
        });

    } catch (error) {
        console.error("[Backfill] Error:", error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
