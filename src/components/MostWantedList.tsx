'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { ThreatEntry } from '@/lib/threat-service';
import { Crosshair, Trophy } from 'lucide-react';

export default function MostWantedList() {
    const [agents, setAgents] = useState<ThreatEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { address } = useAccount();

    useEffect(() => {
        fetch('/api/cartel/most-wanted?limit=50')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setAgents(data.data);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load most wanted", err);
                setLoading(false);
            });
    }, []);

    const handleRowClick = (agentAddress: string) => {
        router.push(`/profile/${agentAddress}`);
    };

    if (loading) return <div className="p-4 text-center text-zinc-500 text-xs animate-pulse">Scanning surveillance...</div>;
    if (agents.length === 0) return null;

    return (
        <div className="relative bg-gradient-to-br from-[#FF0066]/10 via-[#0F172A] to-[#0066FF]/10 backdrop-blur-xl border border-[#FF0066]/30 rounded-2xl p-6 overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF0066] opacity-5 rounded-full blur-2xl"></div>

            <div className="relative flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                    <Trophy className="text-[#FF0066]" size={20} />
                    <h3 className="text-lg font-bold text-white">Most Wanted</h3>
                </div>
                <div
                    className="w-2 h-2 bg-[#FF0066] rounded-full animate-pulse"
                ></div>
            </div>

            <div className="relative space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                {agents.map((agent, i) => {
                    const isSelf = address && agent.address.toLowerCase() === address.toLowerCase();
                    const rank = i + 1;

                    return (
                        <div
                            key={agent.address}
                            onClick={() => handleRowClick(agent.address)}
                            className={`group flex items-center justify-between p-3 rounded-xl transition-all duration-300 cursor-pointer ${isSelf
                                ? "bg-gradient-to-r from-[#0066FF]/20 to-[#00D4FF]/10 border border-[#0066FF]/50"
                                : "bg-[#0F172A]/50 border border-[#1E293B] hover:border-[#FF0066]/50"
                                }`}
                        >
                            <div className="flex items-center space-x-3 flex-1">
                                <div
                                    className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${rank === 1
                                        ? "bg-[#FFD700] text-black"
                                        : rank === 2
                                            ? "bg-[#C0C0C0] text-black"
                                            : rank === 3
                                                ? "bg-[#CD7F32] text-black"
                                                : "bg-[#1E293B] text-gray-400"
                                        }`}
                                >
                                    {rank}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm font-mono text-gray-300 truncate max-w-[100px] sm:max-w-none">
                                            {agent.handle ? `@${agent.handle}` : `${agent.address.slice(0, 6)}...`}
                                        </span>
                                        {isSelf && (
                                            <span className="text-xs px-2 py-0.5 bg-[#0066FF] text-white rounded-full">
                                                YOU
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        Heat Score: {agent.threatScore}
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <div className="text-sm font-bold text-[#FF0066]">
                                    {/* Using threat score as 'bounty' proxy visually for now, or just show Actions */}
                                    Target
                                </div>
                                <Crosshair className="w-4 h-4 text-zinc-600 group-hover:text-[#FF0066] transition-colors" />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
