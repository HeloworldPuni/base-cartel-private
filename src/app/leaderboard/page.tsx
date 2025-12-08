"use client";

import AuthenticatedRoute from '@/components/AuthenticatedRoute';
import AppLayout from '@/components/AppLayout';
import Leaderboard from '@/components/Leaderboard';

export default function LeaderboardPage() {
    return (
        <AuthenticatedRoute>
            <AppLayout>
                <Leaderboard />
            </AppLayout>
        </AuthenticatedRoute>
    );
}
