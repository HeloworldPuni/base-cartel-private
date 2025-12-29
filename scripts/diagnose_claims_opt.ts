
import { ethers } from 'ethers';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const CORE_ADDRESS = process.env.NEXT_PUBLIC_CARTEL_CORE_ADDRESS;
const RPC_URL = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || 'https://sepolia.base.org';

const ABI = [
    "event Claim(address indexed user, uint256 amount)"
];

async function main() {
    console.log("--- DIAGNOSTIC: CHECKING CLAIM EVENTS (OPTIMIZED) ---");
    console.log(`Contract: ${CORE_ADDRESS}`);

    if (!CORE_ADDRESS) {
        console.error("Missing NEXT_PUBLIC_CARTEL_CORE_ADDRESS");
        return;
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CORE_ADDRESS, ABI, provider);

    const currentBlock = await provider.getBlockNumber();
    const totalScanAndLookback = 500000;
    let fromBlock = Math.max(0, currentBlock - totalScanAndLookback);
    const toBlock = currentBlock;

    console.log(`Scanning ${totalScanAndLookback} blocks (from ${fromBlock} to ${toBlock})...`);

    const CHUNK_SIZE = 50000;
    const allEvents = [];

    while (fromBlock < toBlock) {
        const end = Math.min(fromBlock + CHUNK_SIZE, toBlock);
        console.log(`Querying ${fromBlock} -> ${end}...`);
        try {
            const events = await contract.queryFilter(contract.filters.Claim(), fromBlock, end);
            allEvents.push(...events);
        } catch (e) {
            console.error(`Failed chunk ${fromBlock}-${end}:`, e.message);
        }
        fromBlock = end + 1;
    }

    console.log(`\n[ON-CHAIN] Found ${allEvents.length} TOTAL Claim events.`);

    if (allEvents.length > 0) {
        console.log("Last 10 On-Chain Events:");
        const last10 = allEvents.slice(-10);
        for (const e of last10) {
            if ('args' in e) {
                const user = e.args[0];
                const amount = ethers.formatUnits(e.args[1], 6);
                console.log(` - Block ${e.blockNumber}: User ${user} claimed ${amount} USDC`);
                console.log(`   Tx: ${e.transactionHash}`);

                // Check DB
                const dbExists = await prisma.cartelEvent.findUnique({
                    where: { txHash: e.transactionHash }
                });

                if (dbExists) {
                    console.log(`   -> [DB] EXISTS. Type: ${dbExists.type}, FeePaid: ${dbExists.feePaid}`);
                } else {
                    console.log(`   -> [DB] MISSING!`);
                }
            }
        }
    } else {
        console.log("No Claim events found in the last 500k blocks.");
    }

    const dbCount = await prisma.cartelEvent.count({ where: { type: 'CLAIM' } });
    console.log(`\n[DATABASE] Total 'CLAIM' rows: ${dbCount}`);
}

main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
