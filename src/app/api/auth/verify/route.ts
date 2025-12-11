import { NextRequest, NextResponse } from "next/server";
import { createAppClient, viemConnector } from "@farcaster/auth-client";
import prisma from "~/lib/prisma";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
    try {
        const { message, signature, nonce } = await req.json();

        if (!message || !signature || !nonce) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Verify signature
        const appClient = createAppClient({
            ethereum: viemConnector(),
        });

        const verifyResult = await appClient.verifySignInMessage({
            message,
            signature,
            nonce,
            domain: new URL(req.url).hostname,
        });

        if (!verifyResult.isSuccess) {
            return NextResponse.json({ error: "Invalid signature", details: verifyResult.error }, { status: 401 });
        }

        const { fid } = verifyResult;

        // Create or Update User Logic
        // For now we just verify the user exists or proceed.
        // In a real app we'd upsert based on FID and link wallet if known.

        const user = await prisma.user.findUnique({
            where: { farcasterId: fid.toString() }
        });

        // Set Session Cookie
        cookies().set("session", JSON.stringify({ fid, isAuthenticated: true }), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
        });

        return NextResponse.json({ success: true, fid });

    } catch (e: any) {
        console.error("Auth Error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
