import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const range = searchParams.get('range') || '7d';
        let days = 7;
        if (range === '14d') days = 14;
        if (range === '30d') days = 30;

        const now = new Date();
        // Set to start of day for cleaner buckets via JS (though DB stores exact time)
        const startDate = new Date(now);
        startDate.setDate(now.getDate() - days);

        // Fetch Raw Data (We do aggregation in App Layer for simpler DX than raw SQL group by)
        const transactions = await prisma.revenueTransaction.findMany({
            where: {
                createdAt: { gte: startDate }
            },
            select: {
                amount: true,
                createdAt: true
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        // Group by YYYY-MM-DD
        const dailyMap = new Map<string, number>();

        // Initialize all days with 0 (fill gaps)
        for (let i = 0; i < days; i++) {
            const d = new Date();
            d.setDate(now.getDate() - i);
            const key = d.toISOString().split('T')[0];
            dailyMap.set(key, 0);
        }

        // Fill Data
        transactions.forEach(tx => {
            const key = tx.createdAt.toISOString().split('T')[0];
            const current = dailyMap.get(key) || 0;
            dailyMap.set(key, current + tx.amount);
        });

        // Convert to Sorted Array
        const chartData = Array.from(dailyMap.entries())
            .map(([date, revenue]) => ({ date, revenue }))
            .sort((a, b) => a.date.localeCompare(b.date)); // Ensure ASC order

        return NextResponse.json({
            data: chartData,
            success: true
        });

    } catch (error) {
        console.error("Revenue Chart Error:", error);
        return NextResponse.json({ data: [], error: String(error) }, { status: 500 });
    }
}
