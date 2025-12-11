import prisma from "./prisma";
import { v4 as uuidv4 } from "uuid";

interface SendNotificationResult {
    success: boolean;
    successfulTokens: string[];
    invalidTokens: string[];
    rateLimitedTokens: string[];
    error?: any;
}

export async function sendNotificationToFid(
    fid: string,
    title: string,
    body: string,
    targetUrl: string,
    notificationId?: string
): Promise<SendNotificationResult> {
    // 1. Get Tokens
    const tokens = await prisma.notificationToken.findMany({
        where: { fid },
    });

    if (tokens.length === 0) {
        return {
            success: false,
            successfulTokens: [],
            invalidTokens: [],
            rateLimitedTokens: [],
            error: "No tokens found for FID",
        };
    }

    // 2. Group by URL (Different clients might have different endpoints, though usually typical for warpcast)
    // But spec says "sent to webhookUrl... along with a url that the app should call".
    // Stored in `url`.
    const results: SendNotificationResult = {
        success: true,
        successfulTokens: [],
        invalidTokens: [],
        rateLimitedTokens: [],
    };

    // We group tokens by target URL to batch them
    const tokensByUrl: Record<string, string[]> = {};
    tokens.forEach((t) => {
        if (!tokensByUrl[t.url]) tokensByUrl[t.url] = [];
        tokensByUrl[t.url].push(t.token);
    });

    const finalNotificationId = notificationId || uuidv4();

    // 3. Send Requests
    for (const [url, batchTokens] of Object.entries(tokensByUrl)) {
        // API allows max 100 tokens per request
        const CHUNK_SIZE = 100;
        for (let i = 0; i < batchTokens.length; i += CHUNK_SIZE) {
            const tokenChunk = batchTokens.slice(i, i + CHUNK_SIZE);

            try {
                const payload = {
                    notificationId: finalNotificationId,
                    title,
                    body,
                    targetUrl,
                    tokens: tokenChunk,
                };

                const res = await fetch(url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                });

                const data = await res.json();

                if (res.ok) {
                    if (data.result) {
                        // Neynar style response? Or spec?
                        // Spec: successfulTokens, invalidTokens, rateLimitedTokens
                        const { successfulTokens, invalidTokens, rateLimitedTokens } = data.result || data;

                        if (successfulTokens) results.successfulTokens.push(...successfulTokens);

                        if (invalidTokens && invalidTokens.length > 0) {
                            results.invalidTokens.push(...invalidTokens);
                            // Cleanup DB
                            await prisma.notificationToken.deleteMany({
                                where: { token: { in: invalidTokens } }
                            });
                        }

                        if (rateLimitedTokens) results.rateLimitedTokens.push(...rateLimitedTokens);
                    }
                } else {
                    console.error(`Notification Error [${res.status}]:`, data);
                    results.success = false;
                }

            } catch (err) {
                console.error("Notification Network Error:", err);
                results.success = false;
                results.error = err;
            }
        }
    }

    return results;
}
