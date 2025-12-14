import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ethers } from 'ethers';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

const CARTEL_SHARES_ADDRESS = process.env.NEXT_PUBLIC_CARTEL_SHARES_ADDRESS || "";

// Fallback chain: Env Var -> Next Public Env Var -> Reliable Public Node -> Base Sepolia Official
const RPC_URL = process.env.BASE_RPC_URL ||
    process.env.NEXT_PUBLIC_RPC_URL ||
    'https://base-sepolia-rpc.publicnode.com';



const ABI = [
    "function balanceOf(address account, uint256 id) view returns (uint256)"
];

const SHARES_ID = 1;

export async function GET(request: Request) {
    const trace: string[] = [];
    const log = (msg: string) => {
        console.log(`[InvitesV5] ${msg}`);
        trace.push(msg);
    };

    try {
        log("Handler Started");
        const { searchParams } = new URL(request.url);

        // --- PING MODE ---
        if (searchParams.get('ping') === 'true') {
            log("Ping Mode Activated");
            const checkDb = searchParams.get('checkDb') === 'true';
            let dbStatus = 'skipped';
            let dbError = null;

            if (checkDb) {
                log("Testing DB Connection...");
                try {
                    await prisma.$queryRaw`SELECT 1`;
                    log("DB Connection Success");
                    dbStatus = 'connected';
                } catch (e) {
                    log(`DB Connection Failed: ${e}`);
                    dbStatus = 'failed';
                    dbError = String(e);
                }
            }

            return NextResponse.json({
                status: 'alive',
                hasHelper: !!CARTEL_SHARES_ADDRESS,
                rpc: RPC_URL,
                dbStatus,
                dbError,
                trace
            });
        }

        const walletAddress = searchParams.get('walletAddress');
        if (!walletAddress) {
            return NextResponse.json({ error: 'Wallet address required', trace }, { status: 400 });
        }

        // --- STEP 1: DB CHECK ---
        log(`Checking DB for user: ${walletAddress}`);

        let user: any = null;
        try {
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("DB_TIMEOUT_5S")), 5000)
            );

            const dbUserPromise = prisma.user.findUnique({
                where: { walletAddress },
                include: { invites: { orderBy: { createdAt: 'desc' } } }
            });

            user = await Promise.race([dbUserPromise, timeoutPromise]);
            log(user ? "User Found in DB" : "User Not Found in DB");
        } catch (dbErr) {
            log(`DB Error: ${dbErr}`);
            throw dbErr; // Re-throw to main catch
        }

        // 2. If invites exist, return them IMMEDIATELY (Idempotent)
        if (user && user.invites.length > 0) {
            log(`Returning ${user.invites.length} existing invites`);
            return NextResponse.json({
                invites: user.invites.map((invite: any) => ({
                    code: invite.code,
                    status: invite.status,
                    type: invite.type,
                    createdAt: invite.createdAt,
                })),
                trace
            });
        }

        // --- STEP 2: CHAIN VERIFICATION ---
        log(`Verifying Shares on Chain (${RPC_URL})...`);
        log(`Contract: ${CARTEL_SHARES_ADDRESS}`);

        let balance = BigInt(0);
        try {
            if (!CARTEL_SHARES_ADDRESS) {
                throw new Error("Missing CARTEL_SHARES_ADDRESS env var");
            }
            const provider = new ethers.JsonRpcProvider(RPC_URL);
            const contract = new ethers.Contract(CARTEL_SHARES_ADDRESS, ABI, provider);

            // Add Timeout to Chain Call
            const chainTimeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("CHAIN_TIMEOUT_5S")), 5000)
            );

            balance = await Promise.race([
                contract.balanceOf(walletAddress, SHARES_ID),
                chainTimeout
            ]) as bigint;

            log(`Balance Result: ${balance.toString()}`);
        } catch (chainError) {
            log(`Chain Verification Failed: ${chainError}`);
            return NextResponse.json({
                error: "Unable to verify membership on-chain",
                details: String(chainError),
                rpcUsed: RPC_URL,
                trace
            }, { status: 503 });
        }

        if (balance === BigInt(0)) {
            log("Balance is 0 - Access Denied");
            return NextResponse.json({ error: "User is not a joined member", trace }, { status: 403 });
        }

        // --- STEP 3: GENERATE INVITES ---
        log("Generating New Invites...");

        // Upsert User
        // Fix: Removed 'active' field as it does not exist in the schema.
        // Using 'lastSeenAt' instead to mark activity.
        const dbUser = await prisma.user.upsert({
            where: { walletAddress },
            update: { lastSeenAt: new Date() },
            create: {
                walletAddress,
                shares: 100, // Default shares for new user (will be synced later)
                lastSeenAt: new Date()
            }
        });

        const newInvitesData = Array.from({ length: 3 }).map(() => ({
            code: 'BASE-' + uuidv4().substring(0, 6).toUpperCase(),
            creatorId: dbUser.id,
            type: 'user',
            maxUses: 1,
            status: 'unused',
            usedCount: 0
        }));

        await prisma.$transaction(
            newInvitesData.map(inv => prisma.invite.create({ data: inv }))
        );

        log("Invites Created Successfully");

        return NextResponse.json({
            invites: newInvitesData.map(inv => ({
                code: inv.code,
                status: inv.status,
                type: inv.type,
                createdAt: new Date()
            })),
            trace
        });

    } catch (error) {
        log(`CRITICAL ERROR: ${error}`);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: String(error),
            trace
        }, { status: 500 });
    }
}
