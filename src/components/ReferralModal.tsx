"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sdk } from "@farcaster/miniapp-sdk";

interface ReferralModalProps {
    isOpen: boolean;
    onClose: () => void;
    address?: string;
    referralCount?: number;
}

export default function ReferralModal({ isOpen, onClose, address, referralCount = 0 }: ReferralModalProps) {
    const [inviteLink, setInviteLink] = useState("");
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://basecartel.in';
            setInviteLink(`${baseUrl}?ref=${address || 'YOUR_ADDRESS'}`);
        }
    }, [isOpen, address]);

    if (!isOpen) return null;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = () => {
        sdk.actions.composeCast({
            text: `Join me in the Base Cartel! Use my referral link to get bonus shares. 🔴🔵\n\n${inviteLink}`,
            embeds: [inviteLink]
        });
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <Card className="w-full max-w-md card-glow border-[#4FF0E6]/40">
                <CardHeader>
                    <CardTitle className="text-center text-[#4FF0E6] text-2xl heading-font">
                        🤝 Refer & Earn
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2 text-center">
                        <p className="text-white text-lg">
                            Earn <span className="text-[#D4AF37] font-black text-2xl glow-gold">20 Shares</span>
                        </p>
                        <p className="text-zinc-400 text-sm">
                            For every recruit who joins using your link.
                        </p>
                    </div>

                    <div className="card-glow p-4 rounded-xl space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-zinc-400 text-sm">Total Referrals</span>
                            <span className="text-white font-bold">{referralCount}</span>
                        </div>
                        <div className="h-px bg-gradient-to-r from-transparent via-[#4A87FF]/20 to-transparent"></div>
                        <div className="flex justify-between items-center">
                            <span className="text-zinc-400 text-sm">Bonus Earned</span>
                            <span className="text-[#3DFF72] font-bold">{referralCount * 20} shares</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-zinc-400 text-xs font-medium">Your Referral Link</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={inviteLink}
                                readOnly
                                className="flex-1 bg-[#0B0E12] border border-[#4A87FF]/30 rounded-lg px-3 py-2 text-sm text-zinc-300 font-mono focus:outline-none"
                            />
                            <Button
                                onClick={handleCopyLink}
                                variant="outline"
                                className="px-4 border-[#4FF0E6]/40 bg-[#4FF0E6]/10 hover:bg-[#4FF0E6]/20 text-[#4FF0E6]"
                            >
                                {copied ? "✓" : "Copy"}
                            </Button>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            onClick={handleShare}
                            className="flex-1 bg-gradient-to-r from-[#4FF0E6] to-[#4A87FF] hover:from-[#5FFFF6] hover:to-[#5A97FF] text-white font-bold rounded-lg glow-cyan"
                        >
                            Share on Farcaster
                        </Button>
                        <Button
                            onClick={onClose}
                            variant="outline"
                            className="flex-1 border-zinc-700 hover:bg-zinc-800 text-white rounded-lg"
                        >
                            Close
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
