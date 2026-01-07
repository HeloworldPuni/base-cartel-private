"use client";

import { useState, useEffect } from "react";
import { X, Twitter, MessageSquare, Loader2, Check } from "lucide-react";
import { useAccount } from "wagmi";
import { signIn, useSession } from "next-auth/react";
import { SignInButton, StatusAPIResponse } from "@farcaster/auth-kit";

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

    useEffect(() => {
        if (isOpen) {
            setTwitterConnected(!!initialData?.twitter);
            setFarcasterConnected(!!initialData?.farcaster);
            setError("");
        }
    }, [isOpen, initialData]);

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
                    {/* Twitter Connect */}
                    <div className="space-y-3">
                        <label className="text-sm text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <Twitter className="w-4 h-4 text-[#1DA1F2]" />
                            Twitter / X
                        </label>

                        {twitterConnected || session?.user ? (
                            <div className="flex items-center justify-between p-4 bg-[#1DA1F2]/10 border border-[#1DA1F2]/20 rounded-xl">
                                <span className="font-bold text-[#1DA1F2]">Connected</span>
                                <Check className="w-5 h-5 text-[#1DA1F2]" />
                            </div>
                        ) : (
                            <button
                                onClick={() => signIn('twitter')}
                                className="w-full py-3 bg-[#1DA1F2] hover:bg-[#1a91da] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                <Twitter className="w-5 h-5" />
                                Connect Twitter
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
                            <div className="w-full flex justify-center">
                                <SignInButton
                                    onSuccess={handleFarcasterSuccess}
                                    onError={() => setError("Farcaster Login Failed")}
                                />
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
