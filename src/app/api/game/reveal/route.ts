
import { NextRequest, NextResponse } from 'next/server';
import { createWalletClient, http, publicActions, decodeEventLog } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import CartelCoreABI from '@/lib/abi/CartelCore.json';
import prisma from '@/lib/prisma';
// import { generateNewsFromEvents } from '@/lib/news-service'; // Optional: If we want instant AI news

// CONFIG
const CORE_ADDRESS = process.env.NEXT_PUBLIC_CARTEL_CORE_ADDRESS as `0x${string}`;
const PRIVATE_KEY = (process.env.PAYMENT_ADDRESS || process.env.DEPLOYER_PRIVATE_KEY) as `0x${string}`; // Admin/Relayer Key

export async function POST(req: NextRequest) {
    try {
        const { requestId, secret, salt, target } = await req.json();

        if (!requestId || !secret || !salt) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
        }

        if (!PRIVATE_KEY) {
            return NextResponse.json({ error: "Relayer not configured" }, { status: 500 });
        }

        // Setup Relayer
        const account = privateKeyToAccount(PRIVATE_KEY);
        const client = createWalletClient({
            account,
            chain: baseSepolia,
            transport: http()
        }).extend(publicActions);

        console.log(`[Relayer] Revealing Raid #${requestId}...`);

        const hash = await client.writeContract({
            address: CORE_ADDRESS,
            abi: CartelCoreABI,
            functionName: 'revealRaid',
            args: [BigInt(requestId), secret, salt]
        });

        console.log(`[Relayer] Tx Sent: ${hash}`);

        // Wait for confirmation
        const receipt = await client.waitForTransactionReceipt({ hash });

        if (receipt.status === 'success') {
            // --- PARSE LOGS & SAVE TO DB ---
            try {
                // Find "RaidResult" event
                for (const log of receipt.logs) {
                    try {
                        const decoded = decodeEventLog({
                            abi: CartelCoreABI,
                            data: log.data,
                            topics: log.topics
                        }) as any;

                        if (decoded.eventName === 'RaidResult') {
                            const { raider, success, stealed } = decoded.args;

                            // Determine if High Stakes (Need to check previous request or infer?)
                            // For MVP, assume RAID unless told otherwise. Or fetch Request log.
                            // Better: Just assume RAID.

                            // [FIX] Robust property check (match response logic)
                            const stealedVal = decoded.args.stealed || decoded.args.amount || decoded.args.stolenShares || 0n;

                            await prisma.cartelEvent.create({
                                data: {
                                    txHash: hash,
                                    blockNumber: Number(receipt.blockNumber),
                                    timestamp: new Date(),
                                    type: 'RAID', // Default to RAID. Can enhance later.
                                    attacker: raider,
                                    target: target || 'Unknown', // Use Propagated Target
                                    stolenShares: Number(stealedVal),
                                    payout: 0
                                }
                            });
                            console.log(`[Relayer] Event Saved: ${raider} won ${stealedVal}`);
                        }
                    } catch (err) {
                        // Not the event we are looking for
                    }
                }
            } catch (dbError) {
                console.error("[Relayer] Failed to save DB event:", dbError);
                // Don't fail the request, just log
            }

            // [FIX] Return outcome so UI can show result
            // We need to parse logs again if we didn't save to DB, or just use variables from loop
            // Since we parsed inside loop, let's extract it clean or re-parse.
            // Simpler: Just re-loop or hoist variable.
            let outcome = { success: false, stealed: '0' };
            try {
                for (const log of receipt.logs) {
                    try {
                        const decoded = decodeEventLog({ abi: CartelCoreABI, data: log.data, topics: log.topics }) as any;
                        // console.log("Decoded Event:", decoded.eventName, decoded.args);
                        if (decoded.eventName === 'RaidResult' || decoded.eventName === 'HighStakesResult') {
                            // Support V3 and V4 Event Names if they differ, or just RaidResult
                            // console.log("Found Result Event:", decoded.args);

                            // Check for both 'stealed' and 'profit' or other names?
                            // Based on ABI it is 'stealed'.

                            const stealedVal = decoded.args.stealed || decoded.args.amount || 0n;

                            outcome = {
                                success: decoded.args.success,
                                stealed: stealedVal.toString()
                            };
                            break;
                        }
                    } catch (e) {
                        // ignore non-decodable events
                    }
                }
            } catch (e) { }

            return NextResponse.json({ success: true, tx: hash, outcome });
        } else {
            return NextResponse.json({ error: "Transaction reverted", tx: hash }, { status: 500 });
        }

    } catch (error: any) {
        console.error("[Relayer Error]", error);
        return NextResponse.json({ error: error.message || "Relayer failed" }, { status: 500 });
    }
}
