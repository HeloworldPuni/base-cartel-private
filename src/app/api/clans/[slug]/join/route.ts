
import { NextResponse } from 'next/server';
import { ClanService } from '@/lib/clan-service';
import { getAuthenticatedUser } from '@/lib/auth-helper';

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { slug } = await context.params;
        if (!slug) return NextResponse.json({ error: "Slug required" }, { status: 400 });

        const membership = await ClanService.joinClan(user.id, slug);
        return NextResponse.json(membership);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
