"use client";

import { motion, Variants } from "framer-motion";

const hatVariants: Variants = {
    initial: { y: 0, opacity: 0 },
    animate: {
        y: [0, -10, 0],
        opacity: 1,
        transition: {
            duration: 1.2,
            repeat: Infinity,
            ease: "easeInOut",
        },
    },
};

const textVariants: Variants = {
    initial: { opacity: 0 },
    animate: {
        opacity: [0.4, 1, 0.4],
        transition: {
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
        },
    },
};

export default function LoadingScreen() {
    return (
        className = "text-base font-medium text-blue-400 tracking-wide"
        >
        Loading Cartel Data…
            </motion.div >
        </div >
    );
}
