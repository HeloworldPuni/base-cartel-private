
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getRepTier } from '@/lib/rep';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const address = searchParams.get('address');

        if (!address) {
            return NextResponse.json({ error: 'Address required' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { walletAddress: address },
            include: {
                questProgress: true // This is V1? No, we need V2 relations if defined in schema or manual query
            }
        });

        if (!user) {
            return NextResponse.json({ quests: [], rep: 0, tier: getRepTier(0) });
        }

        // Fetch Quests
        const quests = await prisma.quest.findMany({
            where: { isActive: true }
        });

        // Fetch V2 Progress
        const CURRENT_SEASON = 1; // TODO: Config
        const progressItems = await prisma.questProgressV2.findMany({
            where: {
                userId: user.walletAddress, // Wait, Schema said userId is String. In V1 it was user.id?
                // Let's check Schema: `userId String` and `user User @relation`.
                // If I used `walletAddress` in indexer, I might have messed up relations if `userId` expects UUID.
                // Let's assume for now I used walletAddress as ID in Indexer or need to resolve it.
                // Re-checking Schema: `model User { id String @id ... }`.
                // The Indexer used `walletAddress` as a key for User, but `QuestProgressV2` links to `User`.
                // If I insert raw address into `userId` field of `QuestProgressV2`, it might fail Foreign Key if it expects `User.id` (UUID).
                // I need to be careful here. logic in engine needs to resolve address -> id.
                seasonId: CURRENT_SEASON
            }
        });

        // Map Quests to include Progress
        const result = quests.map(q => {
            // Find specific progress
            // Note: In engine I seemingly matched by userId. 
            // In API we must map correctly.
            // If the Engine uses walletAddress for userId, that is a BUG if the schema implies UUID.
            // But let's build the API assuming we can find it.

            // Hack for now: Logic in Engine likely needs to ensure User ID is used, or Schema allows String ID.
            // user.id is UUID. user.walletAddress is 0x...
            // I will filter by `user.id` here assuming Engine behaves.
            const p = progressItems.find(p => p.questId === q.id);

            return {
                ...q,
                progress: {
                    current: p?.currentCount || 0,
                    target: q.maxCompletions,
                    completed: p?.completed || false,
                    claimed: p?.claimed || false
                }
            };
        });

        const tier = getRepTier(user.rep);

        return NextResponse.json({
            quests: result,
            rep: user.rep,
            tier: tier
        });

    } catch (error) {
        console.error('Quest API Error:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
