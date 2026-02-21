import { Target, Eye, Users, ShieldCheck, Zap, Globe, BrainCircuit } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
    return (
        <div className="min-h-screen pt-24 pb-16">
            {/* Hero Section */}
            <section className="relative overflow-hidden mb-20 py-20 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
                <div className="absolute inset-0 bg-grid-slate-900/[0.04] bg-[size:40px_40px] [mask-image:linear-gradient(to_bottom,white,transparent)]" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center max-w-3xl mx-auto">
                        <h1 className="text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl mb-6">
                            The Future of <span className="text-primary">Home</span> & <span className="text-secondary">Car</span> Transactions
                        </h1>
                        <p className="text-xl text-muted-foreground leading-relaxed mb-8">
                            HomeCar is an AI-powered marketplace transforming how people rent, buy, and sell
                            properties and vehicles. We combine intelligent recommendations, predictive analytics,
                            and secure digital workflows to make high-value transactions simple, transparent, and fast.
                        </p>
                        <div className="flex justify-center gap-4">
                            <Link
                                href="/listings"
                                className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                            >
                                Explore Listings
                            </Link>
                            <Link
                                href="/signup"
                                className="px-8 py-3 bg-secondary/10 text-secondary rounded-xl font-semibold hover:bg-secondary/20 transition-all"
                            >
                                Join the Platform
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Mission & Vision */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-32">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="p-8 rounded-3xl bg-card border border-border/50 hover:border-primary/30 transition-all group">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Target className="h-6 w-6 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            To simplify and modernize the process of renting and purchasing homes and vehicles
                            through AI-driven decision support, automated verification, and intelligent matching
                            between buyers, renters, and sellers.
                        </p>
                    </div>

                    <div className="p-8 rounded-3xl bg-card border border-border/50 hover:border-secondary/30 transition-all group">
                        <div className="h-12 w-12 rounded-2xl bg-secondary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Eye className="h-6 w-6 text-secondary" />
                        </div>
                        <h2 className="text-2xl font-bold mb-4">Our Vision</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            To build a unified digital ecosystem where real estate and automotive
                            transactions are powered by intelligence, trust, and automation —
                            making ownership and mobility accessible to everyone.
                        </p>
                    </div>
                </div>
            </section>

            {/* AI Capabilities */}
            <section className="bg-primary py-24 mb-32 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center text-primary-foreground mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-medium mb-6 animate-pulse">
                            <BrainCircuit className="h-4 w-4" />
                            <span>Advanced AI Core</span>
                        </div>
                        <h2 className="text-4xl font-bold mb-6">Engineered for Intelligence</h2>
                        <p className="text-primary-foreground/80 text-lg max-w-2xl mx-auto leading-relaxed">
                            Our proprietary AI infrastructure transforms raw market data into actionable intelligence,
                            creating a seamless experience for every stage of the transaction lifecycle.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            {
                                title: "Smart Matching",
                                desc: "Neural networks that understand your specific search intent and lifestyle needs.",
                                icon: BrainCircuit,
                                label: "Intelligence"
                            },
                            {
                                title: "Predictive Insights",
                                desc: "Advanced analytics providing real-time pricing trends and future value forecasts.",
                                icon: Zap,
                                label: "Analytics"
                            },
                            {
                                title: "Risk Mitigation",
                                desc: "Automated identity verification and fraud detection for absolute peace of mind.",
                                icon: ShieldCheck,
                                label: "Security"
                            },
                            {
                                title: "Digital Precision",
                                desc: "Streamlined digital workflows that eliminate manual friction and paperwork.",
                                icon: Target,
                                label: "Operations"
                            }
                        ].map((item, idx) => (
                            <div key={idx} className="p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-all group backdrop-blur-sm cursor-default">
                                <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:scale-110 transition-all">
                                    <item.icon className="h-6 w-6 text-white" />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-3 block">{item.label}</span>
                                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                                <p className="text-white/60 text-sm leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Core Values */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-32 text-center">
                <h2 className="text-3xl font-bold mb-16 underline decoration-primary/30 underline-offset-8">
                    What We Stand For
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[
                        { icon: ShieldCheck, title: "Trust & Security", desc: "Secure identity verification and safe transactions." },
                        { icon: Zap, title: "Efficiency", desc: "Fast search, smart filtering, instant insights." },
                        { icon: Users, title: "User-Centric Design", desc: "Built around real user needs and behavior." },
                        { icon: Globe, title: "Scalable Vision", desc: "Designed to grow across markets and regions." },
                    ].map((item, idx) => (
                        <div key={idx} className="flex flex-col items-center p-6 bg-background rounded-2xl border border-border/30 hover:shadow-xl transition-shadow">
                            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-6">
                                <item.icon className="h-7 w-7 text-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                            <p className="text-muted-foreground text-sm">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <div className="bg-secondary/5 border border-secondary/20 rounded-[40px] p-12 md:p-20 overflow-hidden relative">
                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">
                            Smarter Renting. Smarter Buying.
                        </h2>
                        <p className="text-muted-foreground mb-10 text-lg">
                            Join the next generation marketplace powered by artificial intelligence.
                        </p>
                        <Link
                            href="/signup"
                            className="px-10 py-4 bg-foreground text-background rounded-full font-bold hover:scale-105 transition-transform inline-block"
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
