import { NextRequest, NextResponse } from "next/server";
import { neynarClient } from "~/lib/neynar-client";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address");

    if (!address) {
        return NextResponse.json({ error: "Address is required" }, { status: 400 });
    }

    try {
        const response = await neynarClient.fetchBulkUsersByEthOrSolAddress({
            addresses: [address],
        });

        // The SDK returns a map or object structure. 
        // Docs say: { [address]: [User] } or similar list structure?
        // Let's verify return type from docs: 
        // "result": { "user": { ... } } inside the object for single address?
        // The SDK method actually returns `Record<string, User[]>`.
        // Let's assume it returns keyed by address.

        // Wait, looking at the user provided doc output:
        // const user = await client.fetchBulkUsersByEthOrSolAddress({addresses: [addr]});
        // output: { result: { user: { ... } } } -- wait, that might be raw API response.
        // The SDK usually normalizes this.

        // Let's play it safe and return the whole response first or inspect it.
        // But for a "good" project, we want a clean API.

        // If the SDK follows the shape of the raw API result shown in docs (which it might not, it wraps it), 
        // we should check the addresses.

        // Actually, `fetchBulkUsersByEthOrSolAddress` in standard Neynar Node SDK returns `Promise<{ [key: string]: User[] }>` usually.
        // Let's return the raw response for now, the frontend can parse.

        return NextResponse.json(response);

    } catch (e: any) {
        console.error("Farcaster Resolve Error:", e);
        return NextResponse.json({ error: e.message || "Failed to resolve address" }, { status: 500 });
    }
}
