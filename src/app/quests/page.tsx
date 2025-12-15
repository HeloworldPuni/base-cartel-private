
"use client";

import AuthenticatedRoute from '@/components/AuthenticatedRoute';
import AppLayout from '@/components/AppLayout';
import { motion } from "framer-motion";
import { motionPage } from "@/components/ui/motionTokens";
import QuestBoard from '@/components/QuestBoard';

export default function QuestsPage() {
    return (
        <AuthenticatedRoute>
            <AppLayout>
                <motion.div {...motionPage}>
                    <header className="mb-6 pt-2">
                        <h1 className="text-2xl font-black heading-font text-neon-blue">QUESTS & OPS</h1>
                        <p className="text-sm text-zinc-400">Complete operations to earn Reputation and perks.</p>
                    </header>

                    {/* V2 QUEST BOARD */}
                    <QuestBoard />

                </motion.div>
            </AppLayout>
        </AuthenticatedRoute>
    );
}
