"use client";

import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import LoadingScreen from "@/components/ui/LoadingScreen";
export default function AuthenticatedRoute({ children }: { children: React.ReactNode }) {
    const { isConnected } = useAccount();
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isMounted && !isConnected) {
            router.push('/login');
        }
    }, [isMounted, isConnected, router]);

    if (!isMounted || !isConnected) {
        return <LoadingScreen />;
    }

    return <>{children}</>;
}
