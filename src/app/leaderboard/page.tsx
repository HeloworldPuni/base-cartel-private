"use client";

import AuthenticatedRoute from '@/components/AuthenticatedRoute';
import AppLayout from '@/components/AppLayout';
import Leaderboard from '@/components/Leaderboard';
import { motion } from "framer-motion";
import { motionPage } from "@/components/ui/motionTokens";

export default function LeaderboardPage() {
    return (
        <AuthenticatedRoute>
            <AppLayout>
                <motion.div {...motionPage}>
                    <Leaderboard />
                </motion.div>
            </AppLayout>
        </AuthenticatedRoute>
    );
}
