
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || 'PENDING';

        const pending = await prisma.pendingShare.findMany({
            where: { status: status as any },
            include: { user: true },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        return NextResponse.json({ items: pending });
    } catch (e) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, action } = body; // action: APPROVE | REJECT

        if (action === 'APPROVE') {
            await prisma.pendingShare.update({
                where: { id },
                data: { status: 'APPROVED' } // Ready for minting script to pick up
            });
        } else if (action === 'REJECT') {
            await prisma.pendingShare.update({
                where: { id },
                data: { status: 'REJECTED', reason: 'Manual rejection' }
            });
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
