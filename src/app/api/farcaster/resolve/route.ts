import { NextRequest, NextResponse } from "next/server";
import { neynarClient } from "~/lib/neynar-client";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q"); // Generic query: username or fid
    const address = searchParams.get("address"); // Legacy support

    if (!query && !address) {
        return NextResponse.json({ error: "Query (q) or Address is required" }, { status: 400 });
    }

    try {
        // 1. Resolve by Address
        if (address) {
            const response = await neynarClient.fetchBulkUsersByEthOrSolAddress({
                addresses: [address],
            });
            // Normalize response: Neynar returns { [address]: [User] }
            // We want just the user object if possible, or null
            const users = response[address.toLowerCase()] || [];
            return NextResponse.json({ user: users[0] || null });
        }

        // 2. Resolve by Username or FID
        if (query) {
            // Check if query is a number (FID)
            const isFid = /^\d+$/.test(query);

            if (isFid) {
                const { users } = await neynarClient.fetchBulkUsers({ fids: [Number(query)] });
                console.log(`[Resolve] FID ${query} ->`, users?.[0]?.username);
                return NextResponse.json({ user: users[0] || null });
            } else {
                // Assume username
                console.log(`[Resolve] Looking up username: ${query}`);
                const response = await neynarClient.lookupUserByUsername({ username: query });
                console.log(`[Resolve] Neynar Response Keys:`, Object.keys(response || {}));

                // Handle SDK response variations
                // @ts-ignore
                const user = response.result?.user || response.user;

                if (!user) {
                    console.warn(`[Resolve] No user found for ${query}`);
                } else {
                    console.log(`[Resolve] Found user ${user.username}, Address Count: ${user.verified_addresses?.eth_addresses?.length}`);
                }

                return NextResponse.json({ user: user || null });
            }
        }

        return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    } catch (e: any) {
        console.error("Farcaster Resolve Error:", e);
        // Clean error handling for 404s
        if (e.response?.status === 404) {
            return NextResponse.json({ user: null });
        }
        return NextResponse.json({ error: e.message || "Failed to resolve user" }, { status: 500 });
    }
}
