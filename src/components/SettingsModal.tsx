"use client";

import { useState, useEffect } from "react";
import { X, Save, Twitter, MessageSquare, Loader2, Check } from "lucide-react";
import { useAccount } from "wagmi";

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
    const [twitter, setTwitter] = useState(initialData?.twitter || "");
    const [farcaster, setFarcaster] = useState(initialData?.farcaster || "");
    const [isSaving, setIsSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    // Reset when opening
    useEffect(() => {
        if (isOpen) {
            setTwitter(initialData?.twitter || "");
            setFarcaster(initialData?.farcaster || "");
            setSuccess(false);
            setError("");
        }
    }, [isOpen, initialData]);

    const handleSave = async () => {
        if (!address) return;
        setIsSaving(true);
        setError("");
        setSuccess(false);

        try {
            const res = await fetch("/api/cartel/me/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    address,
                    xHandle: twitter,
                    farcasterHandle: farcaster
                })
            });

            if (!res.ok) throw new Error("Failed to save settings");

            setSuccess(true);
            setTimeout(() => {
                onClose();
            }, 1000); // Close after 1s success show
        } catch (err) {
            console.error(err);
            setError("Failed to save. Please try again.");
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
                        User Settings
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
                    {/* Twitter Input */}
                    <div className="space-y-2">
                        <label className="text-sm text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <Twitter className="w-4 h-4 text-[#1DA1F2]" />
                            Twitter / X Handle
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">@</span>
                            <input
                                type="text"
                                value={twitter}
                                onChange={(e) => setTwitter(e.target.value.replace('@', ''))}
                                placeholder="username"
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#00d4ff] transition-colors"
                            />
                        </div>
                    </div>

                    {/* Farcaster Input */}
                    <div className="space-y-2">
                        <label className="text-sm text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-[#8a63d2]" />
                            Farcaster Handle
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">@</span>
                            <input
                                type="text"
                                value={farcaster}
                                onChange={(e) => setFarcaster(e.target.value.replace('@', ''))}
                                placeholder="username"
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#00d4ff] transition-colors"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-white/5 border-t border-white/5 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl font-bold bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || success}
                        className={`px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all ${success
                                ? "bg-green-500 text-white"
                                : "bg-gradient-to-r from-[#00d4ff] to-[#0066ff] hover:shadow-lg hover:shadow-blue-500/20 text-white"
                            }`}
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                            </>
                        ) : success ? (
                            <>
                                <Check className="w-4 h-4" />
                                Saved!
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
