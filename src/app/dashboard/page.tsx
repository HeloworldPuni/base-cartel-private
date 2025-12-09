"use client";

import { useAccount } from 'wagmi';
import AuthenticatedRoute from '@/components/AuthenticatedRoute';
import AppLayout from '@/components/AppLayout';
import CartelDashboard from '@/components/CartelDashboard';
import { motion } from "framer-motion";
import { motionPage } from "@/components/ui/motionTokens";

export default function DashboardPage() {
    const { address } = useAccount();
    return (
        <AuthenticatedRoute>
            <AppLayout>
                <motion.div {...motionPage}>
                    <CartelDashboard address={address} />
                </motion.div>
            </AppLayout>
        </AuthenticatedRoute>
    );
}
