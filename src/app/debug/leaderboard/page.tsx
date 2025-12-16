
```
import prisma from '@/lib/prisma';
import { getLeaderboard } from '@/lib/leaderboard-service';

export const dynamic = 'force-dynamic';

export default async function DebugLeaderboardPage() {
    try {
        // 1. Check Raw DB Connection
        const userCount = await prisma.user.count();
        
        // 2. Check Raw Data
        const topUsers = await prisma.user.findMany({
            orderBy: { shares: 'desc' },
            take: 5,
            select: { walletAddress: true, shares: true }
        });

        // 3. Check Service Output
        const serviceResult = await getLeaderboard(5, 1);
        
        const dbUrl = process.env.DATABASE_URL;
        const dbHost = dbUrl ? (dbUrl.includes('@') ? dbUrl.split('@')[1].split('/')[0] : 'LOCAL/UNKNOWN') : 'UNDEFINED';

        return (
            <div className="p-8 bg-black text-white font-mono text-sm min-h-screen">
                <h1 className="text-2xl font-bold text-red-500 mb-6">SYSTEM DIAGNOSTICS: LEADERBOARD</h1>
                
                <div className="grid gap-6">
                    <div className="border border-zinc-800 p-4 rounded">
                        <h2 className="text-blue-400 font-bold mb-2">1. DATABASE STATE</h2>
                        <div>Total Users: {userCount}</div>
                        <div className="mt-2 text-zinc-500">
                            {userCount === 0 ? "⚠️ CRITICAL: Database is empty." : "OK: Users found."}
                        </div>
                    </div>

                    <div className="border border-zinc-800 p-4 rounded">
                        <h2 className="text-green-400 font-bold mb-2">2. RAW TABLE DATA (Top 5)</h2>
                        {topUsers.length === 0 ? (
                            <div className="text-red-500">No users found in standard query.</div>
                        ) : (
                            <pre className="bg-zinc-900 p-2 rounded overflow-auto">
                                {JSON.stringify(topUsers, null, 2)}
                            </pre>
                        )}
                    </div>

                    <div className="border border-zinc-800 p-4 rounded">
                        <h2 className="text-yellow-400 font-bold mb-2">3. SERVICE LAYER OUTPUT</h2>
                        <pre className="bg-zinc-900 p-2 rounded overflow-auto">
                            {JSON.stringify(serviceResult, null, 2)}
                        </pre>
                    </div>

                     <div className="border border-zinc-800 p-4 rounded">
                        <h2 className="text-purple-400 font-bold mb-2">4. ENVIRONMENT</h2>
                        <div>Node Env: {process.env.NODE_ENV}</div>
                        <div className="text-yellow-500 font-mono break-all">
                            DB Host: {dbHost}
                        </div>
                        <div>DB Provider: Postgres</div>
                    </div>
                </div>
            </div>
        );
    } catch (e: any) {
        return (
            <div className="p-8 bg-black text-white font-mono min-h-screen">
                <h1 className="text-red-500 text-2xl font-bold mb-4">DIAGNOSTIC CRASHED</h1>
                <div className="p-4 border border-red-500 rounded bg-red-950/20">
                    <p className="font-bold">Error: {e.message}</p>
                    <pre className="mt-4 text-xs opacity-75 whitespace-pre-wrap">{e.stack}</pre>
                </div>
                <div className="mt-8">
                     <h2 className="text-purple-400 font-bold mb-2">ENVIRONMENT CHECK</h2>
                     <div>DATABASE_URL_DEFINED: {process.env.DATABASE_URL ? "YES" : "NO"}</div>
                </div>
            </div>
        )
    }
}
```
