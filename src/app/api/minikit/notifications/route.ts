
import { NextRequest, NextResponse } from 'next/server';

const FARCASTER_API_URL = 'https://api.farcaster.xyz';

interface NotificationRequest {
    title: string;
    body: string;
    targetFid?: string;
    actionUrl?: string;
}

export async function POST(request: NextRequest) {
    try {
        const { title, body, targetFid, actionUrl }: NotificationRequest = await request.json();

        // Validate request
        if (!title || !body) {
            return NextResponse.json(
                { error: 'Title and body are required' },
                { status: 400 }
            );
        }

        if (title.length > 100 || body.length > 500) {
            return NextResponse.json(
                { error: 'Title or body too long' },
                { status: 400 }
            );
        }

        // TODO: Rate limiting logic

        if (!process.env.FARCASTER_API_KEY) {
            console.warn("Missing FARCASTER_API_KEY, skipping actual send.");
            return NextResponse.json({ success: true, mocked: true });
        }

        // Forward to Farcaster notification API
        const response = await fetch(`${FARCASTER_API_URL}/notifications`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.FARCASTER_API_KEY}`,
            },
            body: JSON.stringify({
                title,
                body,
                targetFid,
                actionUrl: actionUrl || process.env.NEXT_PUBLIC_APP_URL,
                appId: process.env.MINI_APP_ID,
            }),
        });

        if (!response.ok) {
            // throw new Error(`Notification API error: ${response.status}`);
            // Return mocked success for now if API key is invalid/missing to prevent app crashes
            console.error(`Notification API error: ${response.status} ${await response.text()}`);
            return NextResponse.json({ success: false, error: "Upstream API Error" }, { status: 500 });
        }

        const result = await response.json();
        return NextResponse.json(result);

    } catch (error) {
        console.error('Notification error:', error);
        return NextResponse.json(
            { error: 'Failed to send notification' },
            { status: 500 }
        );
    }
}
