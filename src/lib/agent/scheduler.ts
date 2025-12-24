import { AgentDB } from './db';
import { executeAgentAction } from './executor';

export async function runAgentScheduler(targetUser?: string) {
    const agents = AgentDB.getAll();
    let activeAgents = agents.filter(a => a.enabled && a.delegation);

    // If targeting a specific user, filter for them
    if (targetUser) {
        activeAgents = activeAgents.filter(a => a.userAddress.toLowerCase() === targetUser.toLowerCase());
    }

    console.log(`[AgentScheduler] Found ${activeAgents.length} active agents${targetUser ? ` (Targeting ${targetUser})` : ''}`);

    const results = [];

    for (const agent of activeAgents) {
        // Simple logic: Run once every 24 hours
        const now = Date.now();
        const ONE_DAY = 24 * 60 * 60 * 1000;

        // If never run or run more than 24h ago OR forced via targetUser
        if (targetUser || !agent.lastRun || (now - agent.lastRun > ONE_DAY)) {
            try {
                console.log(`[AgentScheduler] Running for ${agent.userAddress}`);
                const result = await executeAgentAction(agent);
                results.push({ user: agent.userAddress, success: true, result });

                // Update last run
                agent.lastRun = now;
                AgentDB.save(agent);
            } catch (error) {
                console.error(`[AgentScheduler] Failed for ${agent.userAddress}:`, error);
                results.push({ user: agent.userAddress, success: false, error: String(error) });
            }
        } else {
            console.log(`[AgentScheduler] Skipping ${agent.userAddress} (Cooldown)`);
        }
    }

    return results;
}
