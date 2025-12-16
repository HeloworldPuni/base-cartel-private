
import { ethers } from 'ethers';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local explicitly from root
const envPath = path.resolve(process.cwd(), '.env.local');
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.warn("Warning: Failed to load .env.local via dotenv. Relying on system env.");
}

const prisma = new PrismaClient();

const SHARES_ADDRESS = process.env.NEXT_PUBLIC_CARTEL_SHARES_ADDRESS;
const RPC_URL = process.env.BASE_RPC_URL || 'https://sepolia.base.org';

const SHARES_ABI = [
    "event Transfer(address indexed from, address indexed to, uint256 indexed id, uint256 value)",
    "event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)",
    "function balanceOf(address account, uint256 id) view returns (uint256)"
];

async function main() {
    if (!SHARES_ADDRESS) {
        throw new Error("Missing NEXT_PUBLIC_CARTEL_SHARES_ADDRESS");
    }

    console.log(`Connecting to ${RPC_URL}...`);
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(SHARES_ADDRESS, SHARES_ABI, provider);

    console.log(`Scanning Transfer events on ${SHARES_ADDRESS}...`);

    // Scan last 50,000 blocks (approx 1 day on Base is too small, need more history? Base block time is 2s. 50k = 27 hours)
    // Let's go bigger or just fetch known users.
    // Better: Just query known active wallets from the DB + hardcoded test wallet if needed.
    // Actually, finding ALL holders via logs is best for a leaderboard.

    const currentBlock = await provider.getBlockNumber();
    const startBlock = currentBlock - 50000; // ~27 hours. If older, we miss them.
    // For a robust sync, we should ideally go back to deployment, but that's slow.
    // We'll scan recent + known DB users.

    const usersToSync = new Set<string>();

    // 1. Get users from DB
    const dbUsers = await prisma.user.findMany({ select: { walletAddress: true } });
    dbUsers.forEach(u => usersToSync.add(u.walletAddress));
    console.log(`Found ${dbUsers.length} users in DB.`);

    // 2. Scan logs (TransferSingle is standard 1155)
    // const logs = await contract.queryFilter(contract.filters.TransferSingle(), startBlock, currentBlock);
    // console.log(`Found ${logs.length} TransferSingle events.`);
    // logs.forEach((log: any) => {
    //     if (log.args) {
    //         usersToSync.add(log.args[2]); // to
    //         usersToSync.add(log.args[1]); // from
    //     }
    // });

    // Force add the known user from context if empty
    // I suspect the user is 0xfe09... let's deduce or hope they are in DB.
    // If DB is empty, this script won't do much unless we scan logs.
    // Let's ENABLE log scanning.
    try {
        console.log(`Scanning logs from ${startBlock} to ${currentBlock}...`);
        const logs = await contract.queryFilter(contract.filters.TransferSingle(), startBlock, currentBlock);
        console.log(`Found ${logs.length} transfers.`);

        logs.forEach((log: any) => {
            if (log.args) {
                const from = log.args[1];
                const to = log.args[2];
                if (to !== ethers.ZeroAddress) usersToSync.add(to);
                if (from !== ethers.ZeroAddress) usersToSync.add(from);
            }
        });
    } catch (e) {
        console.error("Log scan failed (maybe RPC limit), proceeding with DB users only.", e);
    }

    console.log(`Syncing ${usersToSync.size} unique users...`);

    for (const address of Array.from(usersToSync)) {
        if (!address || address === ethers.ZeroAddress) continue;

        try {
            const bal = await contract.balanceOf(address, 1); // Token ID 1
            const shares = Number(bal);

            console.log(`User ${address}: ${shares} shares`);

            await prisma.user.upsert({
                where: { walletAddress: address },
                update: { shares: shares, active: true },
                create: { walletAddress: address, shares: shares, active: true }
            });
        } catch (err) {
            console.error(`Failed to sync ${address}:`, err);
        }
    }

    console.log("Sync Complete.");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
