import { NextResponse } from 'next/server';
import { runAgentScheduler } from '@/lib/agent/scheduler';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow 60 seconds for agent execution

export async function GET(request: Request) {
    try {
        // Optional: Add Bearer token check for Cron jobs if needed in production
        // const auth = request.headers.get('Authorization');

        const { searchParams } = new URL(request.url);
        const targetUser = searchParams.get('user'); // Optional: Run for specific user only

        console.log(`[Cron] Triggering Agent Scheduler${targetUser ? ` for ${targetUser}` : ''}...`);
        const results = await runAgentScheduler(targetUser || undefined);

        return NextResponse.json({
            success: true,
            message: "Agent Scheduler ran successfully",
            results
        });
    } catch (error) {
        console.error("[Cron] Agent Scheduler failed:", error);
        return NextResponse.json({
            success: false,
            error: String(error)
        }, { status: 500 });
    }
}

export async function POST(request: Request) {
    return GET(request);
}
