"use client";

import { useAccount } from 'wagmi';
import AuthenticatedRoute from '@/components/AuthenticatedRoute';
import AppLayout from '@/components/AppLayout';
import CartelDashboard from '@/components/CartelDashboard';

export default function DashboardPage() {
    const { address } = useAccount();
    return (
        <AuthenticatedRoute>
            <AppLayout>
                <CartelDashboard address={address} />
            </AppLayout>
        </AuthenticatedRoute>
    );
}
