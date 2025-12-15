
export enum RepTier {
    NEWBIE = 'NEWBIE',
    ASSOCIATE = 'ASSOCIATE',
    CAPOREGIME = 'CAPOREGIME',
    CONSIGLIERE = 'CONSIGLIERE',
    BOSS = 'BOSS',
    DON = 'DON'
}

export interface TierConfig {
    id: RepTier;
    minRep: number;
    title: string;
    perks: string[];
    cooldownReductionBps: number; // Basis points (100 = 1%)
    intelAccessLevel: number; // 0=None, 1=Basic, 2=Full
}

export const REP_TIERS: Record<RepTier, TierConfig> = {
    [RepTier.NEWBIE]: {
        id: RepTier.NEWBIE,
        minRep: 0,
        title: "Newbie",
        perks: [],
        cooldownReductionBps: 0,
        intelAccessLevel: 0
    },
    [RepTier.ASSOCIATE]: {
        id: RepTier.ASSOCIATE,
        minRep: 100,
        title: "Associate",
        perks: ["Intel Precision +1"],
        cooldownReductionBps: 0,
        intelAccessLevel: 1
    },
    [RepTier.CAPOREGIME]: {
        id: RepTier.CAPOREGIME,
        minRep: 300,
        title: "Caporegime",
        perks: ["Advanced Raid Filters"],
        cooldownReductionBps: 200, // 2%
        intelAccessLevel: 1
    },
    [RepTier.CONSIGLIERE]: {
        id: RepTier.CONSIGLIERE,
        minRep: 700,
        title: "Consigliere",
        perks: ["Reduced Agent Fee"],
        cooldownReductionBps: 500, // 5%
        intelAccessLevel: 2
    },
    [RepTier.BOSS]: {
        id: RepTier.BOSS,
        minRep: 1500,
        title: "Boss",
        perks: ["Clan Leadership Features"],
        cooldownReductionBps: 1000, // 10%
        intelAccessLevel: 2
    },
    [RepTier.DON]: {
        id: RepTier.DON,
        minRep: 3500,
        title: "Don",
        perks: ["Reserved Badge", "Season NFT"],
        cooldownReductionBps: 2000, // 20%
        intelAccessLevel: 3
    }
};

export function getRepTier(rep: number): TierConfig {
    if (rep >= 3500) return REP_TIERS[RepTier.DON];
    if (rep >= 1500) return REP_TIERS[RepTier.BOSS];
    if (rep >= 700) return REP_TIERS[RepTier.CONSIGLIERE];
    if (rep >= 300) return REP_TIERS[RepTier.CAPOREGIME];
    if (rep >= 100) return REP_TIERS[RepTier.ASSOCIATE];
    return REP_TIERS[RepTier.NEWBIE];
}

export function getNextTier(rep: number): TierConfig | null {
    if (rep >= 3500) return null;
    if (rep >= 1500) return REP_TIERS[RepTier.DON];
    if (rep >= 700) return REP_TIERS[RepTier.BOSS];
    if (rep >= 300) return REP_TIERS[RepTier.CONSIGLIERE];
    if (rep >= 100) return REP_TIERS[RepTier.CAPOREGIME];
    return REP_TIERS[RepTier.ASSOCIATE];
}
