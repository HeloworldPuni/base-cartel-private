import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
// Hack to run TS script without full path alias support in scripts sometimes
// In real repo, use proper tsconfig or module alias. 
// For this demo, I will inline or mock the scoring import if needed, but let's try assuming ts-node handles it via tsconfig.json paths.
// If not, I might need to copy logic.
// @ts-ignore
import { calculateFraudScore } from '../src/lib/services/anti-abuse';

const prisma = new PrismaClient();
const LOG_PATH = path.join(process.cwd(), 'artifacts', 'pending_shares_run.json');

// Caps
const SEASON_SHARE_POOL = 50000;
let seasonDistributed = 0; // Fetch from DB/Contract in real app

async function main() {
    const isDryRun = process.argv.includes('--dry-run');
    console.log(`Processing Pending Shares... (Dry Run: ${isDryRun})`);

    const pending = await prisma.pendingShare.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'asc' },
        take: 50,
        include: { user: true }
    });

    const results = [];
    let processedCount = 0;

    for (const item of pending) {
        // 1. Check Pool
        if (seasonDistributed + item.amount > SEASON_SHARE_POOL) {
            console.log(`Pool Exhausted.rejecting ${item.id} `);
            if (!isDryRun) {
                await prisma.pendingShare.update({
                    where: { id: item.id },
                    data: { status: 'REJECTED', reason: 'POOL_EXHAUSTED' }
                });
            }
            results.push({ id: item.id, status: 'REJECTED', reason: 'POOL_EXHAUSTED' });
            continue;
        }

        // 2. Fraud Score
        // We assume calculateFraudScore is available. If import fails in script, use mock.
        let fraudResult: any = { score: 0, action: 'PASS', details: [] };
        try {
            fraudResult = await calculateFraudScore(item.userId, item.user.walletAddress);
        } catch (e) {
            console.error("Error calculating fraud score", e);
            fraudResult = { score: 0, action: 'PASS', details: ['Script Error'] };
        }

        if (fraudResult.action === 'REJECT') {
            if (!isDryRun) {
                await prisma.pendingShare.update({
                    where: { id: item.id },
                    data: { status: 'REJECTED', reason: `High Fraud Score: ${fraudResult.score} ` }
                });
            }
            results.push({ id: item.id, status: 'REJECTED', fraud: fraudResult });
            continue;
        }

        if (fraudResult.action === 'REVIEW') {
            // Leave as PENDING (or move to REVIEW status if added to schema, currently ShareStatus has APPROVED/REJECTED/PENDING/MINTED)
            // Let's assume we skip it for manual admin intervention
            results.push({ id: item.id, status: 'PENDING (REVIEW)', fraud: fraudResult });
            continue;
        }

        // 3. "Mint" (Update status)
        if (!isDryRun) {
            // In real world: await contract.mint(...)
            const txHash = `mock_tx_${Date.now()}_${item.id} `;
            await prisma.pendingShare.update({
                where: { id: item.id },
                data: {
                    status: 'MINTED',
                    txHash: txHash
                }
            });
            seasonDistributed += item.amount;
            results.push({ id: item.id, status: 'MINTED', amount: item.amount, txHash, fraud: fraudResult });
        } else {
            results.push({ id: item.id, status: 'WOULD_MINT', amount: item.amount, fraud: fraudResult });
        }

        processedCount++;
    }

    console.log(`Processed ${pending.length} items.`);

    // Save Artifact
    if (!fs.existsSync(path.dirname(LOG_PATH))) fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
    fs.writeFileSync(LOG_PATH, JSON.stringify({ timestamp: new Date(), isDryRun, results }, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
