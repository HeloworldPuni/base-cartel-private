import { NextResponse } from 'next/server';
import { getMostWanted } from '@/lib/threat-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '10');
        const windowHours = parseInt(searchParams.get('window') || '24');

        const mostWanted = await getMostWanted(limit, windowHours);

        return NextResponse.json({
            success: true,
            data: mostWanted
        });
    } catch (error) {
        console.error('[/api/cartel/most-wanted] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch most wanted list' },
            { status: 500 }
        );
    }
}
