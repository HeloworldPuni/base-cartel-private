"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from 'wagmi';
import JoinCartel from "@/components/JoinCartel";

export default function LoginPage() {
    const router = useRouter();
    const { isConnected, address } = useAccount();

    useEffect(() => {
        if (isConnected) {
            router.push('/dashboard');
        }
    }, [isConnected, router]);

    const handleJoin = (inviteCode: string) => {
        console.log("Joined via Login Page!", inviteCode);
        if (address) {
            localStorage.setItem(`cartel_joined_${address}`, 'true');
        }
        router.push('/dashboard');
    };

    return (
        <main className="min-h-screen bg-[#0B0E12] flex items-center justify-center relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-red-500/10 rounded-full blur-[100px] delay-1000 animate-pulse" />
            </div>

            <div className="relative z-10 w-full max-w-[400px]">
                {/* 
                    The JoinCartel component handles the disconnected state by showing "Connect Wallet".
                    Once connected, the useEffect above will redirect to /dashboard.
                    We pass handleJoin just in case, though the redirect might happen first.
                */}
                <JoinCartel onJoin={handleJoin} />
            </div>
        </main>
    );
}
