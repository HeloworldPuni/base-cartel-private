
import { NextResponse } from 'next/server';
import { ClanService } from '@/lib/clan-service';
import { getAuthenticatedUser } from '@/lib/auth-helper';

export async function GET(request: Request) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const membership = await ClanService.getMyClan(user.id);
        return NextResponse.json(membership || null);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
