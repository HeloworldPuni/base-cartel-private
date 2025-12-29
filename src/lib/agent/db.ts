import prisma from '../prisma';

export interface AgentSettings {
    userAddress: string;
    enabled: boolean;
    strategy: 'conservative' | 'balanced' | 'aggressive';
    budget: number; // USDC
    maxShareRisk: number; // %
    delegation: {
        signature: string;
        deadline: number;
        nonce: number;
    } | null;
    lastRun: number;
}

export const AgentDB = {
    getAll: async (): Promise<AgentSettings[]> => {
        try {
            const result = await prisma.agentSettings.findMany();
            return result.map(toAppModel);
        } catch (e) {
            console.error("Error reading DB:", e);
            return [];
        }
    },

    get: async (userAddress: string): Promise<AgentSettings | null> => {
        try {
            const result = await prisma.agentSettings.findUnique({
                where: { userAddress }
            });
            return result ? toAppModel(result) : null;
        } catch (e) {
            console.error("Error reading DB for user:", e);
            return null;
        }
    },

    save: async (settings: AgentSettings) => {
        try {
            const data = {
                userAddress: settings.userAddress,
                enabled: settings.enabled,
                strategy: settings.strategy,
                budget: settings.budget,
                maxShareRisk: settings.maxShareRisk,
                delegation: settings.delegation as any, // Prisma Json type
                lastRun: settings.lastRun ? new Date(settings.lastRun) : null
            };

            await prisma.agentSettings.upsert({
                where: { userAddress: settings.userAddress },
                update: data,
                create: data
            });
        } catch (e) {
            console.error("Error saving DB:", e);
        }
    }
};

function toAppModel(dbModel: any): AgentSettings {
    return {
        userAddress: dbModel.userAddress,
        enabled: dbModel.enabled,
        strategy: dbModel.strategy as any,
        budget: dbModel.budget,
        maxShareRisk: dbModel.maxShareRisk,
        delegation: dbModel.delegation,
        lastRun: dbModel.lastRun ? new Date(dbModel.lastRun).getTime() : 0
    };
}
