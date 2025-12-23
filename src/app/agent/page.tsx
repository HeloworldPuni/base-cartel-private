"use client";

import { motion } from "framer-motion";
import { Shield, ArrowLeft } from "lucide-react";
import Link from "next/link";
import AuthenticatedRoute from '@/components/AuthenticatedRoute';
import AutoAgentPanel from '@/components/agent/AutoAgentPanel';
import BottomNav from '@/components/BottomNav';

export default function AgentPage() {
    return (
        <AuthenticatedRoute>
            <div className="min-h-screen bg-[#0a0e27] text-white pb-24 md:pb-8 overflow-x-hidden relative">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10 mafia-pattern pointer-events-none"></div>

                {/* Header */}
                <div className="relative pt-8 px-4 md:px-8 max-w-7xl mx-auto">
                    <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors font-mono uppercase tracking-wider text-xs md:text-sm">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Link>

                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-4 mb-8"
                    >
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-[#ffd700] to-[#ffa500] rounded-full flex items-center justify-center glow-text-gold shadow-lg shadow-yellow-500/20">
                            <Shield className="w-6 h-6 md:w-8 md:h-8 text-black" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-5xl font-display uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#ffd700] to-[#ffecb3]">
                                Auto-Agent
                            </h1>
                            <p className="text-gray-400 font-mono text-sm md:text-base mt-1">Deploy AI to rule the chain</p>
                        </div>
                    </motion.div>

                    {/* Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="max-w-3xl"
                    >
                        <AutoAgentPanel />
                    </motion.div>
                </div>

                {/* Bottom Navigation - Mobile Only */}
                <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
                    <BottomNav />
                </div>
            </div>
        </AuthenticatedRoute>
    );
}
