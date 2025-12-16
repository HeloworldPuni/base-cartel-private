import { NextResponse } from "next/server";
import { ethers } from "ethers";
import prisma from "@/lib/prisma";
import { ClanService } from "@/lib/clan-service";
import { neynarService } from "@/lib/neynar-service";
import CartelCoreABI from "@/lib/abi/CartelCore.json";
import { getAuthenticatedUser } from "@/lib/auth-helper";

const CARTEL_CORE_ADDRESS = process.env.NEXT_PUBLIC_CARTEL_CORE_ADDRESS!;
const RPC_URL = process.env.BASE_RPC_URL || "https://sepolia.base.org";
const EXPECTED_CHAIN_ID = 84532; // Base Sepolia Testnet

export async function POST(request: Request) {
    try {
        /* ===============================
           1. AUTHENTICATION (MANDATORY)
        =============================== */
        const sessionUser = await getAuthenticatedUser(request);
        if (!sessionUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { txHash } = await request.json();

        if (!txHash || !ethers.isHexString(txHash)) {
            return NextResponse.json(
                { error: "Invalid or missing txHash" },
                { status: 400 }
            );
        }

        /* ===============================
           2. LOAD USER (UUID SOURCE)
        =============================== */
        const user = await prisma.user.findUnique({
            where: { id: sessionUser.id },
            include: { clanMembers: { include: { clan: true } } }, // Updated to match schema relation name: clanMembers
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check if user is in any clan by checking length of clanMembers array
        if (!user.clanMembers || user.clanMembers.length === 0) {
            return NextResponse.json(
                { error: "User is not in a clan" },
                { status: 409 }
            );
        }

        /* ===============================
           3. CHAIN VERIFICATION
        =============================== */
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const network = await provider.getNetwork();

        if (Number(network.chainId) !== EXPECTED_CHAIN_ID) {
            return NextResponse.json(
                { error: "Invalid network configuration on server" },
                { status: 500 }
            );
        }

        const receipt = await provider.getTransactionReceipt(txHash);
        if (!receipt || receipt.status !== 1) {
            return NextResponse.json(
                { error: "Transaction failed or not confirmed" },
                { status: 400 }
            );
        }

        if (!receipt.to || receipt.to.toLowerCase() !== CARTEL_CORE_ADDRESS.toLowerCase()) {
            return NextResponse.json(
                { error: "Transaction not sent to CartelCore" },
                { status: 403 }
            );
        }

        if (receipt.from.toLowerCase() !== user.walletAddress.toLowerCase()) {
            return NextResponse.json(
                { error: "Transaction signer mismatch" },
                { status: 403 }
            );
        }

        /* ===============================
           4. PARSE BETRAYAL EVENT
        =============================== */
        const iface = new ethers.Interface(CartelCoreABI);
        let payout: bigint | null = null;

        for (const log of receipt.logs) {
            try {
                const parsed = iface.parseLog({
                    topics: log.topics as string[],
                    data: log.data
                });
                if (parsed?.name === "Betrayal") {
                    payout = parsed.args[1]; // uint256 amount (index 1 based on ABI)
                    break;
                }
            } catch {
                /* ignore non-matching logs */
            }
        }

        if (payout === null) {
            // Fallback or Error? 
            // If tx succeeded but no event, it might be a logic error on contract or wrong ABI.
            // For debugging, we might be lenient if we trust the function call provided in receipt.
            // But strict audit requires event.
            // Let's check constructor/events again. 
            // ABI: event Betrayal(address indexed traitor, uint256 amountStolen)
            // Correct.
            return NextResponse.json(
                { error: "Betrayal event not found in transaction" },
                { status: 400 }
            );
        }

        /* ===============================
           5. DB CLEANUP (IDEMPOTENT)
        =============================== */
        try {
            await ClanService.betrayClan(user.id);
        } catch (e: any) {
            // Owner guard or other hard failure
            if (e.message?.includes("Owner")) {
                return NextResponse.json({ error: e.message }, { status: 403 });
            }
            // If already processed, we allow idempotent success
            console.warn("Betray cleanup warning:", e.message);
        }

        /* ===============================
           6. SOCIAL (NON-BLOCKING)
        =============================== */
        try {
            await neynarService.postBetrayalEvent(
                user.walletAddress,
                Number(payout) // Convert bigint to number for service
            );
        } catch (err) {
            console.error("Social post failed:", err);
        }

        /* ===============================
           7. FINAL RESPONSE
        =============================== */
        return NextResponse.json({
            success: true,
            payout: payout.toString(),
            message: "Betrayal finalized",
        });

    } catch (err) {
        console.error("[/api/pay/betray] Fatal error:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
