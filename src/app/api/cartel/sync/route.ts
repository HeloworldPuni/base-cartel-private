import { NextResponse } from 'next/server';
import { indexEvents } from '@/lib/indexer-service';
import prisma from '@/lib/prisma';
import { CARTEL_SHARES_ADDRESS } from '@/lib/basePay';
import CartelSharesABI from '@/lib/abi/CartelShares.json';
import { ethers } from 'ethers';

const RPC_URL = process.env.BASE_RPC_URL || 'https://mainnet.base.org';

async function recoverUser(address: string) {
    console.log(`Recovering user ${address} from chain...`);
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    // Shares contract
    const contract = new ethers.Contract(CARTEL_SHARES_ADDRESS, CartelSharesABI, provider);

    // Read shares balance. Token ID 1 is the main share token? 
    // Wait, typical ERC1155? Let's check ABI or usage.
    // In CartelDashboard it uses `balanceOf(address, 1n)`. Correct.

    try {
        const balance = await contract.balanceOf(address, 1);
        const shares = Number(balance);
        console.log(`On-chain shares for ${address}: ${shares}`);

        // Upsert User
        await prisma.user.upsert({
            where: { walletAddress: address },
            update: {
                shares: { set: shares },
                lastSeenAt: new Date(),
                active: true
            },
            create: {
                walletAddress: address,
                shares: shares,
                active: true
            }
        });
        return shares;
    } catch (e) {
        console.error("Failed to read on-chain shares:", e);
        throw e;
    }
}

export async function POST(request: Request) {
    try {
        // Check if specific user sync requested
        const body = await request.json().catch(() => ({}));
        const { address } = body;

        if (address) {
            await recoverUser(address);
            return NextResponse.json({ success: true, recovered: true });
        }

        // Default: Indexer Sync
        console.log("Manual global sync triggered...");
        await indexEvents();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Sync error:', error);
        return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
    }
}
