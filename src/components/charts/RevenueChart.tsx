"use client";

import { useEffect, useState, useMemo } from 'react';
import { formatUSDC } from '@/lib/basePay'; // Helper or just re-implement format

interface ChartData {
    date: string;
    revenue: number;
}

export default function RevenueChart({ range = '7d' }: { range?: string }) {
    const [data, setData] = useState<ChartData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);

    useEffect(() => {
        setLoading(true);
        fetch(`/api/cartel/revenue/chart?range=${range}`)
            .then(res => res.json())
            .then(res => {
                if (res.success) {
                    setData(res.data);
                } else {
                    setError("Failed to load");
                }
            })
            .catch(() => setError("Network Error"))
            .finally(() => setLoading(false));
    }, [range]);

    // SCALE LOGIC
    const { points, maxVal, width, height } = useMemo(() => {
        if (!data.length) return { points: [], maxVal: 0, width: 0, height: 0 };

        const h = 100; // SVG internal height
        const w = 300; // SVG internal width
        const max = Math.max(...data.map(d => d.revenue), 0.000001) * 1.2; // Add 20% breathing room

        const pts = data.map((d, i) => {
            const x = (i / (data.length - 1)) * w;
            const y = h - ((d.revenue / max) * h);
            return { x, y, val: d.revenue, date: d.date };
        });

        return { points: pts, maxVal: max, width: w, height: h };
    }, [data]);

    if (loading) return <div className="h-32 flex items-center justify-center text-xs text-zinc-500 animate-pulse">Loading Chart...</div>;
    if (error) return <div className="h-32 flex items-center justify-center text-xs text-red-500">Unavailable</div>;
    if (data.length === 0) return <div className="h-32 flex items-center justify-center text-xs text-zinc-500">No data</div>;

    // SVG PATHS
    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
    const areaPath = `${linePath} L ${width},${height} L 0,${height} Z`;

    return (
        <div className="w-full h-32 relative group select-none">
            {/* Chart Bounds */}
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4FF0E6" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#4FF0E6" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Grid Lines (Simple) */}
                <line x1="0" y1={height} x2={width} y2={height} stroke="#333" strokeWidth="1" />

                {/* Area Fill */}
                <path d={areaPath} fill="url(#chartGradient)" />

                {/* Line Stroke */}
                <path d={linePath} fill="none" stroke="#4FF0E6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

                {/* Points & Tooltip Logic */}
                {points.map((p, i) => (
                    <g key={i}>
                        {/* Invisible touch target for hover */}
                        <rect
                            x={p.x - (width / points.length) / 2}
                            y="0"
                            width={width / points.length}
                            height={height}
                            fill="transparent"
                            onMouseEnter={() => setHoverIndex(i)}
                            onMouseLeave={() => setHoverIndex(null)}
                            className="cursor-crosshair"
                        />
                        {/* Dot on hover */}
                        {hoverIndex === i && (
                            <circle cx={p.x} cy={p.y} r="4" fill="#18181b" stroke="#4FF0E6" strokeWidth="2" />
                        )}
                    </g>
                ))}
            </svg>

            {/* Tooltip Overlay */}
            {hoverIndex !== null && points[hoverIndex] && (
                <div
                    className="absolute top-0 transform -translate-x-1/2 -translate-y-full bg-zinc-900 border border-zinc-700 text-xs px-2 py-1 rounded shadow-xl pointer-events-none whitespace-nowrap z-10"
                    style={{ left: `${(points[hoverIndex].x / width) * 100}%` }}
                >
                    <div className="text-zinc-400 font-bold">{points[hoverIndex].date.slice(5)}</div>
                    <div className="text-[#4FF0E6] font-bold">${points[hoverIndex].val.toFixed(3)}</div>
                </div>
            )}
        </div>
    );
}
