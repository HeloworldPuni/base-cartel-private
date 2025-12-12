import { NextRequest, NextResponse } from "next/server";
import { neynarClient } from "~/lib/neynar-client";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const fid = searchParams.get("fid");
    const viewerFid = searchParams.get("viewerFid"); // Optional: for context

    if (!fid) {
        return NextResponse.json({ error: "FID is required" }, { status: 400 });
    }

    try {
        // Fetch users that the target FID is following
        // limit 100 for now
        const response = await neynarClient.fetchUserFollowing({
            fid: Number(fid),
            viewerFid: viewerFid ? Number(viewerFid) : undefined,
            limit: 100,
            sortType: "desc_chron"
        });

        // Response structure from SDK usually matches API: { users: [...] }
        return NextResponse.json(response);

    } catch (e: any) {
        console.error("Farcaster Graph Error:", e);
        return NextResponse.json({ error: e.message || "Failed to fetch graph" }, { status: 500 });
    }
}
