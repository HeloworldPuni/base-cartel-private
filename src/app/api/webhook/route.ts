import { NextRequest, NextResponse } from "next/server";
import {
    parseWebhookEvent,
    verifyAppKeyWithNeynar,
} from "@farcaster/miniapp-node";
import prisma from "~/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const requestJson = await req.json();

        // Verify the event using Neynar (or provide custom otherwise)
        // Assuming NEYNAR_API_KEY is set in env
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: any = await parseWebhookEvent(requestJson, verifyAppKeyWithNeynar);

        switch (data.event) {
            case "miniapp_added":
            case "notifications_enabled": {
                if (data.notificationDetails) {
                    await prisma.notificationToken.upsert({
                        where: { token: data.notificationDetails.token },
                        create: {
                            fid: data.fid.toString(),
                            token: data.notificationDetails.token,
                            url: data.notificationDetails.url,
                        },
                        update: {
                            fid: data.fid.toString(),
                            url: data.notificationDetails.url,
                        }
                    });
                }
                break;
            }
            case "notifications_disabled": {
                // Technically we might want to check the signer, but we can't delete by token easily without parsing details?
                // disabled event doesn't typically send token.
                // We might just have to wait for "invalidTokens" response from the send API to cleanup.
                // Or if we know the FID, we can delete all? No, user might have multiple devices/tokens.
                // Spec says: "Any notification tokens for that fid and client app (based on signer requester) should be considered invalid"
                // For simplicity v1: do nothing on this event, handle invalidation on send.
                break;
            }
            case "miniapp_removed": {
                // Delete all tokens for this FID
                await prisma.notificationToken.deleteMany({
                    where: { fid: data.fid.toString() }
                });
                break;
            }
        }

        return NextResponse.json({ success: true });

    } catch (e: any) {
        console.error("Webhook Error:", e);
        // Return 200 to acknowledge receipt even if error, to prevent retries (optional logic)
        // But Farcaster expects 200 for success.

        // Check specific verify errors
        if (e.name && e.name.includes("VerifyJsonFarcasterSignature")) {
            return NextResponse.json({ error: "Invalid Signature" }, { status: 401 });
        }

        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
