import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const txHash = searchParams.get('txHash');

    if (!txHash) {
        return NextResponse.json({ error: 'Missing txHash' }, { status: 400 });
    }

    try {
        const event = await prisma.cartelEvent.findUnique({
            where: { txHash }
        });

        if (!event) {
            return NextResponse.json({ processed: false, status: 'NOT_FOUND' });
        }

        return NextResponse.json({
            processed: event.processed,
            status: event.processed ? 'COMPLETED' : 'PENDING_PROCESSING',
            type: event.type
        });

    } catch (error) {
        console.error("Status check failed:", error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
