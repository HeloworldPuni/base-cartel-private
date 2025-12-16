'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Profile Page Crash:', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-[#0B0E12] text-white flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-[#11141D] border border-red-900/50 rounded-xl p-6 space-y-4">
                <h2 className="text-xl font-bold text-red-500">Security Breach (Crash)</h2>
                <div className="bg-black/50 p-4 rounded border border-zinc-800 font-mono text-xs text-red-300 overflow-auto max-h-64">
                    <p className="font-bold mb-2">{error.message}</p>
                    <pre className="whitespace-pre-wrap opacity-70">{error.stack}</pre>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => reset()} className="w-full bg-zinc-800 hover:bg-zinc-700">
                        Retry Access
                    </Button>
                    <Button onClick={() => window.location.href = '/dashboard'} className="w-full bg-zinc-800 hover:bg-zinc-700">
                        Return to HQ
                    </Button>
                </div>
            </div>
        </div>
    );
}
