"use client";

import { useAddFrame, useMiniKit } from '@coinbase/onchainkit/minikit';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function SaveAppButton({ className, variant = "default" }: { className?: string, variant?: "default" | "outline" | "ghost" }) {
    // Attempt to use hook, fallback if context is missing or feature unavailable
    let addFrame: ReturnType<typeof useAddFrame>;
    let minikit: any;

    try {
        addFrame = useAddFrame();
        minikit = useMiniKit();
    } catch (e) {
        // Not in minikit context
        return null;
    }

    const { context } = minikit;
    const [isAdding, setIsAdding] = useState(false);

    if (!context?.user) return null;

    // Check if presumably already added (client check)
    if (context.client?.added) {
        return null;
    }

    const handleSave = async () => {
        setIsAdding(true);
        try {
            const result = await addFrame();

            if (result) {
                console.log('Frame saved:', result.url);

                // Save token to DB
                await fetch('/api/notification-tokens', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        token: result.token,
                        url: result.url,
                        userFid: context.user.fid
                    })
                });

                toast.success("App saved to collection! 🎉");
            } else {
                console.log('User cancelled or frame already saved');
            }
        } catch (error) {
            console.error('Failed to save frame:', error);
            // toast.error("Failed to save app.");
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <Button
            onClick={handleSave}
            disabled={isAdding}
            variant={variant}
            className={className}
        >
            {isAdding ? "Saving..." : "Save to Collection ➕"}
        </Button>
    );
}
