import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const address = searchParams.get('address');

        if (!address) {
            // If no address, return generic stats
            const totalUsers = await prisma.user.count();
            const usersWithInvites = await prisma.user.count({
                where: { invites: { some: {} } }
            });
            return NextResponse.json({
                status: 'Should provide ?address=0x...',
                stats: {
                    totalUsers,
                    usersWithInvites,
                    usersWithoutInvites: totalUsers - usersWithInvites
                }
            });
        }

        const user = await prisma.user.findUnique({
            where: { walletAddress: address },
            include: {
                invites: true,
                referral: true,
                referredBy: true
            }
        });

        const events = await prisma.cartelEvent.findMany({
            where: {
                OR: [
                    { attacker: address },
                    { target: address }
                ],
                type: 'JOIN'
            },
            take: 5
        });

        return NextResponse.json({
            address,
            foundInDb: !!user,
            userRecord: user,
            relatedEvents: events
        });

    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
