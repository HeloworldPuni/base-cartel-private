"use client";

import { useState, useEffect, useCallback } from "react";
import { X, MessageSquare, Loader2, Check } from "lucide-react";
import { useAccount } from "wagmi";
import { signIn as signInNextAuth, useSession } from "next-auth/react";
import { useSignIn, StatusAPIResponse } from "@farcaster/auth-kit";

// Custom X Logo component
const XLogo = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
    </svg>
);

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: {
        twitter?: string;
        farcaster?: string;
    };
}

export default function SettingsModal({ isOpen, onClose, initialData }: SettingsModalProps) {
    const { address } = useAccount();
    const { data: session } = useSession(); // Prepare for Twitter session

    // Local state for UI feedback
    const [twitterConnected, setTwitterConnected] = useState(!!initialData?.twitter);
    const [farcasterConnected, setFarcasterConnected] = useState(!!initialData?.farcaster);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");
    const [debugStatus, setDebugStatus] = useState("Ready");

    // Farcaster Auth Hook
    // @ts-expect-error - AuthKit types
    const { signIn, isSuccess: isAuthenticated, data: farcasterData, ...rest } = useSignIn({
        onError: (err) => setDebugStatus(`Auth Error: ${err?.message || JSON.stringify(err)}`)
    });

    useEffect(() => {
        if (isOpen) {
            setTwitterConnected(!!initialData?.twitter);
            setFarcasterConnected(!!initialData?.farcaster);
            setError("");
        }
    }, [isOpen, initialData]);

    // Handle Farcaster Success
    const handleFarcasterSuccess = async (res: StatusAPIResponse) => {
        if (!address) return;
        setIsSaving(true);
        try {
            const response = await fetch("/api/cartel/me/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    address,
                    farcasterHandle: res.username,
                    farcasterProof: res // Send proof to verify if strict (User opted for "Proper Integration")
                })
            });
            if (!response.ok) throw new Error("Failed to link Farcaster");
            setFarcasterConnected(true);
        } catch (err) {
            console.error(err);
            setError("Failed to link Farcaster");
        } finally {
            setIsSaving(false);
        }
    };

    // Watch for Farcaster authentication changes
    useEffect(() => {
        if (isAuthenticated && farcasterData && !farcasterConnected && isOpen) {
            handleFarcasterSuccess(farcasterData);
        }
    }, [isAuthenticated, farcasterData, farcasterConnected, isOpen]);


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-[#0a0e27] border border-white/10 rounded-2xl shadow-xl overflow-hidden relative">

                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h2 className="text-xl font-bold font-display tracking-wider text-white">
                        Connect Accounts
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Twitter / X Connect */}
                    <div className="space-y-3">
                        <label className="text-sm text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <XLogo className="w-4 h-4 text-white" />
                            X (Formerly Twitter)
                        </label>

                        {twitterConnected || session?.user ? (
                            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                                <span className="font-bold text-white">Connected</span>
                                <Check className="w-5 h-5 text-green-400" />
                            </div>
                        ) : (
                            <button
                                onClick={() => signInNextAuth('twitter')}
                                className="w-full py-3 bg-white text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2 hover:bg-gray-200"
                            >
                                <XLogo className="w-5 h-5" />
                                Connect X profile
                            </button>
                        )}
                    </div>

                    {/* Farcaster Connect */}
                    <div className="space-y-3">
                        <label className="text-sm text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-[#8a63d2]" />
                            Farcaster
                        </label>

                        {farcasterConnected ? (
                            <div className="flex items-center justify-between p-4 bg-[#8a63d2]/10 border border-[#8a63d2]/20 rounded-xl">
                                <span className="font-bold text-[#8a63d2]">Connected</span>
                                <Check className="w-5 h-5 text-[#8a63d2]" />
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={async () => {
                                        setDebugStatus("Clicked... invoking signIn()");
                                        try {
                                            signIn();
                                        } catch (e) {
                                            setDebugStatus(`Error invoking: ${e}`);
                                        }
                                    }}
                                    className="w-full py-3 bg-[#8a63d2] hover:bg-[#7c56c4] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    <MessageSquare className="w-5 h-5" />
                                    Connect Farcaster
                                </button>
                                {/* ON-SCREEN DEBUGGER */}
                                <div className="text-xs font-mono text-yellow-400 bg-black/50 p-2 rounded break-all">
                                    Status: {debugStatus} <br />
                                    Auth: {isAuthenticated ? "Yes" : "No"} <br />
                                    Err: {error || "None"}
                                </div>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
