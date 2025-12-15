
import { NextResponse } from 'next/server';
import { ClanService } from '@/lib/clan-service';

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
    try {
        // Await the params
        const { slug } = await context.params;

        if (!slug) return NextResponse.json({ error: "Slug required" }, { status: 400 });

        const clan = await ClanService.getClanBySlug(slug);
        if (!clan) return NextResponse.json({ error: "Clan not found" }, { status: 404 });

        return NextResponse.json(clan);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
