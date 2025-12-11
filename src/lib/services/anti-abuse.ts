
import prisma from '@/lib/prisma';

interface ValidationResult {
    valid: boolean;
    reason?: string;
}

interface FraudScoreResult {
    score: number; // 0-100 (0=good, 100=bad)
    details: string[];
    action: 'PASS' | 'REVIEW' | 'REJECT';
}

export async function calculateFraudScore(userId: string, userAddress: string, ipAddress?: string): Promise<FraudScoreResult> {
    let score = 0;
    const details = [];

    // 1. Wallet Age (Mocking provider check, relying on DB createdAt for now)
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
        const hoursSinceCreation = (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60);
        if (hoursSinceCreation < 24) {
            score += 50;
            details.push(`New account (<24h): +50`);
        } else if (hoursSinceCreation < 24 * 30) {
            score += 10;
            details.push(`Young account (<30d): +10`);
        }

        // Social check
        if (!user.xHandle && !user.farcasterId) {
            score += 30;
            details.push(`No social links: +30`);
        } else {
            // Bonus for linked social
            // But if social linked very recently, maybe risky? (Skipping for now)
        }
    }

    // 2. IP / UA Clustering (Mocked - would query logs)
    if (ipAddress === '127.0.0.1') {
        // Localhost dev, ignore
    }

    // 3. Invite Rate (If evaluating an inviter)
    // Skipped here, usually check during invite logic

    // Normalize
    score = Math.min(100, score);

    let action: 'PASS' | 'REVIEW' | 'REJECT' = 'PASS';
    if (score > 60) action = 'REJECT';
    else if (score > 35) action = 'REVIEW';

    return { score, details, action };
}

export async function validateReferralInvite(referrerId: string, refereeId: string): Promise<ValidationResult> {

    // 1. One-referrer-per-wallet (Enforced by DB schema usually, but logic check here)
    // Already checked by referral service logic typically.

    // 2. Self Referral
    if (referrerId === refereeId) {
        return { valid: false, reason: "Self-referral" };
    }

    // 3. Rate Limit per Referrer (e.g. max 10 per day credited for shares)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaysRefShares = await prisma.pendingShare.count({
        where: {
            userId: referrerId,
            createdAt: { gte: today },
            reason: { contains: 'refer-' } // Rudimentary check
        }
    });

    if (todaysRefShares >= 10) {
        return { valid: false, reason: "Daily referral cap reached" };
    }

    // 4. Invitee "New-Ness" check
    // Ideally check chain tx count. For now, we trust the join flow or check DB creation time.
    // This logic is now handled by calculateFraudScore.
    // const referee = await prisma.user.findUnique({
    //     where: { id: refereeId }
    // });

    // if (!referee) return { valid: false, reason: "Referee not found" };

    // Heuristic: If referee joined > 24h ago and no activity, suspicious?
    // Or simpler: Just return valid for now, relying on cap.

    return { valid: true };
}

export async function logFraudEvent(userId: string | null, reason: string, details?: string) {
    await prisma.fraudEvent.create({
        data: {
            userId,
            reason,
            details
        }
    });
}
