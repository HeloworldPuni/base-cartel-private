"use client";

import { useState, useEffect } from "react";
import { Wallet, ArrowRight, Shield, Globe, Cpu } from "lucide-react";
import { useAccount, useConnect } from 'wagmi';
import { useRouter } from "next/navigation";

export default function SignInPage() {
    const [loading, setLoading] = useState(false);
    // Real Wagmi state
    const { isConnected, address } = useAccount();
    const { connect, connectors } = useConnect();
    const router = useRouter();

    const handleConnect = async () => {
        setLoading(true);
        // Attempt connection (Prioritize Coinbase, then Injected)
        const cb = connectors.find(c => c.id === 'coinbaseWalletSDK');
        const injected = connectors.find(c => c.id === 'injected');
        const target = cb || injected || connectors[0];

        if (target) {
            connect({ connector: target }, {
                onSuccess: () => setLoading(false),
                onError: () => setLoading(false)
            });
        } else {
            alert("No wallet connectors found!");
            setLoading(false);
        }
    };

    const handleEnter = () => {
        router.push('/dashboard');
    };

    return (
        <div className="min-h-screen bg-black text-white font-inter flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background subtle grid */}
            <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                    backgroundImage:
                        "linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)",
                    backgroundSize: "40px 40px",
                }}
            ></div>

            {/* Scanline animation */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
                <div className="w-full h-[2px] bg-white/20 animate-scanline"></div>
            </div>

            <div className="w-full max-w-[400px] z-10 flex flex-col items-center">
                {/* Logo Section */}
                <div className="mb-8 text-center">
                    <img
                        src="https://raw.createusercontent.com/e124f442-2805-4811-86dd-03e89202dfc9/"
                        alt="Base Cartel Logo"
                        className="h-24 mb-6 mx-auto invert"
                    />
                    <h1 className="text-2xl font-bold tracking-[0.2em] uppercase mb-2">
                        BASE CARTEL
                    </h1>
                    <div className="h-[1px] w-full bg-white/20 mb-6"></div>
                </div>

                {/* Status Terminal Section */}
                <div className="w-full bg-[#111] border border-white/10 rounded-lg p-4 mb-8 font-mono text-[12px] space-y-1">
                    <div className="flex justify-between">
                        <span className="text-white/40">NETWORK</span>
                        <span className="text-blue-400">BASE MAINNET</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-white/40">PROTOCOL</span>
                        <span className="text-white">WEB3_AUTH_V2</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-white/40">WALLET STATUS</span>
                        <span className={isConnected ? "text-green-500" : "text-red-500"}>
                            {isConnected ? "CONNECTED" : "DISCONNECTED"}
                        </span>
                    </div>
                </div>

                {/* Connect Wallet Section */}
                <div className="w-full space-y-4">
                    {!isConnected ? (
                        <button
                            onClick={handleConnect}
                            disabled={loading}
                            className="w-full bg-white text-black font-bold py-4 rounded-lg hover:bg-white/90 active:scale-[0.98] transition-all flex items-center justify-center gap-3 uppercase tracking-[0.1em]"
                        >
                            {loading ? (
                                <>
                                    <Cpu className="animate-spin" size={18} />
                                    INITIALIZING...
                                </>
                            ) : (
                                <>
                                    <Wallet size={18} />
                                    CONNECT WALLET
                                </>
                            )}
                        </button>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
                                <p className="text-green-500 text-xs font-mono uppercase tracking-widest">
                                    Access Granted: {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '0x...'}
                                </p>
                            </div>
                            <button
                                onClick={handleEnter}
                                className="w-full bg-white text-black font-bold py-4 rounded-lg hover:bg-white/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase tracking-[0.1em]"
                            >
                                ENTER THE CARTEL
                                <ArrowRight size={18} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer Links */}
                <div className="mt-12 flex flex-col items-center gap-6">
                    <div className="flex gap-8 opacity-40 hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-2">
                            <Shield size={12} />
                            <span className="text-[10px] uppercase tracking-tighter">
                                SECURE
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Globe size={12} />
                            <span className="text-[10px] uppercase tracking-tighter">
                                ONCHAIN
                            </span>
                        </div>
                    </div>
                    <p className="text-white/20 text-[10px] uppercase tracking-[0.2em] text-center max-w-[250px] leading-relaxed">
                        By connecting, you agree to the cartel's smart contract protocols.
                    </p>
                </div>
            </div>

            <style jsx global>{`
        @keyframes scanline {
          0% { top: -10%; }
          100% { top: 110%; }
        }
        .animate-scanline {
          position: absolute;
          animation: scanline 8s linear infinite;
        }
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=JetBrains+Mono&display=swap');
        .font-inter { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
      `}</style>
        </div>
    );
}
