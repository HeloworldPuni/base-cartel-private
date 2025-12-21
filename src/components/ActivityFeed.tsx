"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from 'date-fns';
import { Activity } from 'lucide-react';

interface CartelEvent {
    id: string;
    type: 'RAID' | 'HIGH_STAKES_RAID' | 'RETIRE';
    attacker?: string;
    target?: string;
    user?: string;
    stolenShares?: number;
    selfPenaltyShares?: number;
    payout?: number;
    timestamp: string;
    txHash: string;
}

export default function ActivityFeed() {
    const [events, setEvents] = useState<CartelEvent[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchEvents = async () => {
        try {
            const res = await fetch('/api/cartel/events?limit=20');
            const data = await res.json();
            if (data.events) {
                setEvents(data.events);
            }
        } catch (error) {
            console.error("Failed to fetch activity:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
        const interval = setInterval(fetchEvents, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    const formatAddress = (addr?: string) => {
        if (!addr) return "Unknown";
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    const getEventIcon = (type: string) => {
        switch (type) {
            case 'HIGH_STAKES_RAID': return <span className="text-xl drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">🔥</span>;
            case 'RAID': return <span className="text-xl drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]">⚔️</span>;
            case 'RETIRE': return <span className="text-xl drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">💀</span>;
            case 'CLAIM': return <span className="text-xl drop-shadow-[0_0_8px_rgba(255,215,0,0.6)]">🪙</span>; // Gold glow
            case 'AUTO': return <span className="text-xl drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]">🤖</span>; // Blue glow
            default: return <span className="text-xl opacity-50">📝</span>;
        }
    };

    return (
        <div className="bg-[#0F172A]/40 backdrop-blur-xl border border-[#1E293B] rounded-2xl p-6 h-full">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                    <Activity className="text-[#0066FF]" size={24} />
                    <h2 className="text-xl font-bold text-white">Live Activity</h2>
                </div>
                <div className="flex items-center space-x-2">
                    <div
                        className="w-2 h-2 bg-[#00FF88] rounded-full animate-pulse"
                    ></div>
                    <span className="text-xs text-gray-400 uppercase tracking-wider">
                        Live
                    </span>
                </div>
            </div>

            <div className="space-y-3 max-h-[300px] md:max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                {loading && events.length === 0 ? (
                    <div className="text-center text-zinc-500 text-xs py-4">Scanning chain data...</div>
                ) : events.length === 0 ? (
                    <div className="text-center text-zinc-500 text-xs py-4">No recent activity.</div>
                ) : (
                    <AnimatePresence initial={false}>
                        {events.map((event, index) => (
                            <motion.div
                                key={event.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                className="group relative bg-gradient-to-r from-[#0F172A]/80 to-transparent border-l-2 border-[#0066FF]/50 pl-4 pr-4 py-3 hover:border-[#0066FF] transition-all duration-300 rounded-r-lg"
                            >
                                <div className="flex items-start space-x-3">
                                    <div className="text-xl flex-shrink-0 mt-1">
                                        {getEventIcon(event.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm text-gray-300 leading-tight">
                                            {event.type === 'RAID' && (
                                                <>
                                                    <span className="text-blue-400 font-bold">{formatAddress(event.attacker)}</span> raided <span className="text-red-400">{formatAddress(event.target)}</span>
                                                </>
                                            )}
                                            {event.type === 'HIGH_STAKES_RAID' && (
                                                <>
                                                    <span className="text-red-500 font-bold">HIGH-STAKES:</span> <span className="text-blue-400 font-bold">{formatAddress(event.attacker)}</span> hit <span className="text-red-400">{formatAddress(event.target)}</span>!
                                                </>
                                            )}
                                            {event.type === 'RETIRE' && (
                                                <>
                                                    <span className="text-zinc-500 font-bold">{formatAddress(event.user)}</span> retired.
                                                </>
                                            )}
                                            <div className="text-xs text-zinc-500 mt-1 flex justify-between">
                                                <span>{formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}</span>
                                                {event.stolenShares && <span className="text-green-400 font-mono">+{event.stolenShares} Shares</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}
