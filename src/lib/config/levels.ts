
export interface LevelConfig {
    id: number;
    title: string;
    minRep: number;
    perks: string[];
}

export const LEVELS: LevelConfig[] = [
    {
        id: 0,
        title: "Newbie",
        minRep: 0,
        perks: []
    },
    {
        id: 1,
        title: "Associate",
        minRep: 100,
        perks: ["Intel Precision +1"]
    },
    {
        id: 2,
        title: "Caporegime",
        minRep: 300,
        perks: ["Advanced Raid Filters"]
    },
    {
        id: 3,
        title: "Consigliere",
        minRep: 700,
        perks: ["Reduced Agent Fee"]
    },
    {
        id: 4,
        title: "Boss",
        minRep: 1500,
        perks: ["Clan Leadership Features"]
    },
    {
        id: 5,
        title: "Don",
        minRep: 3500,
        perks: ["Reserved Badge", "Season NFT"]
    }
];

export function getUserLevel(rep: number): { current: LevelConfig, next: LevelConfig | null, progress: number } {
    let current = LEVELS[0];
    let next: LevelConfig | null = null;

    for (let i = 0; i < LEVELS.length; i++) {
        if (rep >= LEVELS[i].minRep) {
            current = LEVELS[i];
            next = LEVELS[i + 1] || null;
        } else {
            break;
        }
    }

    let progress = 0;
    if (next) {
        // Calculate progress to next level
        const range = next.minRep - current.minRep;
        const currentInLevel = rep - current.minRep;
        progress = Math.min(100, Math.floor((currentInLevel / range) * 100));
    } else {
        progress = 100;
    }

    return { current, next, progress };
}
