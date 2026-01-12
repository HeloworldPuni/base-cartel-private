import { createClient, Errors } from '@farcaster/quick-auth';
import { NextRequest, NextResponse } from 'next/server';

const client = createClient();

export async function GET(request: NextRequest) {
    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authorization.split(' ')[1];

    // Domain verification: Should match production domain
    const domain = process.env.NEXT_PUBLIC_URL ? new URL(process.env.NEXT_PUBLIC_URL).hostname : 'www.basecartel.in';

    try {
        const payload = await client.verifyJwt({ token, domain });

        return NextResponse.json({
            fid: payload.sub,
            authenticated: true,
            username: payload.name, // If available in payload
        });
    } catch (e) {
        if (e instanceof Errors.InvalidTokenError) {
            return NextResponse.json({ error: 'Invalid token: ' + e.message }, { status: 401 });
        }
        // Log unknown errors for debugging
        console.error("QuickAuth Verify Error:", e);
        return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
    }
}
