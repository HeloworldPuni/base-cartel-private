import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    // TODO: Handle webhook events
    return NextResponse.json({ status: 'ok' });
}

export async function GET() {
    return NextResponse.json({ status: 'ok' });
}
