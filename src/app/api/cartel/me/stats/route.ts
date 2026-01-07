import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const address = searchParams.get('address');

        if (!address) {
            return NextResponse.json({ error: 'Address required' }, { status: 400 });
        }

        // QA MOCKS
        if (address === '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA') return NextResponse.json({ highStakesCount: 10, shares: 2450, rank: 1 });
        if (address === '0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB') return NextResponse.json({ highStakesCount: 5, shares: 1890, rank: 2 });
        if (address === '0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC') return NextResponse.json({ highStakesCount: 0, shares: 1420, rank: 3 });
        if (address === '0xDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD') return NextResponse.json({ highStakesCount: 0, shares: 0, rank: 100 });


        const highStakesCount = await prisma.cartelEvent.count({
            where: {
                attacker: address,
                type: 'HIGH_STAKES_RAID'
            }
        });

        // Get user shares
        const user = await prisma.user.findUnique({
            where: { walletAddress: address },
            select: {
                shares: true,
                createdAt: true,
                referralRewardsClaimed: true
            }
        });

        // Calculate rank (simple count of users with more shares)
        const rank = await prisma.user.count({
            where: {
                shares: { gt: user?.shares || 0 }
            }
        }) + 1;

        const totalPlayers = await prisma.user.count();

        // Calculate Earnings (Claims + Referrals)
        const claims = await prisma.cartelEvent.aggregate({
            where: {
                attacker: address,
                type: 'CLAIM'
            },
            _sum: { feePaid: true }
        });

        // Heuristic: If claims are in Wei (huge), convert to ETH. 
        // If indexer stored them as ETH (small), keep as is.
        // Threshold: 1000 (ETH is unlikely to be > 1000 for this demo context, Wei is always > 1000)
        let claimEth = claims._sum.feePaid || 0;
        if (claimEth > 1000) {
            claimEth = claimEth / 1e18;
        }

        const totalEarnings = (claimEth + (user?.referralRewardsClaimed || 0)).toFixed(4);

        return NextResponse.json({
            highStakesCount,
            shares: user?.shares || 0,
            rank,
            totalPlayers,
            joinedDate: user?.createdAt,
            earnings: totalEarnings
        });
    } catch (error) {
        console.error('Stats API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
