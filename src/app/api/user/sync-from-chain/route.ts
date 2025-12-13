import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { CARTEL_SHARES_ADDRESS } from '@/lib/basePay';
import CartelSharesABI from '@/lib/abi/CartelShares.json';
import { ethers } from 'ethers';
import { v4 as uuidv4 } from 'uuid';

const RPC_URL = process.env.BASE_RPC_URL || 'https://mainnet.base.org';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { address, inviteCode, farcasterId } = body;

        if (!address) {
            return NextResponse.json({ error: 'Address required' }, { status: 400 });
        }

        console.log(`[SyncFromChain] Verifying membership for ${address}...`);

        // 1. VERIFY ON-CHAIN TRUTH
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(CARTEL_SHARES_ADDRESS, CartelSharesABI, provider);

        // Check Balance of Token ID 1 (Cartel Shares)
        const balanceBig = await contract.balanceOf(address, 1);
        const shares = Number(balanceBig);

        if (shares <= 0) {
            return NextResponse.json({
                success: false,
                message: "No on-chain shares found. Join transaction may have failed."
            }, { status: 400 });
        }

        console.log(`[SyncFromChain] User has ${shares} shares. Syncing to DB...`);

        // 2. UPSERT USER (Safe to run multiple times)
        const user = await prisma.user.upsert({
            where: { walletAddress: address },
            update: {
                shares: shares, // Update with latest authoritative value
                active: true,
                lastSeenAt: new Date(),
                // Only set FID if not already set, or update if provided? 
                // Let's allow update if provided.
                ...(farcasterId ? { farcasterId: farcasterId.toString() } : {})
            },
            create: {
                walletAddress: address,
                shares: shares,
                active: true,
                farcasterId: farcasterId ? farcasterId.toString() : null
            }
        });

        // 3. HANDLE INVITE ATTRIBUTION (If relevant and not already processed)
        // We only process the invite if the user doesn't have a referrer yet?
        // Or strictly if code is provided.
        if (inviteCode) {
            const invite = await prisma.invite.findUnique({
                where: { code: inviteCode },
                include: { creator: true }
            });

            if (invite && invite.creator) {
                // Check if referral already exists to prevent double-counting
                const existingReferral = await prisma.cartelReferral.findFirst({
                    where: { userAddress: address }
                });

                if (!existingReferral) {
                    console.log(`[SyncFromChain] Linking referral: ${invite.creator.walletAddress} -> ${address}`);

                    // Link Referral in DB
                    await prisma.cartelReferral.create({
                        data: {
                            userAddress: address,
                            referrerAddress: invite.creator.walletAddress,
                            season: 1
                        }
                    });

                    // Mark Invite Used
                    await prisma.invite.update({
                        where: { id: invite.id },
                        data: {
                            usedCount: { increment: 1 },
                            status: (invite.usedCount + 1 >= invite.maxUses) ? 'used' : 'unused'
                        }
                    });
                }
            }
        }

        // 4. ENSURE USER HAS THEIR OWN INVITES
        const existingInvites = await prisma.invite.count({
            where: { creatorId: user.id }
        });

        if (existingInvites === 0) {
            const newInvites = Array.from({ length: 3 }).map(() => ({
                code: 'BASE-' + uuidv4().substring(0, 6).toUpperCase(),
                creatorId: user.id,
                type: 'user',
                maxUses: 1000,
                status: 'unused'
            }));

            for (const inv of newInvites) {
                await prisma.invite.create({ data: inv });
            }
        }

        return NextResponse.json({ success: true, user });

    } catch (error) {
        console.error('[SyncFromChain] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
