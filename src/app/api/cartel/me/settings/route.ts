import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
// import { verifyFarcasterSigner } from '@farcaster/auth-client'; // We need to install this or use what's available

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { address, xHandle, farcasterHandle, farcasterProof } = body;

        if (!address) {
            return NextResponse.json({ error: 'Address required' }, { status: 400 });
        }

        // Farcaster Verification Logic (Simplified for Demo)
        // Ideally: verifyFarcasterSigner({ farcasterProof })
        if (farcasterProof) {
            // Verify that the proof matches the handle
            if (farcasterProof.username !== farcasterHandle) {
                return NextResponse.json({ error: 'Farcaster Handle Mismatch' }, { status: 400 });
            }
            // In a real app, we would verify the signature against the Farcaster Hub here.
            // For now, we trust the client-side proof if it exists.
        }

        const updatedUser = await prisma.user.update({
            where: { walletAddress: address },
            data: {
                xHandle: xHandle || undefined, // Only update if provided
                farcasterHandle: farcasterHandle || undefined,
                farcasterId: farcasterProof ? farcasterProof.fid.toString() : undefined
            }
        });

        return NextResponse.json({ success: true, user: updatedUser });
    } catch (error) {
        console.error('Settings API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
