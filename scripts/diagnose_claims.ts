
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
    console.log("--- DIAGNOSTIC: CHECKING CLAIM EVENTS ---");
    console.log(`Contract: ${CORE_ADDRESS}`);
    console.log(`RPC: ${RPC_URL}`);

    if (!CORE_ADDRESS) {
        console.error("Missing NEXT_PUBLIC_CARTEL_CORE_ADDRESS");
        return;
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CORE_ADDRESS, ABI, provider);

    const currentBlock = await provider.getBlockNumber();
    const startBlock = Math.max(0, currentBlock - 500000);

    console.log(`Scanning blocks ${startBlock} to ${currentBlock} (~${currentBlock - startBlock} blocks)...`);

    try {
        const events = await contract.queryFilter(contract.filters.Claim(), startBlock, currentBlock);
        console.log(`\n[ON-CHAIN] Found ${events.length} Claim events.`);

        if (events.length > 0) {
            console.log("Last 5 On-Chain Events:");
            const last5 = events.slice(-5);
            for (const e of last5) {
                if ('args' in e) {
                    console.log(` - Block ${e.blockNumber}: User ${e.args[0]} claimed ${ethers.formatUnits(e.args[1], 6)} USDC (Tx: ${e.transactionHash})`);

                    // Check DB for this specific event
                    const dbExists = await prisma.cartelEvent.findUnique({
                        where: { txHash: e.transactionHash }
                    });

                    if (dbExists) {
                        console.log(`   -> [DB STATUS] FOUND. Type: ${dbExists.type}, FeePaid: ${dbExists.feePaid}, Processed: ${dbExists.processed}`);
                    } else {
                        console.log(`   -> [DB STATUS] MISSING!`);
                    }
                }
            }
        } else {
            console.log("No Claim events found on-chain. Are you sure users have claimed in this range?");
        }

        // DB Summary
        const dbCount = await prisma.cartelEvent.count({
            where: { type: 'CLAIM' }
        });
        console.log(`\n[DATABASE] Total 'CLAIM' events in DB: ${dbCount}`);

    } catch (error) {
        console.error("Error querying events:", error);
    }
}

main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
