"use client";

import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import LoadingScreen from "@/components/ui/LoadingScreen";
export default function AuthenticatedRoute({ children }: { children: React.ReactNode }) {
    const { isConnected } = useAccount();
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        // Wait a bit for wagmi to initialize
        const timer = setTimeout(() => {
            // MOCK MODE: Bypass Redirect - RESTORED
            if (!isConnected) {
                router.push('/login');
            }
            setIsChecking(false);
        }, 1000); // 1s grace period for connection check

        return () => clearTimeout(timer);
    }, [isConnected, router]);

    if (isChecking) {
        return <LoadingScreen />;
    }

    // MOCK MODE: Commented out guard - RESTORED
    if (!isConnected) {
        // router.push('/login'); // We can let the component return null and useEffect redirect potentially, or just return null if we want to be strict.
        // Actually line 16 was commented out inside useEffect too.
        // Let's look at lines 15-18.
        return null; // Will redirect
    }

    return <>{children}</>;
}
