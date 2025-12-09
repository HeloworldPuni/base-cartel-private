"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function WelcomePage() {
    const router = useRouter();

    useEffect(() => {
        const timer = setTimeout(() => {
            router.push("/dashboard");
        }, 2500);
        return () => clearTimeout(timer);
    }, [router]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#0B0E12] text-white overflow-hidden relative">
            {/* Background Texture (Subtle Hat Pattern) */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex flex-wrap gap-12 justify-center items-center overflow-hidden">
                {Array.from({ length: 20 }).map((_, i) => (
                    <span key={i} className="text-9xl">🎩</span>
                ))}
            </div>

            {/* Content Container */}
            <div className="z-10 flex flex-col items-center gap-6">

                {/* 1. Animated Logo (Scales Up & Fades In) */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="relative"
                >
                    {/* Glowing Fedora SVG */}
                    <div className="relative w-32 h-32 md:w-40 md:h-40">
                        {/* Glow Layer */}
                        <div className="absolute inset-0 bg-neon-blue blur-[60px] opacity-60 rounded-full animate-pulse"></div>

                        <svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full relative z-10 drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]">
                            <path d="M464 256H48V464H464V256Z" fill="none" />
                            <path d="M123.6 235.8L128 128C128 92.65 156.7 64 192 64H320C355.3 64 384 92.65 384 128V235.8C427.6 242.4 464 278.4 464 324V384H48V324C48 278.4 84.41 242.4 123.6 235.8ZM256 160C256 160 278.9 199.1 278.9 224H233.1C233.1 199.1 256 160 256 160Z"
                                fill="#0B0E12"
                                stroke="#3B82F6"
                                strokeWidth="12"
                                strokeLinejoin="round"
                            />
                            <path d="M128 288H384" stroke="#FFD700" strokeWidth="8" strokeLinecap="round" />
                        </svg>
                    </div>
                </motion.div>

                {/* 2. App Title (Slides Up) */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className="text-4xl md:text-6xl font-black heading-font tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-400 drop-shadow-xl text-center"
                >
                    BASE CARTEL
                </motion.h1>

                {/* 3. Tagline (Fades In with Glow) */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.0, duration: 0.8 }}
                    className="text-sm md:text-lg font-bold tracking-[0.3em] text-[#FFD700] uppercase glow-gold"
                >
                    Rule The Chain
                </motion.p>
            </div>
        </div>
    );
}
