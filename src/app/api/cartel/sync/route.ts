import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getFrameMessage } from "frames.js"; // Optional validation

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { address, shares } = body;

        if (!address || typeof shares !== 'number') {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        // Fix: Use Checksum Address to match Indexer/DB standard (prevents duplicates)
        // We previously used toLowerCase() which caused a fork.
        const { getAddress } = await import('viem');
        let checksumAddress = address;
        try {
            checksumAddress = getAddress(address);
        } catch (e) {
            // fallback if invalid
            checksumAddress = address;
        }

        // 1. Cleanup: If a lowercase duplicate exists (from previous bug), delete it to un-clutter
        const lowerAddr = address.toLowerCase();
        if (lowerAddr !== checksumAddress) {
            const badDup = await prisma.user.findUnique({ where: { walletAddress: lowerAddr } });
            if (badDup) {
                console.log(`Cleaning up duplicate lowercase user: ${lowerAddr}`);
                // Verify we aren't deleting the main one if they happen to be same (impossible due to if check)
                // We should ideally merge stats, but Sync is authoritative for 'shares', so we just drop the dup.
                try {
                    await prisma.user.delete({ where: { walletAddress: lowerAddr } });
                } catch (e) {
                    console.warn("Could not delete duplicate (constraints?):", e);
                }
            }
        }

        // 2. Upsert using the correct Checksum Address
        const user = await prisma.user.upsert({
            where: { walletAddress: checksumAddress },
            update: {
                shares: shares,
                lastSeenAt: new Date()
            },
            create: {
                walletAddress: checksumAddress,
                shares: shares,
                lastSeenAt: new Date()
            }
        });

        return NextResponse.json({ success: true, user });

    } catch (error) {
        console.error("Sync error:", error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
