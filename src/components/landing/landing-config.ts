export const LANDING_THEME = {
    colors: {
        neonGreen: "#3DFF72",
        neonRed: "#EF4444",
        neonGold: "#D4AF37",
        bgDark: "#0B0E12",
        bgCard: "#13161F",
    },
    animation: {
        duration: 0.6,
        stagger: 0.1,
    }
};

export const LANDING_CONTENT = {
    hero: {
        title: "RULE THE CHAIN",
        subtitle: "A social onchain cartel game built on Base.",
        cta: "OPEN APP",
    },
    features: [
        {
            title: "Raid Rivals",
            description: "Steal shares and burn enemies in PVP attacks.",
            icon: "⚔️",
            color: "text-red-500",
            glow: "shadow-red-500/50"
        },
        {
            title: "Build Your Clan",
            description: "Recruit members and earn referral bonuses.",
            icon: "🧬",
            color: "text-blue-500",
            glow: "shadow-blue-500/50"
        },
        {
            title: "Automate",
            description: "Deploy Autonomous Agents (x402) to work 24/7.",
            icon: "🤖",
            color: "text-purple-500",
            glow: "shadow-purple-500/50"
        },
        {
            title: "Rank Up",
            description: "Climb the leaderboard and control the daily pot.",
            icon: "👑",
            color: "text-yellow-500",
            glow: "shadow-yellow-500/50"
        }
    ],
    howItWorks: [
        { title: "Join Cartel", desc: "Mint 100 shares to enter the game." },
        { title: "Raid & Betray", desc: "Attack players to steal their cut." },
        { title: "Earn Dividends", desc: "Claim daily profit from the pot." }
    ]
};
