
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { QuestEngine } from '@/lib/quest-engine';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const logs: string[] = [];
    const log = (msg: string) => { console.log(msg); logs.push(msg); };
    let extraReqLogs: any[] = [];

    try {
        const url = new URL(request.url);
        log(`[Corrected] Version 2.2 - Active`);
        log(`URL: ${request.url}`);

        const forceTx = url.searchParams.get('tx');
        const forceType = url.searchParams.get('forceType'); // 'HIGH_STAKES' or 'RAID'
        const debugUser = url.searchParams.get('debugUser');
        const simulateActive = url.searchParams.get('simulateActive');
        const checkCategory = url.searchParams.get('checkCategory');
        const scanUser = url.searchParams.get('scanUser');

        // Initialize Ethers & Provider
        const { ethers } = require('ethers');
        const RPC_URL = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || 'https://sepolia.base.org';
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const CORE_ADDRESS = process.env.NEXT_PUBLIC_CARTEL_CORE_ADDRESS || "0x40fdD70ae4559dd9E4a31AD08673dBBA91DCB7a8";

        // Minimal ABI for filtering
        const MINIMAL_CORE_ABI = [
            "event RaidRequests(uint256 indexed requestId, address indexed raider, bool isHighStakes)"
        ];

        // MODE: Scan History for User
        if (scanUser) {
            console.log(`Scanning history for user: ${scanUser}`);
            // Core Contract
            const core = new ethers.Contract(CORE_ADDRESS, MINIMAL_CORE_ABI, provider);


            // Filter: RaidRequests(requestId, raider, isHighStakes)
            // Topic 0: Event Signature
            // Topic 1: requestId (indexed) - null (any)
            // Topic 2: raider (indexed) - user address
            const filter = core.filters.RaidRequests(null, scanUser);

            // Fetch ALL logs for this user (limited to max range)
            const currentBlock = await provider.getBlockNumber();
            const startBlock = Math.max(0, currentBlock - 90000); // Max 100k allowed

            console.log(`Scanning from block ${startBlock} to latest`);
            const logs = await core.queryFilter(filter, startBlock, 'latest');
            console.log(`Found ${logs.length} RaidRequests events for ${scanUser}`);

            // Add to Part 2 Processing
            extraReqLogs = logs;
        }



        if (checkCategory) {
            const q = await prisma.quest.findUnique({ where: { slug: checkCategory } });
            return NextResponse.json({ success: true, quest: q });
        }


        if (simulateActive) {
            // Logic mirrored from active/route.ts
            const u = await prisma.user.findFirst({ where: { walletAddress: { equals: simulateActive, mode: 'insensitive' } } });
            if (!u) return NextResponse.json({ found: false });

            const progressItems = await prisma.questProgressV2.findMany({
                where: {
                    userId: u.id,
                    seasonId: 1
                }
            });
            return NextResponse.json({ found: true, progressItems });
        }


        if (debugUser) {
            const u = await prisma.user.findFirst({ where: { walletAddress: { equals: debugUser, mode: 'insensitive' } } });
            if (u) {
                const p = await prisma.questProgressV2.findMany({ where: { userId: u.id } });
                return NextResponse.json({ success: true, debugUser: u.walletAddress, userId: u.id, progress: p });
            }
            return NextResponse.json({ success: false, error: "User not found" });
        }


        log("Starting Manual Raid Fix...");
        if (forceTx) log(`Targeting specific Tx: ${forceTx}`);
        if (forceType) log(`Forcing Type: ${forceType}`);

        // DB stats
        const dbEvents = await prisma.questEvent.findMany({
            where: {
                type: { in: ['RAID', 'HIGH_STAKES_RAID', 'HIGH_STAKES'] },
                createdAt: { gte: new Date(Date.now() - 3600000 * 24 * 7) }
            },
            select: { id: true, type: true, data: true, processed: true }
        });
        log(`DB has ${dbEvents.length} Recent Raid Events.`);

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

        // A. Fetch recent logs for RaidRequests
        const currentBlock = await provider.getBlockNumber();
        const startBlock = currentBlock - 20000; // Increased to 20k blocks (~12h)

        const reqLogs = [
            ...(await provider.getLogs({
                address: CORE_ADDRESS,
                topics: [RAID_REQ_SIG],
                fromBlock: startBlock,
                toBlock: 'latest'
            })),
            ...(extraReqLogs || [])
        ];

        // B. Fetch recent logs for RaidResult
        const resLogs = await provider.getLogs({
            address: CORE_ADDRESS,
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

                // Deep Scan: Fetch Receipt to find Truth
                const txReceipt = await provider.getTransactionReceipt(req.transactionHash);
                if (!txReceipt) {
                    log(`Skipping Req ${requestId} - No Receipt`);
                    continue;
                }

                // 1. Identify Raider: Prefer indexed topic (true user) over tx.from (relayer)
                // Topic 2 is address (padded to 32 bytes)
                let raider = txReceipt.from;
                if (req.topics && req.topics[2]) {
                    try {
                        // Decodes 0x000...address -> 0xaddress
                        raider = ethers.getAddress('0x' + req.topics[2].slice(26));
                    } catch (e) { console.error("Error decoding topic 2 raider", e); }
                }

                // 2. Identify High Stakes: Look for the Fee Transfer in Logs
                // Fee = 0.015 * 1e18 = 15000000000000000
                // Hex = 0x354a6ba7a18000
                const HIGH_STAKES_HEX = "0x354a6ba7a18000";

                // Simple string scan of all logs to find the fee payment
                let isHighStakes = false;

                // DEBUG: Dump all logs for this Tx to see why we missed it
                if (req.transactionHash.startsWith("0x0b11")) { // Only for the debug target
                    log(`--- Debugging Log Scan for ${req.transactionHash} ---`);
                    txReceipt.logs.forEach((l: any, i: number) => {
                        log(`[${i}] Addr: ${l.address} | Topics: ${l.topics.join(',')} | Data: ${l.data}`);
                    });
                    // Check specifically for fee
                    const feeHex = HIGH_STAKES_HEX.replace('0x', '');
                    log(`Looking for Fee Hex: ${feeHex}`);
                }

                for (const l of txReceipt.logs) {
                    if (l.data && l.data.includes(HIGH_STAKES_HEX.replace('0x', ''))) {
                        isHighStakes = true;
                        break;
                    }
                }

                // FORCE OVERRIDE
                if (forceTx && req.transactionHash.toLowerCase() === forceTx.toLowerCase() && forceType) {
                    log(`Overriding Type to ${forceType} for ${forceTx}`);
                    isHighStakes = (forceType === 'HIGH_STAKES' || forceType === 'HIGH_STAKES_RAID');
                }

                log(`Req ${requestId} (Tx: ${req.transactionHash.substring(0, 10)}): Raider=${raider}, HighStakes=${isHighStakes}`);

                // 3. Identify Stolen/Penalty via TransferSingle Logs
                // TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)
                const TRANSFER_SINGLE_SIG = "0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62";

                let stolen = 0;
                let penalty = 0;
                let success = false;

                for (const l of txReceipt.logs) {
                    if (l.topics[0] === TRANSFER_SINGLE_SIG) {
                        try {
                            // Decode Data: id, value (since others are indexed)
                            // Note: ethers v6 parses logs nicely if we had interface, but we do manual
                            // Topics: [Sig, Operator, From, To]
                            const from = ethers.getAddress(ethers.dataSlice(l.topics[2], 12));
                            const to = ethers.getAddress(ethers.dataSlice(l.topics[3], 12));
                            const decoded = ethers.AbiCoder.defaultAbiCoder().decode(["uint256", "uint256"], l.data);
                            const val = Number(decoded[1]);

                            // Case A: Mint to Raider (Stolen)
                            if (to === ethers.getAddress(raider)) {
                                stolen += val;
                                success = true;
                            }
                            // Case B: Burn from Raider (Penalty) -> High Stakes Lose
                            if (from === ethers.getAddress(raider) && to === ethers.ZeroAddress) {
                                penalty += val;
                                success = false;
                            }
                        } catch (e) { /* ignore parse err */ }
                    }
                }

                log(`Raid Outcome: Success=${success}, Stolen=${stolen}, Penalty=${penalty}`);

                // Create Unique ID check
                const timestamp = new Date((await provider.getBlock(req.blockNumber))!.timestamp * 1000);
                const type = isHighStakes ? 'HIGH_STAKES' : 'RAID';

                // Upsert Logic: If exists, update it (failed/empty before?)
                const existing = await prisma.questEvent.findFirst({
                    where: {
                        type: type,
                        actor: raider,
                        createdAt: timestamp
                    }
                });

                if (existing) {
                    // Update if it looks "empty" (stolen=0, processed=true?) or just force refresh
                    log(`Updating existing ${type} event (Force Retry)...`);
                    await prisma.questEvent.update({
                        where: { id: existing.id },
                        data: {
                            data: {
                                target: "0x000...",
                                stolen: stolen,
                                penalty: penalty,
                                success: success,
                                requestId: requestId
                            },
                            processed: false // FORCE REPROCESS
                        }
                    });
                    v2FixedCount++;
                } else {
                    log(`Creating new ${type} event...`);
                    await prisma.questEvent.create({
                        data: {
                            type: type,
                            actor: raider,
                            data: {
                                target: "0x000...",
                                stolen: stolen,
                                penalty: penalty,
                                success: success,
                                requestId: requestId
                            },
                            processed: false,
                            createdAt: timestamp
                        }
                    });
                    v2FixedCount++;
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
