"use client";

import React from "react";
import { Swords, Users, Bot, Crown, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MobileLandingPage() {
    const features = [
        {
            icon: Swords,
            title: "Raid Rivals",
            description: "Steal shares and burn enemies in PVP attacks.",
            colors: "from-blue-500 to-cyan-500",
        },
        {
            icon: Users,
            title: "Build Your Clan",
            description: "Recruit members and earn referral bonuses.",
            colors: "from-indigo-500 to-violet-500",
        },
        {
            icon: Bot,
            title: "Automate",
            description: "Deploy Autonomous Agents (x402) to work 24/7.",
            colors: "from-blue-600 to-sky-500",
        },
        {
            icon: Crown,
            title: "Rank Up",
            description: "Climb the leaderboard and control the daily pot.",
            colors: "from-sky-500 to-blue-400",
        },
    ];

    const steps = [
        {
            number: "01",
            title: "Join Cartel",
            description: "Mint 100 shares to enter the game.",
            icon: Crown,
        },
        {
            number: "02",
            title: "Raid & Betray",
            description: "Attack players to steal their cut.",
            icon: Swords,
        },
        {
            number: "03",
            title: "Earn Dividends",
            description: "Claim daily profit from the pot.",
            emoji: "💰",
        },
    ];

    return (
        <div className="min-h-screen bg-black text-white pb-10">
            {/* Hero Section */}
            <div className="pt-12 px-6 pb-16">
                {/* Logo */}
                <div className="flex justify-center mb-10">
                    <img
                        src="https://raw.createusercontent.com/e124f442-2805-4811-86dd-03e89202dfc9/"
                        alt="Logo"
                        className="w-24 h-24 hue-rotate-180" // Blue Hat
                    />
                </div>

                {/* Title */}
                <h1 className="text-5xl font-bold text-center mb-4 leading-tight">
                    <span className="text-blue-500">RULE </span>
                    <span className="text-cyan-500">THE </span>
                    <span className="text-sky-500">CHAIN</span>
                </h1>

                <p className="text-lg text-gray-300 text-center mb-10 leading-relaxed">
                    A social onchain cartel game built on Base.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col gap-3">
                    <Link href="/login" className="w-full">
                        <div className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 py-4 px-8 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-transform">
                            <span className="text-white text-lg font-bold">OPEN APP</span>
                            <ArrowRight className="text-white" size={20} />
                        </div>
                    </Link>

                    <button className="w-full border-2 border-white/20 py-4 px-8 rounded-xl active:bg-white/5 transition-colors">
                        <span className="text-white text-lg font-bold">Learn More</span>
                    </button>
                </div>
            </div>

            {/* Features Section */}
            <div className="px-6 pb-16">
                <div className="flex flex-col gap-4">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="bg-white/5 border border-white/10 rounded-2xl p-6"
                        >
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br ${feature.colors}`}>
                                <feature.icon className="text-white" size={28} />
                            </div>
                            <h3 className="text-white text-2xl font-bold mb-2">
                                {feature.title}
                            </h3>
                            <p className="text-gray-400 text-base leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quote Section */}
            <div className="px-6 pb-16">
                <p className="text-3xl font-bold italic text-gray-300 text-center" style={{ textShadow: "0 0 20px rgba(59, 130, 246, 0.8)" }}>
                    "Plata o Plomo."
                </p>
            </div>

            {/* How It Works Section */}
            <div className="px-6 pb-16">
                <h2 className="text-4xl font-bold text-center mb-10">
                    <span className="text-blue-500">HOW IT </span>
                    <span className="text-cyan-500">WORKS</span>
                </h2>

                <div className="flex flex-col gap-4">
                    {steps.map((step, index) => (
                        <div
                            key={index}
                            className="bg-white/5 border border-white/10 rounded-2xl p-6"
                        >
                            <div className="mb-4">
                                {step.emoji ? (
                                    <span className="text-5xl">{step.emoji}</span>
                                ) : (
                                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                    // @ts-ignore
                                    <step.icon className="text-blue-500" size={48} />
                                )}
                            </div>
                            <div className="text-5xl font-bold text-white/20 mb-3">
                                {step.number}
                            </div>
                            <h3 className="text-white text-2xl font-bold mb-2">
                                {step.title}
                            </h3>
                            <p className="text-gray-400 text-base leading-relaxed">
                                {step.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Interface Section */}
            <div className="px-6 pb-16">
                <h2 className="text-4xl font-bold text-center mb-2">
                    <span className="text-blue-500">INTER</span>
                    <span className="text-cyan-500">FACE</span>
                </h2>
                <p className="text-lg text-gray-400 text-center mb-8">
                    PROVEN GAME LOOP
                </p>

                {[
                    { title: "Dashboard", image: "/img/dashboard_preview.png" },
                    { title: "Raid Screen", image: "/img/raid_preview.png" },
                    { title: "Clan", image: "/img/clan_preview.png" },
                    { title: "Earnings", image: "/img/earnings_preview.png" },
                ].map((preview, index) => (
                    <div
                        key={index}
                        className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-lg"
                    >
                        <div className="w-full aspect-video bg-blue-900/20">
                            <img
                                src={preview.image}
                                alt={`${preview.title} Preview`}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="p-4">
                            <h3 className="text-white text-lg font-bold">
                                {preview.title}
                            </h3>
                        </div>
                    </div>
                ))}
            </div>


            {/* Final CTA Section */}
            <div className="px-6 pb-16 text-center">
                <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
                    Ready to Rule the Chain?
                </h2>
                <p className="text-lg text-gray-400 mb-8 leading-relaxed">
                    Join the cartel, raid rivals, and earn daily dividends.
                </p>

                <Link href="/login" className="w-full">
                    <div className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 py-5 px-8 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-transform">
                        <span className="text-white text-xl font-bold">JOIN THE CARTEL</span>
                        <ArrowRight className="text-white" size={24} />
                    </div>
                </Link>
            </div>

            {/* Footer */}
            <div className="border-t border-white/10 py-8 px-6">
                <p className="text-gray-500 text-center">
                    Base Cartel - Rule The Chain
                </p>
            </div>
        </div >
    );
}
