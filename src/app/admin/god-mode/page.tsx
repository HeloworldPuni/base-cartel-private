"use client";

import { useEffect, useState } from 'react';
import { isGodModeEnabled, setGodMode } from '@/lib/dev-mode-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminGodModePage() {
    const [password, setPassword] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        setMounted(true);
        setEnabled(isGodModeEnabled());
    }, []);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === "Crypto@9281") {
            setIsAuthenticated(true);
        } else {
            alert("Access Denied");
        }
    };

    const toggleGodMode = () => {
        const newState = !enabled;
        setGodMode(newState);
        setEnabled(newState);
    };

    if (!mounted) return <div className="p-8 text-zinc-500">Loading...</div>;

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
                <Card className="w-full max-w-sm bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-center text-xl text-zinc-400">Restricted Access</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <input
                                type="password"
                                placeholder="Enter Admin Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-3 rounded bg-zinc-950 border border-zinc-800 text-white focus:border-[#D4AF37] focus:outline-none"
                            />
                            <Button type="submit" className="w-full bg-[#D4AF37] text-black hover:bg-[#b0912d] font-bold">
                                UNLOCK
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-center text-2xl font-black text-[#D4AF37]">
                        👑 GOD MODE ADMIN
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="bg-zinc-950 p-6 rounded-xl border border-zinc-800 text-center space-y-4">
                        <div className="text-zinc-400 text-sm uppercase tracking-wider">Current Status</div>
                        <div className={`text-3xl font-bold ${enabled ? 'text-green-500' : 'text-red-500'}`}>
                            {enabled ? 'ENABLED' : 'DISABLED'}
                        </div>
                        <p className="text-xs text-zinc-500">
                            {enabled
                                ? "Wallet requirement is BYPASSED. Dashboard uses Mock Data."
                                : "Wallet requirement is ENFORCED. Real Data only."}
                        </p>
                    </div>

                    <Button
                        onClick={toggleGodMode}
                        className={`w-full h-14 font-bold text-lg transition-all ${enabled
                            ? 'bg-red-600 hover:bg-red-700 shadow-[0_0_20px_rgba(220,38,38,0.4)]'
                            : 'bg-green-600 hover:bg-green-700 shadow-[0_0_20px_rgba(22,163,74,0.4)]'
                            }`}
                    >
                        {enabled ? "DISABLE GOD MODE" : "ENABLE GOD MODE"}
                    </Button>

                    <div className="text-center">
                        <a href="/" className="text-zinc-500 hover:text-white text-sm underline underline-offset-4">
                            Back to Dashboard
                        </a>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
