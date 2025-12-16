import { NextResponse } from 'next/server';
import { getRandomTarget } from '@/lib/leaderboard-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const exclude = searchParams.get('exclude');

        const target = await getRandomTarget(exclude || undefined);

        if (!target) {
            return NextResponse.json({ error: 'No targets found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            target
        });
    } catch (error) {
        console.error('[/api/cartel/targets/random] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch random target' },
            { status: 500 }
        );
    }
}
