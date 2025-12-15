
import { NextResponse } from 'next/server';
import { ClanService } from '@/lib/clan-service';
import { getAuthenticatedUser } from '@/lib/auth-helper';

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Note: slug is in params but leaveClan only needs userId strictly speaking.
        // However, standard REST might imply leaving THIS clan.
        // Service just says leaveClan(userId).
        // validation: could check if user is actually in this clan if we wanted strictly.
        // For V1, ClanService.leaveClan checks if user is in *any* clan and leaves it.
        // This is safe enough given 1 user = 1 clan constraint.

        await ClanService.leaveClan(user.id);
        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
