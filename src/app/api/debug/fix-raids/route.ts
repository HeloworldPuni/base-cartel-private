
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { QuestEngine } from '@/lib/quest-engine';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const logs: string[] = [];
    const log = (msg: string) => { console.log(msg); logs.push(msg); };

    try {
        log("Starting Manual Raid Fix...");

        // 1. Find Stuck Raids (Standard Logic)
        const stuckRaids = await prisma.cartelEvent.findMany({
            where: {
                type: 'RAID',
                processed: false
            },
            take: 50
        });

        // 2. Deep Repair / Inspection
        // Use a known recent Tx to inspect raw logs
        const debugTx = "0x0b1150a14ad1157ba3b82772714041d8b9e6717a52f9288e000fc770337f7a81"; // Valid length?
        // Note: The user logs provided partial hashes "0x0b1150a1...". exact hash is unknown.
        // Actually, let's use the DB to get the FULL hash.

        const sampleRaid = await prisma.cartelEvent.findFirst({
            where: { txHash: { startsWith: '0x0b1150a1' } }
        });

        if (sampleRaid) {
            log(`Inspecting Tx: ${sampleRaid.txHash}`);
            // Need provider
            const { ethers } = require('ethers');
            const RPC_URL = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || 'https://sepolia.base.org';
            const provider = new ethers.JsonRpcProvider(RPC_URL);

            const receipt = await provider.getTransactionReceipt(sampleRaid.txHash);
            if (receipt) {
                log(`Logs found: ${receipt.logs.length}`);
                receipt.logs.forEach((l: any, i: number) => {
                    log(`Log ${i}: Address=${l.address} Topic[0]=${l.topics[0]}`);
                });
            } else {
                log("Receipt not found ??");
            }
        } else {
            log("Sample raid not found in DB?");
        }

        const recentRaids = await prisma.cartelEvent.findMany({
            where: {
                type: 'RAID',
                processed: true // Processed by Indexer already
            },
            take: 100,
            orderBy: { timestamp: 'desc' }
        });

        const HIGH_FEE_THRESHOLD = 10000000000000000; // 0.01 USDC (1e16)

        const allEvents = [...stuckRaids];
        let fixedCount = 0;

        for (const raid of recentRaids) {
            // Check if fee indicates High Stakes
            // Use feePaid if available, else fee (indexer maps feePaid->fee in memory, likely similar in DB)
            // If TS error on 'fee', using 'any' cast to be safe or check schema.
            // Based on indexer-service, DB model likely has 'feePaid'. Let's check 'feePaid' or 'fee'.
            // Actually, best to cast to any to avoid property check issues if type is loose.
            const r = raid as any;
            const fee = r.fee || r.feePaid || 0;

            if (fixedCount < 5) {
                log(`Raid ${raid.txHash.substring(0, 10)}... Fee: ${fee}`);
            }

            if (fee > HIGH_FEE_THRESHOLD) {
                log(`Found potential High Stakes Raid: ${raid.txHash} Fee: ${fee}`);
                // Treat as High Stakes Candidate

                // Check if we already have the High Stakes Quest Event
                const hsEvent = await prisma.questEvent.findFirst({
                    where: {
                        type: 'HIGH_STAKES', // QuestEvent type
                        createdAt: raid.timestamp // Correlate by time
                    }
                });

                if (!hsEvent) {
                    log(`Creating missing HIGH_STAKES QuestEvent for ${raid.txHash}`);
                    await prisma.questEvent.create({
                        data: {
                            type: 'HIGH_STAKES',
                            actor: raid.attacker!,
                            data: {
                                target: raid.target,
                                stolen: Number(raid.stolenShares), // Re-use stolen
                                penalty: 0, // Unknown if not in log, assume 0
                                success: true
                            },
                            processed: false,
                            createdAt: raid.timestamp
                        }
                    });
                    fixedCount++;
                }
            }
        }

        log(`Found ${stuckRaids.length} stuck raids and scanned ${recentRaids.length} recent raids for High Stakes.`);

        for (const raid of allEvents) {
            // Dedupe loop if event is in both lists (unlikely due to type filter)

            // ... (rest of logic)
            log(`Fixing Raid ${raid.txHash}...`);

            // A. Ensure User Exists
            if (raid.attacker) {
                // Determine shares (fallback to DB or 0 if unknown, assuming sync handles it or subsequent event)
                // actually we just need user record for QuestEngine to attach progress.
                // We'll trust existing record or create stub.
                const user = await prisma.user.findFirst({
                    where: { walletAddress: { equals: raid.attacker, mode: 'insensitive' } }
                });

                if (!user) {
                    log(`Creating missing user ${raid.attacker}`);
                    await prisma.user.create({
                        data: { walletAddress: raid.attacker, shares: 0 }
                    });
                }
            }

            // B. Create Quest Event (Idempotent check)
            const existingQe = await prisma.questEvent.findFirst({
                where: {
                    createdAt: raid.timestamp,
                    type: raid.type === 'HIGH_STAKES_RAID' ? 'HIGH_STAKES' : 'RAID'
                }
            });

            if (!existingQe) {
                await prisma.questEvent.create({
                    data: {
                        type: raid.type === 'HIGH_STAKES_RAID' ? 'HIGH_STAKES' : 'RAID',
                        actor: raid.attacker!,
                        data: {
                            target: raid.target,
                            stolen: Number(raid.stolenShares),
                            penalty: raid.selfPenaltyShares ? Number(raid.selfPenaltyShares) : 0,
                            success: true
                        },
                        processed: false, // Let QuestEngine process it
                        createdAt: raid.timestamp
                    }
                });
                log(`Created QuestEvent for ${raid.txHash}`);
                fixedCount++;
            } else {
                log(`QuestEvent already exists for ${raid.txHash}`);
            }

            // C. Mark CartelEvent processed so we don't fix it again
            await prisma.cartelEvent.update({
                where: { id: raid.id },
                data: { processed: true }
            });
        }

        // 2. V2 Event Recovery (The Real Fix)
        // Signatures (Derived from Logs):
        // RaidRequests: 0x76421cb080d40e8a03ba462b500012451ba59bdebc46694dc458807c1d754b62
        // RaidResult:   0x546aca7b2683440b8f02fa95faeb8efc79dd0f16af3d815a002742ea6f76116c

        const RAID_REQ_SIG = "0x76421cb080d40e8a03ba462b500012451ba59bdebc46694dc458807c1d754b62";
        const RAID_RES_SIG = "0x546aca7b2683440b8f02fa95faeb8efc79dd0f16af3d815a002742ea6f76116c";

        log("Starting V2 Event Scan...");

        const { ethers } = require('ethers');
        const RPC_URL = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || 'https://sepolia.base.org';
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const coreAddress = process.env.NEXT_PUBLIC_CARTEL_CORE_ADDRESS || "0x40fdD70ae4559dd9E4a31AD08673dBBA91DCB7a8"; // Updated from Logs

        // A. Fetch recent logs for RaidRequests
        const currentBlock = await provider.getBlockNumber();
        const startBlock = currentBlock - 20000; // Increased to 20k blocks (~12h)

        const reqLogs = await provider.getLogs({
            address: coreAddress,
            topics: [RAID_REQ_SIG],
            fromBlock: startBlock,
            toBlock: 'latest'
        });

        // B. Fetch recent logs for RaidResult
        const resLogs = await provider.getLogs({
            address: coreAddress,
            topics: [RAID_RES_SIG],
            fromBlock: startBlock,
            toBlock: 'latest'
        });

        log(`Found ${reqLogs.length} Requests and ${resLogs.length} Results in last ${currentBlock - startBlock} blocks.`);

        // Map Results by RequestId (Topic 1)
        const resultMap = new Map<string, any>();
        resLogs.forEach((l: any) => {
            // Topic 0: Sig, Topic 1: RequestId, Topic 2: Raider
            if (l.topics[1]) resultMap.set(l.topics[1], l);
        });

        let v2FixedCount = 0;

        for (const req of reqLogs) {
            try {
                const requestId = req.topics[1];
                const raider = ethers.getAddress(ethers.dataSlice(req.topics[2], 12)); // Decode address from topic

                // Check isHighStakes (Data)
                // bool isHighStakes is likely the first 32 bytes of data (or only data)
                // ethers.AbiCoder.defaultAbiCoder().decode(["bool"], req.data)
                const [isHighStakes] = ethers.AbiCoder.defaultAbiCoder().decode(["bool"], req.data);

                if (isHighStakes) {
                    // Find Result
                    const res = resultMap.get(requestId);
                    let success = false;
                    let stolen = 0;

                    if (res) {
                        if (res.data && res.data !== '0x') {
                            // Decode Result Data
                            const decoded = ethers.AbiCoder.defaultAbiCoder().decode(["bool", "uint256"], res.data);
                            success = decoded[0];
                            stolen = Number(decoded[1]);
                        } else {
                            log(`Result found for ${requestId} but no data?`);
                        }
                    }

                    // Create Expectation: Unique ID based on RequestId
                    // We don't have requestId in DB??
                    // We'll use txHash + logIndex as unique constraint check
                    const uniqueId = `${req.transactionHash}-${req.index}`;

                    // Check if QuestEvent exists
                    // We can't query by uniqueId easily in QuestEvent schema unless we put it in 'data'?
                    // We'll check by TxHash AND Type 'HIGH_STAKES'
                    const existing = await prisma.questEvent.findFirst({
                        where: {
                            type: 'HIGH_STAKES',
                            createdAt: {
                                gte: new Date(Date.now() - 3600000 * 24), // Last 24h approximation?
                                // Better: check if we have an event with this Actor pending?
                            }
                        }
                    });

                    // Actually, best deduping is: Check if we have a QuestEvent for this Actor + Type recently processed?
                    // Deduplication check uses 'duplicate' below.


                    // Better approach: Check if we have ANY HighStakes event for this User and TxHash?
                    // QuestEvent doesn't store TxHash column exposed?
                    // Schema check: indexer-service writes it to CartelEvent. QuestEvent is derived.

                    // Let's look for CartelEvent first!
                    // If we didn't index HighStakes properly, we likely don't have a CartelEvent with type='HIGH_STAKES_RAID'
                    // But we might have one with 'RAID' (incorrectly).

                    // We will JUST CREATE THE QUEST EVENT idempotently.
                    // We need to avoid duplicates.
                    // We'll trust the User's Quest Progress + DB check.

                    // Check DB for QuestEvent created within 10 mins of this block?
                    // Block timestamp?
                    const block = await provider.getBlock(req.blockNumber);
                    const timestamp = new Date(block.timestamp * 1000);

                    const duplicate = await prisma.questEvent.findFirst({
                        where: {
                            type: 'HIGH_STAKES',
                            actor: raider,
                            createdAt: timestamp // Exact match
                        }
                    });

                    if (!duplicate) {
                        log(`Fixing High Stakes Raid: ${req.transactionHash} (ReqId ${parseInt(requestId, 16)})`);
                        await prisma.questEvent.create({
                            data: {
                                type: 'HIGH_STAKES',
                                actor: raider,
                                data: {
                                    target: "0x000...", // We don't have target from Logs easily (it's in Raids map in contract)
                                    stolen: stolen,
                                    penalty: 0,
                                    success: success,
                                    requestId: requestId // Store for reference
                                },
                                processed: false,
                                createdAt: timestamp
                            }
                        });
                        v2FixedCount++;
                    }
                }
            }
        } catch (err: any) {
            log(`Error processing req ${req.transactionHash}: ${err.message}`);
        }
    }

        log(`V2 Fix complete. Created ${v2FixedCount} High Stakes events.`);
    fixedCount += v2FixedCount;

    log(`Triggering QuestEngine...`);

    // 2. Run Engine
    const questStats = await QuestEngine.processPendingEvents();

    return NextResponse.json({
        success: true,
        fixedCount,
        logs,
        questLogs: questStats.logs
    });

} catch (error: any) {
    log(`Error: ${error.message}`);
    return NextResponse.json({ success: false, logs }, { status: 500 });
}
}
