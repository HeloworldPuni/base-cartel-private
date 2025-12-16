'use client';

import { useEffect, useState } from 'react';
import { ThreatEntry } from '@/lib/threat-service';

export default function MostWantedList() {
    const [agents, setAgents] = useState<ThreatEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/cartel/most-wanted?limit=5')
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

    if (loading) return <div className="p-4 text-center text-zinc-500 text-xs animate-pulse">Scanning surveillance...</div>;
    if (agents.length === 0) return null;

    return (
        <div className="bg-[#111] border border-zinc-800/50 rounded-lg overflow-hidden">
            <div className="bg-[#1A1A1A] p-3 border-b border-zinc-800 flex justify-between items-center">
                <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest flex items-center gap-2">
                    <span>🔥</span> Most Wanted (24h)
                </h3>
                <span className="text-[10px] text-zinc-600 font-mono">HEAT INDEX</span>
            </div>

            <div className="divide-y divide-zinc-800/50">
                {agents.map((agent, i) => (
                    <div key={agent.address} className="p-3 flex items-center justify-between hover:bg-zinc-900/50 transition-colors group">
                        <div className="flex items-center gap-3">
                            <span className={`text-xs font-mono w-4 ${i < 3 ? 'text-white font-bold' : 'text-zinc-600'}`}>
                                #{i + 1}
                            </span>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-zinc-300 group-hover:text-red-400 transition-colors">
                                    {agent.handle ? `@${agent.handle}` : `${agent.address.slice(0, 6)}...${agent.address.slice(-4)}`}
                                </span>
                                <div className="flex gap-2 text-[10px] text-zinc-600">
                                    <span>🔫 {agent.normalRaidsInitiated + agent.highStakesRaidsInitiated}</span>
                                    <span>🎯 {agent.timesRaided}</span>
                                </div>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className="text-sm font-black text-red-500/90 font-mono">
                                {agent.threatScore}
                            </div>
                            <div className="text-[9px] text-zinc-600 uppercase tracking-wide">
                                Heat
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-2 bg-zinc-950/30 text-center border-t border-zinc-800/30">
                <p className="text-[9px] text-zinc-600 italic">
                    Higher heat = Higher priority target
                </p>
            </div>
        </div>
    );
}
