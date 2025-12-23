
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
        console.error('Clan Page Crash:', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-[#050608] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/10 via-zinc-900/10 to-purple-900/10 animate-pulse-subtle" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/10 blur-[120px] rounded-full animate-float-slow" />

            <div className="max-w-md w-full relative z-10">
                <div className="bg-zinc-900/40 backdrop-blur-xl border border-red-500/20 rounded-2xl p-8 shadow-2xl space-y-6">
                    <div className="flex flex-col items-center text-center space-y-2">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/30 mb-2">
                            <span className="text-red-500 text-3xl font-bold">!</span>
                        </div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text text-transparent">System Failure</h2>
                        <p className="text-zinc-400 text-sm">Critical error encountered while accessing the syndicate data terminal.</p>
                    </div>

                    <div className="bg-black/50 p-4 rounded-lg border border-red-500/10 font-mono text-[10px] text-red-300/80 overflow-auto max-h-48 scrollbar-thin">
                        <p className="font-bold mb-1 text-red-400">{error.message}</p>
                        <pre className="whitespace-pre-wrap opacity-50">{error.stack}</pre>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button
                            onClick={() => reset()}
                            className="w-full h-12 bg-gradient-to-r from-red-600/20 to-orange-600/20 hover:from-red-600/30 hover:to-orange-600/30 text-white border border-red-500/30 transition-all font-bold uppercase tracking-widest text-xs"
                        >
                            Retry Connection
                        </Button>
                        <Button
                            onClick={() => window.location.href = '/clans'}
                            variant="ghost"
                            className="w-full h-12 text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all font-bold uppercase tracking-widest text-xs"
                        >
                            Abort (Back to Directory)
                        </Button>
                    </div>
                </div>

                <p className="text-center mt-6 text-[10px] text-zinc-600 uppercase tracking-[0.2em]">
                    Internal Error Hex Code: <span className="text-zinc-500">0x{error.digest?.slice(0, 8) || 'SYSTEM_HALT'}</span>
                </p>
            </div>
        </div>
    );
}
