import { ethers } from 'ethers';
import prisma from './prisma';
const CARTEL_CORE_ADDRESS = process.env.NEXT_PUBLIC_CARTEL_CORE_ADDRESS || "0xD8E9b929b1a8c43075CDD7580a4a717C0D5530E208";
// Fix: Use Sepolia RPC by default for this testnet deployment
const RPC_URL = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || 'https://sepolia.base.org';

const CORE_ABI = [
    "event Raid(address indexed raider, address indexed target, uint256 amountStolen, bool success, uint256 fee)",
    "event HighStakesRaid(address indexed attacker, address indexed target, uint256 stolenShares, uint256 selfPenaltyShares, uint256 feePaid)",
    "event RetiredFromCartel(address indexed user, uint256 indexed season, uint256 burnedShares, uint256 payout)",
    "event Join(address indexed player, address indexed referrer, uint256 shares, uint256 fee)",
    "event Claim(address indexed user, uint256 amount)"
];

export async function indexEvents() {
    if (!CARTEL_CORE_ADDRESS) {
        console.log("Skipping indexing: No Cartel Core Address");
        return;
    }

    // Usable Provider
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    // Explicitly set network to ensure we don't accidentally fallback
    // provider._detectNetwork(); // Ethers v6 auto-detects

    const contract = new ethers.Contract(CARTEL_CORE_ADDRESS, CORE_ABI, provider);

    // 1. Get Range
    const lastEvent = await prisma.cartelEvent.findFirst({
        orderBy: { blockNumber: 'desc' }
    });

    const currentBlock = await provider.getBlockNumber();
    console.log(`[Indexer] Current Chain Block: ${currentBlock}`);

    let startBlock = lastEvent ? lastEvent.blockNumber + 1 : currentBlock - 2000;

    // Safety: If DB is empty or weird, don't start at 0 if chai is huge.
    // Base Sepolia is ~19M. If startBlock is small, it takes forever.
    // We only care about Recent History for this Demo.
    if (startBlock < currentBlock - 10000) {
        console.log(`[Indexer] DB is too far behind (Block ${startBlock}). Fast-forwarding to tip - 2000.`);
        startBlock = currentBlock - 2000;
    }

    const endBlock = Math.min(currentBlock, startBlock + 2000);

    if (startBlock > endBlock) {
        console.log("[Indexer] Up to date.");
        return;
    }

    console.log(`[Indexer] Indexing blocks ${startBlock} to ${endBlock}...`);

    // 2. Query All Events
    const [raidLogs, highStakesLogs, joinLogs, claimLogs] = await Promise.all([
        contract.queryFilter(contract.filters.Raid(), startBlock, endBlock),
        contract.queryFilter(contract.filters.HighStakesRaid(), startBlock, endBlock),
        // contract.queryFilter(contract.filters.RetiredFromCartel(), startBlock, endBlock), // TODO: Implement Retire logic
        contract.queryFilter(contract.filters.Join(), startBlock, endBlock),
        contract.queryFilter(contract.filters.Claim(), startBlock, endBlock)
    ]);

    // Initialize processing queue
    const eventsToProcess: any[] = [];

    // --- RECOVERY BACKFILL FOR CLAIMS ---
    // Because we missed Claims due to wrong event name, we force a deep scan for Claims
    // only, over the last 500,000 blocks (~12 days), regardless of where the indexer is.
    // This ensures we catch up missing claims even if we have recent Raids.
    const backfillStart = Math.max(0, currentBlock - 500000);
    console.log(`[Indexer] Backfilling Claims from ${backfillStart} to ${currentBlock}...`);

    // Chunked fetching to avoid RPC limits
    const CHUNK_SIZE = 20000;
    const missedClaims: any[] = [];
    const backfillErrors: string[] = [];

    for (let start = backfillStart; start < currentBlock; start += CHUNK_SIZE) {
        const end = Math.min(start + CHUNK_SIZE - 1, currentBlock);
        console.log(`[Indexer] Backfill Chunk: ${start} -> ${end}`);
        try {
            const chunkLogs = await contract.queryFilter(contract.filters.Claim(), start, end);
            missedClaims.push(...chunkLogs);
        } catch (err) {
            const msg = `[Indexer] Failed to fetch chunk ${start}-${end}: ${err}`;
            console.error(msg);
            backfillErrors.push(msg);
        }
    }

    // Merge into processing list (Duplicates are handled by DB unique constraints/upsert)
    // We just push them to eventsToProcess.
    for (const log of missedClaims) {
        // Same parsing logic as main loop
        if ('args' in log) {
            const block = await log.getBlock();
            eventsToProcess.push({
                type: 'CLAIM',
                txHash: log.transactionHash,
                blockNumber: log.blockNumber,
                timestamp: new Date(block.timestamp * 1000),
                attacker: log.args[0], // User
                fee: Number(log.args[1]), // Amount (safeNumber logic inline)
                isBackfill: true
            });
        }
    }
    // --- END BACKFILL ---



    // TRANSFORM LOGS
    const safeNumber = (n: any) => {
        if (n === null || n === undefined) return 0;
        return Number(n);
    };

    // V2: Raw Topic Scan (Since ABI fails)
    const RAID_REQ_SIG = "0x76421cb080d40e8a03ba462b500012451ba59bdebc46694dc458807c1d754b62";
    const TRANSFER_SINGLE_SIG = "0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62";
    const HIGH_STAKES_HEX = "354a6ba7a18000"; // 0.015 ETH/USDC

    const v2ReqLogs = await provider.getLogs({
        address: CARTEL_CORE_ADDRESS,
        topics: [RAID_REQ_SIG],
        fromBlock: startBlock,
        toBlock: endBlock
    });

    console.log(`[Indexer] Found ${v2ReqLogs.length} V2 Raid Requests.`);

    for (const log of v2ReqLogs) {
        try {
            const receipt = await provider.getTransactionReceipt(log.transactionHash);
            if (!receipt) continue;

            // Fix: Use Topic 2 (Index 1 of args, but Topic 2 in log) for Raider if available
            // RaidRequests(requestId, raider, isHighStakes) -> Topic 0=Sig, Topic 1=reqId, Topic 2=raider
            let raider = receipt.from;
            if (log.topics && log.topics[2]) {
                try {
                    raider = ethers.getAddress(ethers.dataSlice(log.topics[2], 12));
                } catch (e) { console.error(`[Indexer] Failed to decode topic 2 raider for ${log.transactionHash}`, e); }
            }

            let isHighStakes = false;
            let stolen = 0;
            let penalty = 0;
            let target = ethers.ZeroAddress;

            // 1. Check for High Stakes Fee
            for (const l of receipt.logs) {
                if (l.data && l.data.includes(HIGH_STAKES_HEX)) {
                    isHighStakes = true;
                }
                // 2. Check for Outcome in TransferSingle
                if (l.topics[0] === TRANSFER_SINGLE_SIG) {
                    try {
                        const from = ethers.getAddress(ethers.dataSlice(l.topics[2], 12));
                        const to = ethers.getAddress(ethers.dataSlice(l.topics[3], 12));
                        const decoded = ethers.AbiCoder.defaultAbiCoder().decode(["uint256", "uint256"], l.data);
                        const val = Number(decoded[1]);

                        if (to === ethers.getAddress(raider)) {
                            stolen += val;
                            target = from; // Found the target!
                        }
                        if (from === ethers.getAddress(raider) && to === ethers.ZeroAddress) {
                            penalty += val;
                        }
                    } catch (e) { /* ignore */ }
                }
            }

            eventsToProcess.push({
                type: isHighStakes ? 'HIGH_STAKES_RAID' : 'RAID',
                txHash: log.transactionHash,
                blockNumber: log.blockNumber,
                timestamp: new Date((await provider.getBlock(log.blockNumber))!.timestamp * 1000),
                attacker: raider,
                target: target !== ethers.ZeroAddress ? target : "0x0000000000000000000000000000000000000000",
                stolenShares: stolen,
                penalty: penalty,
                fee: isHighStakes ? 0.015 : 0.005 // Approx based on type
            });

        } catch (err) {
            console.error(`[Indexer] Error parsing V2 Log ${log.transactionHash}:`, err);
        }
    }

    for (const log of joinLogs) {
        if ('args' in log) {
            const block = await log.getBlock();
            // args: [player, referrer, shares, fee]
            eventsToProcess.push({
                type: 'JOIN',
                txHash: log.transactionHash,
                blockNumber: log.blockNumber,
                timestamp: new Date(block.timestamp * 1000),
                attacker: log.args[0], // Player
                target: log.args[1],   // Referrer
                stolenShares: safeNumber(log.args[2]), // Initial Shares
                fee: safeNumber(log.args[3])
            });
        }
    }

    for (const log of claimLogs) {
        if ('args' in log) {
            const block = await log.getBlock();
            eventsToProcess.push({
                type: 'CLAIM',
                txHash: log.transactionHash,
                blockNumber: log.blockNumber,
                timestamp: new Date(block.timestamp * 1000),
                attacker: log.args[0], // User
                fee: safeNumber(log.args[1]) // Actually 'amount'
            });
        }
        // 2b. Fetch Pending/Failed Events from DB (Retry Logic)
        // If the indexer crashed after inserting CartelEvent but before QuestEvent,
        // they remain 'processed: false'. The block range above might skip them.
        const pendingDbEvents = await prisma.cartelEvent.findMany({
            where: { processed: false },
            take: 50 // Retry max 50 at a time to avoid huge batches
        });

        for (const dbEvent of pendingDbEvents) {
            // Adapt DB shape to Event shape
            // Avoid duplicates if RPC also picked it up (txHash check handles this later)
            if (!eventsToProcess.find(e => e.txHash === dbEvent.txHash)) {
                eventsToProcess.push({
                    type: dbEvent.type,
                    txHash: dbEvent.txHash,
                    blockNumber: dbEvent.blockNumber,
                    timestamp: dbEvent.timestamp,
                    attacker: dbEvent.attacker,
                    target: dbEvent.target,
                    stolenShares: Number(dbEvent.stolenShares), // Ensure number
                    penalty: dbEvent.selfPenaltyShares ? Number(dbEvent.selfPenaltyShares) : 0,
                    fee: dbEvent.feePaid // Map feePaid -> fee
                });
            }
        }

        const failedEvents: any[] = [];

        // 3. Process Batch
        await processEventBatch(eventsToProcess, failedEvents);

        console.log(`[Indexer] Processed ${eventsToProcess.length} events.`);

        return {
            processed: eventsToProcess.length,
            backfillFound: missedClaims.length,
            backfillErrors: backfillErrors.length > 0 ? backfillErrors : null,
            processingErrors: failedEvents.length > 0 ? failedEvents : null,
            recentEvents: {
                raid: raidLogs.length,
                highStakes: highStakesLogs.length,
                join: joinLogs.length,
                claim: claimLogs.length
            }
        };
    }

    async function processEventBatch(events: any[], failedEvents: any[]) {
        for (const event of events) {

            try {
                // Idempotency: We used to skip, but now we allow re-processing to fix data (e.g. fees)
                const exists = await prisma.cartelEvent.findUnique({ where: { txHash: event.txHash } });

                // HEALING LOGIC: If event exists but QuestEvent is missing for RAIDs, we proceed.
                // If completely processed and synced, we skip.
                if (exists && exists.processed) {
                    // Check if QuestEvent is missing (V2 Migration/Backfill issue)
                    if (event.type === 'RAID' || event.type === 'HIGH_STAKES_RAID') {
                        const qe = await prisma.questEvent.findFirst({
                            where: {
                                type: event.type === 'HIGH_STAKES_RAID' ? 'HIGH_STAKES' : 'RAID',
                                createdAt: event.timestamp
                            }
                        });
                        if (qe) continue; // Already has quest event, skip.
                        console.log(`[Indexer] Healing missing QuestEvent for ${event.txHash}`);
                    } else {
                        continue;
                    }
                }

                console.log(`[Indexer] Processing ${event.type}.`);
                const feeFinal = event.fee ? Number(event.fee) : 0;

                // DEBUG LOGGING REQUESTED BY USER
                console.log("INSERTING EVENT:", {
                    type: event.type,
                    feePaid: feeFinal,
                    rawArgs: event.rawArgs ? JSON.stringify(event.rawArgs, (key, value) =>
                        typeof value === 'bigint' ? value.toString() : value
                    ) : "N/A"
                });

                await prisma.$transaction(async (tx) => {
                    // A. Create Event Record (Legacy / V1)
                    await tx.cartelEvent.upsert({
                        where: { txHash: event.txHash },
                        update: {
                            feePaid: feeFinal,
                            processed: true
                        },
                        create: {
                            txHash: event.txHash,
                            blockNumber: event.blockNumber,
                            timestamp: event.timestamp,
                            type: event.type,
                            attacker: event.attacker,
                            target: event.target,
                            stolenShares: event.stolenShares,
                            selfPenaltyShares: event.penalty, // for High Stakes
                            feePaid: feeFinal, // For CLAIM this is amount
                            processed: true
                        }
                    });

                    // B. Route Logic (V1)
                    if (event.type === 'JOIN') {
                        await handleJoinEvent(tx, event);

                        // V2 QUEST EVENT: JOIN
                        // Idempotent check inside TX is hard, relying on unique constraint failure or just allow dupes (filtered by logic)
                        // But usually 1 join per person.
                        await tx.questEvent.create({
                            data: {
                                type: 'JOIN',
                                actor: event.attacker,
                                data: {
                                    referrer: event.target,
                                    shares: event.stolenShares
                                },
                                processed: false,
                                createdAt: event.timestamp
                            }
                        });

                    } else if (event.type === 'RAID' || event.type === 'HIGH_STAKES_RAID') {
                        await handleRaidEvent(tx, event);

                        // V2 QUEST EVENT: RAID
                        await tx.questEvent.create({
                            data: {
                                type: event.type === 'HIGH_STAKES_RAID' ? 'HIGH_STAKES' : 'RAID',
                                actor: event.attacker,
                                data: {
                                    target: event.target,
                                    stolen: event.stolenShares,
                                    penalty: event.penalty || 0,
                                    success: true // If log exists, it succeeded
                                },
                                processed: false,
                                createdAt: event.timestamp
                            }
                        });
                    } else if (event.type === 'CLAIM') {
                        await tx.questEvent.create({
                            data: {
                                type: 'CLAIM',
                                actor: event.attacker,
                                data: {
                                    amount: feeFinal
                                },
                                processed: false,
                                createdAt: event.timestamp
                            }
                        });
                    }
                });
            } catch (error) {
                console.error(`[Indexer] Error processing event ${event.txHash}:`, error);
            }
        }
    }

    async function handleJoinEvent(tx: any, event: any) {
        const playerAddr = event.attacker;
        const referrerAddr = event.target;
        const sharesMinted = event.stolenShares;

        console.log(`[Indexer] Processing JOIN for ${playerAddr} (Referrer: ${referrerAddr})`);

        // 1. Upsert Player (The User)
        const user = await tx.user.upsert({
            where: { walletAddress: playerAddr },
            update: {
                shares: sharesMinted, // Authoritative Source
                lastSeenAt: event.timestamp
            },
            create: {
                walletAddress: playerAddr,
                shares: sharesMinted
            }
        });

        // 2. Handle Referral
        if (referrerAddr && referrerAddr !== ethers.ZeroAddress && referrerAddr !== playerAddr) {

            // Upsert Referrer (Ensure they exist in DB)
            // We do NOT update their shares here; the contract likely minted referral bonus to them,
            // but we would need to check their balance or wait for a Transfer event to know exactly.
            // For now, we trust the contract logic: `Join` event implies Referrer got +20.
            // Ideally we'd read their balance, but simpler to just track the relationship.

            await tx.user.upsert({
                where: { walletAddress: referrerAddr },
                update: { lastSeenAt: event.timestamp },
                create: { walletAddress: referrerAddr }
            });

            // Create Referral Record
            const existingRef = await tx.cartelReferral.findUnique({
                where: { userAddress: playerAddr }
            });

            if (!existingRef) {
                await tx.cartelReferral.create({
                    data: {
                        userAddress: playerAddr,
                        referrerAddress: referrerAddr,
                        season: 1
                    }
                });
                console.log(`[Indexer] Linked ${playerAddr} -> ${referrerAddr}`);

                // V2 QUEST EVENT: REFER (Triggered for the Referrer)
                // Note: We create a separate event for the Referrer to count towards "Refer a friend" quest
                await tx.questEvent.create({
                    data: {
                        type: 'REFER',
                        actor: referrerAddr,
                        data: {
                            referee: playerAddr,
                            season: 1
                        },
                        processed: false,
                        createdAt: event.timestamp
                    }
                });
            }
        }

        // 3. INVITE GENERATION -> MOVED TO LAZY API (V5)
        // We no longer generate invites here.
        // They are generated synchronously on-demand when the user visits the referral UI.
    }

    async function handleRaidEvent(tx: any, event: any) {
        const { attacker, target } = event;

        // Self-Healing: Fetch actual on-chain balance to ensure DB is in sync
        // This fixes "frozen" or "desynced" leaderboards by forcing truth from source.
        try {
            const provider = new ethers.JsonRpcProvider(RPC_URL);
            // We know Shares contract address is needed. 
            // We can get it from Core or Env. 
            // For now, let's look it up or assuming shares contract is known.
            // Actually, CartelCore has a publicly readable `sharesContract()` function.

            const core = new ethers.Contract(CARTEL_CORE_ADDRESS, [
                "function sharesContract() view returns (address)",
                "function balanceOf(address account, uint256 id) view returns (uint256)" // ERC1155 on shares
            ], provider);

            const sharesAddr = await core.sharesContract();
            const sharesMinter = new ethers.Contract(sharesAddr, [
                "function balanceOf(address account, uint256 id) view returns (uint256)"
            ], provider);

            // Update Attacker
            if (attacker) {
                const actualBal = await sharesMinter.balanceOf(attacker, 1); // ID 1 is the main share
                await tx.user.upsert({
                    where: { walletAddress: attacker },
                    update: { shares: Number(actualBal) },
                    create: { walletAddress: attacker, shares: Number(actualBal) }
                });
                console.log(`[Indexer] Synced ${attacker} shares to ${actualBal}`);
            }

            // Update Target
            if (target) {
                const actualBal = await sharesMinter.balanceOf(target, 1);
                await tx.user.upsert({
                    where: { walletAddress: target },
                    update: { shares: Number(actualBal) },
                    create: { walletAddress: target, shares: Number(actualBal) }
                });
                console.log(`[Indexer] Synced ${target} shares to ${actualBal}`);
            }

        } catch (e) {
            console.error("Failed to sync on-chain balance, falling back to increment:", e);
            // FALLBACK: Old Logic
            const { stolenShares, penalty } = event;
            const totalChange = stolenShares - (penalty || 0);

            if (attacker) {
                await tx.user.upsert({
                    where: { walletAddress: attacker },
                    update: { shares: { increment: totalChange } },
                    create: { walletAddress: attacker, shares: Math.max(0, totalChange) }
                });
            }
            if (target) {
                const tUser = await tx.user.findUnique({ where: { walletAddress: target } });
                if (tUser) {
                    const newBal = Math.max(0, (tUser.shares || 0) - stolenShares);
                    await tx.user.update({
                        where: { walletAddress: target },
                        data: { shares: newBal }
                    });
                }
            }
        }
    }
}

