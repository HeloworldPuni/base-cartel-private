import { NextResponse } from 'next/server';
import { indexEvents } from '@/lib/indexer-service';

export async function POST(request: Request) {
    try {
        console.log("Manual sync triggered from client...");
        await indexEvents();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Sync error:', error);
        return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
    }
}
