"use client";

import { useState, useEffect } from "react";
import { Swords, Users, Bot, Crown, ArrowRight, Menu, X } from "lucide-react";

export default function FullLandingPage() {
    const [scrollY, setScrollY] = useState(0);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [visibleSections, setVisibleSections] = useState(new Set());
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setVisibleSections((prev) => new Set([...prev, entry.target.id]));
                    }
                });
            },
            { threshold: 0.1, rootMargin: "0px 0px -100px 0px" },
        );

        const sections = document.querySelectorAll("[data-scroll-section]");
        sections.forEach((section) => observer.observe(section));

        return () => observer.disconnect();
    }, []);

    const features = [
        {
            icon: Swords,
            title: "Raid Rivals",
            description: "Steal shares and burn enemies in PVP attacks.",
            gradient: "from-blue-500 to-cyan-500",
        },
        {
            icon: Users,
            title: "Build Your Clan",
            description: "Recruit members and earn referral bonuses.",
            gradient: "from-indigo-500 to-violet-500",
        },
        {
            icon: Bot,
            title: "Automate",
            description: "Deploy Autonomous Agents (x402) to work 24/7.",
            gradient: "from-blue-500 to-cyan-500",
        },
        {
            icon: Crown,
            title: "Rank Up",
            description: "Climb the leaderboard and control the daily pot.",
            gradient: "from-sky-500 to-blue-600",
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
            icon: "💰",
        },
    ];



    const parallaxY = scrollY * 0.5;
    const heroOpacity = Math.max(0, 1 - scrollY / 600);
    const heroScale = Math.max(0.8, 1 - scrollY / 2000);

    return (
        <div className="min-h-screen bg-black text-white overflow-x-hidden">
            {/* Navigation */}
            <nav
                className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
                style={{
                    backgroundColor: scrollY > 50 ? "rgba(0, 0, 0, 0.95)" : "transparent",
                    backdropFilter: scrollY > 50 ? "blur(10px)" : "none",
                    borderBottom:
                        scrollY > 50 ? "1px solid rgba(255, 255, 255, 0.1)" : "none",
                }}
            >
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <img
                            src="https://raw.createusercontent.com/e124f442-2805-4811-86dd-03e89202dfc9/"
                            alt="Base Cartel Logo"
                            className="w-10 h-10 hue-rotate-180"
                        />
                        <span className="text-xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                            BASE CARTEL
                        </span>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        <a
                            href="#features"
                            className="text-gray-300 hover:text-white transition-colors"
                        >
                            Features
                        </a>
                        <a
                            href="#how-it-works"
                            className="text-gray-300 hover:text-white transition-colors"
                        >
                            How It Works
                        </a>
                        <a
                            href="#interface"
                            className="text-gray-300 hover:text-white transition-colors"
                        >
                            Interface
                        </a>
                        <a
                            href="/dashboard"
                            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all"
                            aria-label="Open App Dashboard"
                        >
                            Open App
                        </a>
                    </div>

                    <button
                        className="md:hidden text-white"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle Menu"
                    >
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden bg-black border-t border-white/10">
                        <div className="px-6 py-4 flex flex-col gap-4">
                            <a
                                href="#features"
                                className="text-gray-300 hover:text-white transition-colors"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Features
                            </a>
                            <a
                                href="#how-it-works"
                                className="text-gray-300 hover:text-white transition-colors"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                How It Works
                            </a>
                            <a
                                href="#interface"
                                className="text-gray-300 hover:text-white transition-colors"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Interface
                            </a>
                            <a
                                href="/dashboard"
                                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg font-semibold text-center"
                            >
                                Open App
                            </a>
                        </div>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <section className="relative min-h-screen flex flex-col items-center justify-start pt-40 md:justify-center md:pt-0 px-6 overflow-hidden">
                {/* Animated Background */}
                <div
                    className="absolute inset-0 opacity-30"
                    style={{ transform: `translateY(${parallaxY}px)` }}
                >
                    <div
                        className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"
                        style={{ animationDuration: "4s" }}
                    ></div>
                    <div
                        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"
                        style={{ animationDuration: "6s" }}
                    ></div>
                </div>

                <div
                    className="relative z-10 max-w-5xl mx-auto text-center"
                    style={{
                        opacity: heroOpacity,
                        transform: `scale(${heroScale})`,
                    }}
                >
                    <div className="mb-8 animate-float">
                        <img
                            src="https://raw.createusercontent.com/e124f442-2805-4811-86dd-03e89202dfc9/"
                            alt="Base Cartel Logo"
                            className="w-32 h-32 mx-auto hue-rotate-180"
                        />
                    </div>

                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight">
                        <span className="bg-gradient-to-r from-blue-500 via-cyan-500 to-sky-500 bg-clip-text text-transparent">
                            RULE THE CHAIN
                        </span>
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto">
                        A social onchain cartel game built on Base.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <a
                            href="/dashboard"
                            className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-blue-500/50 transition-all flex items-center gap-2"
                        >
                            OPEN APP
                            <ArrowRight
                                className="group-hover:translate-x-1 transition-transform"
                                size={20}
                            />
                        </a>
                        <a
                            href="#how-it-works"
                            className="px-8 py-4 border-2 border-white/20 rounded-xl font-bold text-lg hover:bg-white/5 transition-all"
                        >
                            Learn More
                        </a>
                    </div>

                    <div className="mt-16 text-gray-500">
                        <p className="text-sm mb-2">Scroll to Explore</p>
                        <div className="w-6 h-10 border-2 border-gray-500 rounded-full mx-auto flex justify-center">
                            <div className="w-1 h-3 bg-gray-500 rounded-full mt-2 animate-bounce"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section
                id="features"
                className="py-24 px-6 relative"
                data-scroll-section
            >
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className={`group relative bg-gradient-to-b from-white/5 to-white/0 border border-white/10 rounded-2xl p-8 hover:border-white/30 transition-all duration-500 hover:scale-105 ${visibleSections.has("features")
                                    ? "animate-slide-up"
                                    : "opacity-0"
                                    }`}
                                style={{
                                    animationDelay: `${index * 100}ms`,
                                    animationFillMode: "forwards",
                                }}
                            >
                                <div
                                    className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform`}
                                >
                                    <feature.icon size={32} className="text-white" />
                                </div>
                                <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                                <p className="text-gray-400">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Quote Section */}
            <section className="py-24 px-6" data-scroll-section id="quote">
                <div
                    className={`max-w-4xl mx-auto text-center transition-all duration-1000 ${visibleSections.has("quote")
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-10"
                        }`}
                >
                    <p
                        className="text-4xl md:text-5xl font-bold italic text-gray-300"
                        style={{
                            textShadow:
                                "0 0 20px rgba(59, 130, 246, 0.8), 0 0 40px rgba(6, 182, 212, 0.6), 0 0 60px rgba(59, 130, 246, 0.4)",
                        }}
                    >
                        &quot;Plata o Plomo.&quot;
                    </p>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="py-24 px-6" data-scroll-section>
                <div className="max-w-7xl mx-auto">
                    <h2
                        className={`text-4xl md:text-5xl font-bold text-center mb-16 transition-all duration-700 ${visibleSections.has("how-it-works")
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 translate-y-10"
                            }`}
                    >
                        <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                            HOW IT WORKS
                        </span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {steps.map((step, index) => (
                            <div key={index} className="relative">
                                <div
                                    className={`bg-gradient-to-b from-white/10 to-white/0 border border-white/10 rounded-2xl p-8 hover:border-white/30 transition-all duration-500 hover:scale-105 ${visibleSections.has("how-it-works")
                                        ? "animate-slide-up"
                                        : "opacity-0"
                                        }`}
                                    style={{
                                        animationDelay: `${(index + 1) * 150}ms`,
                                        animationFillMode: "forwards",
                                    }}
                                >
                                    <div className="text-6xl mb-6 transform transition-transform duration-300 hover:scale-110">
                                        {typeof step.icon === "string" ? (
                                            step.icon
                                        ) : (
                                            <step.icon size={48} className="text-blue-500" />
                                        )}
                                    </div>
                                    <div className="text-5xl font-bold text-white/20 mb-4">
                                        {step.number}
                                    </div>
                                    <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                                    <p className="text-gray-400">{step.description}</p>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                                        <ArrowRight
                                            className="text-blue-500 animate-pulse"
                                            size={32}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Interface Section */}
            <section
                id="interface"
                className="py-24 px-6 bg-gradient-to-b from-black to-blue-950/10"
                data-scroll-section
            >
                <div className="max-w-7xl mx-auto">
                    <div
                        className={`text-center mb-16 transition-all duration-700 ${visibleSections.has("interface")
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 translate-y-10"
                            }`}
                    >
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">
                            <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                                Interface
                            </span>
                        </h2>
                        <p className="text-xl text-gray-400">PROVEN GAME LOOP</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {[
                            { title: "Dashboard", image: "/img/dashboard_preview.png" },
                            { title: "Quest Screen", image: "/img/raid_preview.png" },
                            { title: "Leaderboard", image: "/img/clan_preview.png" },
                            { title: "Profile", image: "/img/earnings_preview.png" },
                        ].map((preview, index) => (
                            <div
                                key={index}
                                className={`group relative bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/30 transition-all duration-500 hover:scale-105 cursor-pointer ${visibleSections.has("interface")
                                    ? "animate-slide-up"
                                    : "opacity-0"
                                    }`}
                                style={{
                                    animationDelay: `${index * 150}ms`,
                                    animationFillMode: "forwards",
                                }}
                                onClick={() => setSelectedImage(preview.image)}
                            >
                                <div className="aspect-video w-full bg-gradient-to-br from-blue-950/20 to-cyan-950/20 flex items-center justify-center overflow-hidden relative">
                                    <img
                                        src={preview.image}
                                        alt={preview.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        onError={(e) => {
                                            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                            // @ts-ignore
                                            e.target.style.display = "none";
                                            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                            // @ts-ignore
                                            e.target.parentElement.innerHTML = `<div class="text-gray-500 text-lg">${preview.title} Preview</div>`;
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                                        <span className="text-white font-bold border-2 border-white px-4 py-2 rounded-full">
                                            VIEW FULL SIZE
                                        </span>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <h3 className="text-xl font-bold">{preview.title}</h3>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Lightbox Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors"
                        onClick={() => setSelectedImage(null)}
                        aria-label="Close Preview"
                    >
                        <X size={40} />
                    </button>
                    <img
                        src={selectedImage}
                        alt="Full size preview"
                        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

            {/* CTA Section */}
            <section className="py-24 px-6" data-scroll-section id="cta">
                <div
                    className={`max-w-4xl mx-auto text-center transition-all duration-700 ${visibleSections.has("cta")
                        ? "opacity-100 scale-100"
                        : "opacity-0 scale-95"
                        }`}
                >
                    <h2 className="text-4xl md:text-5xl font-bold mb-8">
                        Ready to Rule the Chain?
                    </h2>
                    <p className="text-xl text-gray-400 mb-12">
                        Join the cartel, raid rivals, and earn daily dividends.
                    </p>
                    <a
                        href="/dashboard"
                        className="inline-flex items-center gap-2 px-10 py-5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl font-bold text-xl hover:shadow-2xl hover:shadow-blue-500/50 transition-all group hover:scale-105"
                    >
                        JOIN THE CARTEL
                        <ArrowRight
                            className="group-hover:translate-x-1 transition-transform"
                            size={24}
                        />
                    </a>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/10 py-8 px-6">
                <div className="max-w-7xl mx-auto text-center text-gray-500">
                    <p>Base Cartel - Rule The Chain</p>
                </div>
            </footer>

            <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.8s ease-out;
        }

        * {
          scroll-behavior: smooth;
        }
      `}</style>
        </div>
    );
}
