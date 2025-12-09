"use client";

import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { isGodModeEnabled } from '@/lib/dev-mode-client';

export default function AuthenticatedRoute({ children }: { children: React.ReactNode }) {
    const { isConnected, address } = useAccount();
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        // Wait a bit for wagmi to initialize
        // Also check for God Mode in localStorage
        const timer = setTimeout(() => {
            const godMode = isGodModeEnabled();
            if (!isConnected && !godMode) {
                router.push('/login');
            }
            setIsChecking(false);
        }, 1000); // 1s grace period for connection check

        return () => clearTimeout(timer);
    }, [isConnected, router]);

    if (isChecking) {
        return <LoadingScreen />;
    }

    // Double check render logic to avoid flicker
    if (!isConnected && !isGodModeEnabled()) {
        return null; // Will redirect
    }

    return <>{children}</>;
}
