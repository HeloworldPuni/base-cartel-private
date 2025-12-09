import { Variants } from "framer-motion";

// 1. Tailwind Utility Class Presets
export const classes = {
    card: "bg-card rounded-2xl p-6 shadow-xl",
    cardGlow: "card-glow border-[#D4AF37]/30", // Example specific to this app
    buttonPrimary: "bg-primary hover:bg-primary/80 text-white font-bold py-3 rounded-xl transition-colors",
    sectionTitle: "text-lg font-bold heading-font text-zinc-200 mb-3",
    subText: "text-xs text-zinc-500",
};

// 2. Motion Variants
export const fadeUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
};

export const slideLeft: Variants = {
    hidden: { x: 30, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { duration: 0.3, ease: "easeOut" } },
};

export const scaleTap = {
    tap: { scale: 0.95 },
};

export const scaleHover = {
    hover: { scale: 1.03 },
};

export const staggerList: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
        },
    },
};

export const shimmer: Variants = {
    animate: {
        opacity: [1, 0.6, 1],
        transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
    }
};

export const pulse: Variants = {
    animate: {
        scale: [1, 1.05, 1],
        transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
    }
};

// 3. Component Presets (Motion Props)
export const motionPage = {
    initial: "hidden",
    animate: "visible",
    variants: fadeUp,
    className: "min-h-screen bg-[#0B0E12] text-white p-4 space-y-6 max-w-[400px] mx-auto"
};

export const motionCard = {
    variants: fadeUp,
    whileHover: "hover",
    whileTap: "tap",
    variants_hover: scaleHover.hover, // Custom helper if needed
    variants_tap: scaleTap.tap
};

export const motionList = {
    initial: "hidden",
    animate: "visible",
    variants: staggerList
};

export const motionItem = {
    variants: fadeUp
};
