import { NextResponse } from 'next/server';
import { indexEvents } from '@/lib/indexer-service';
import { QuestEngine } from '@/lib/quest-engine';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow 60 seconds for indexing

export async function GET(request: Request) {
    try {
        // Optional: Add Bearer token check for Cron jobs
        // const auth = request.headers.get('Authorization');
        // if (auth !== `Bearer ${process.env.CRON_SECRET}`) ...

        console.log("[Cron] Triggering Indexer...");
        const indexStats = await indexEvents();

        console.log("[Cron] Triggering Quest Engine...");
        const questStats = await QuestEngine.processPendingEvents();

        return NextResponse.json({
            success: true,
            message: "Indexing and Quest Processing complete",
            indexStats,
            questStats
        });
    } catch (error) {
        console.error("[Cron] Indexing failed:", error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}

export async function POST(request: Request) {
    return GET(request);
}
