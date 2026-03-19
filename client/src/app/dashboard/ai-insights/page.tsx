
"use client";

import { useState, useEffect } from 'react';
import { useUserStore } from '@/store/useUserStore';
import { useAIStore } from '@/store/useAIStore';
import {
    Search,
    Brain,
    History,
    Filter,
    Activity,
    TrendingUp,
    ChevronRight,
    Loader2,
    Database,
    Zap,
    MapPin,
    DollarSign,
    Car,
    Heart,
    FileText,
    Home
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn, formatLocation } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function AIInsightsPage() {
    const { currentUser } = useUserStore();
    const { explanationData, isRecommendationLoading, fetchAIExplanation } = useAIStore();
    const [searchUserId, setSearchUserId] = useState('');

    useEffect(() => {
        if (currentUser?.id) {
            setSearchUserId(currentUser.id);
            fetchAIExplanation(currentUser.id);
        }
    }, [currentUser, fetchAIExplanation]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchUserId) {
            fetchAIExplanation(searchUserId);
        }
    };

    const renderStep = (title: string, icon: any, description: string, children: React.ReactNode, delay: number = 0) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="mb-8"
        >
            <Card className="border-border overflow-hidden bg-card/50 backdrop-blur-sm">
                <CardHeader className="bg-muted/10 pb-4 border-b border-border/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            {icon}
                        </div>
                        <div>
                            <CardTitle className="text-xl font-bold tracking-tight">{title}</CardTitle>
                            <CardDescription className="text-muted-foreground/80">{description}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    {children}
                </CardContent>
            </Card>
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-background pb-32">
            {/* Ultra-Premium Header */}
            <div className="bg-[#050505] py-24 relative overflow-hidden border-b border-white/5">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(60,60,255,0.1),transparent_50%)]" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="flex flex-col md:flex-row items-end justify-between gap-12">
                        <div className="flex-1">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-6"
                            >
                                <Zap className="w-3 h-3" /> System Diagnostics v2.0
                            </motion.div>
                            <h1 className="text-6xl md:text-8xl text-white font-black tracking-tighter mb-6 leading-[0.85]">
                                AI LOGIC<br /><span className="text-primary">TRACING.</span>
                            </h1>
                            <p className="text-xl text-white/40 font-medium max-w-2xl leading-relaxed">
                                Decrypting the internal scoring weights and multi-dimensional intent signals
                                driving your personalized HomeCar experience.
                            </p>
                        </div>

                        <form onSubmit={handleSearch} className="flex flex-col gap-4 w-full md:w-auto">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-rose-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                                <div className="relative flex items-center">
                                    <Search className="absolute left-5 h-5 w-5 text-white/20 group-hover:text-white/60 transition-colors" />
                                    <Input
                                        placeholder="Persona ID Trace..."
                                        value={searchUserId}
                                        onChange={(e) => setSearchUserId(e.target.value)}
                                        className="pl-14 bg-[#111] border-white/5 text-white placeholder:text-white/20 h-20 w-80 rounded-2xl text-xl focus:ring-0 focus:border-primary/50 transition-all font-mono"
                                    />
                                </div>
                            </div>
                            <Button variant="default" size="lg" className="rounded-2xl h-16 px-8 font-black text-lg bg-primary hover:bg-primary/90 transition-all shadow-2xl active:scale-95 group" disabled={isRecommendationLoading}>
                                {isRecommendationLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                                    <span className="flex items-center gap-2">EXECUTE TRACE <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></span>
                                )}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20">
                {isRecommendationLoading && !explanationData ? (
                    <div className="flex flex-col items-center justify-center py-60 gap-8">
                        <div className="relative">
                            <div className="absolute -inset-12 bg-primary/20 blur-[100px] rounded-full animate-pulse" />
                            <Loader2 className="h-32 w-32 animate-spin text-primary opacity-20" />
                            <Brain className="h-16 w-16 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                        </div>
                        <div className="space-y-2 text-center">
                            <h2 className="text-3xl font-black text-white tracking-tight uppercase">Scanning Neural Pathway</h2>
                            <p className="text-muted-foreground font-mono text-sm animate-pulse">RECONSTRUCTING WEIGHT MATRICES... OK</p>
                        </div>
                    </div>
                ) : explanationData ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                        {/* LEFT COLUMN: INTENT SIGNALS */}
                        <div className="lg:col-span-8 space-y-8">

                            {/* Dashboard Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { label: 'MAP RADIUS', value: '5.2km', icon: <MapPin />, color: 'text-primary' },
                                    { label: 'TIME DECAY', value: '-14% / day', icon: <History />, color: 'text-rose-500' },
                                    { label: 'INTENT CLARITY', value: 'High', icon: <Activity />, color: 'text-emerald-500' },
                                    { label: 'ALGO REL', value: 'v2.0.4', icon: <Database />, color: 'text-amber-500' },
                                ].map((item, i) => (
                                    <div key={i} className="bg-[#0a0a0a] border border-white/5 p-6 rounded-[2rem] hover:border-white/10 transition-colors group">
                                        <div className={cn("w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform", item.color)}>
                                            {item.icon}
                                        </div>
                                        <p className="text-2xl font-black text-white">{item.value}</p>
                                        <p className="text-[10px] font-black tracking-widest text-white/30 truncate">{item.label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Logic Components - Detailed Breakdown */}
                            {renderStep(
                                "Core Algorithm Logic Roadmap",
                                <Brain className="h-6 w-6 text-primary" />,
                                "Mapping the active logic filters currently refining your candidate property pool.",
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {explanationData.logic_components.map((component: any, i: number) => (
                                            <div key={i} className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl hover:bg-white/[0.04] transition-colors relative overflow-hidden group">
                                                <div className="absolute right-0 top-0 h-full w-1 bg-primary/20 group-hover:bg-primary transition-colors" />
                                                <div className="flex justify-between items-start mb-4">
                                                    <span className="font-black text-white uppercase tracking-wider">{component.name}</span>
                                                    <Badge className={cn(
                                                        "text-[10px] font-black rounded-md",
                                                        component.impact === 'Extreme' ? "bg-rose-500/20 text-rose-500 border-rose-500/30" :
                                                            component.impact === 'High' ? "bg-amber-500/20 text-amber-500 border-amber-500/30" : "bg-emerald-500/20 text-emerald-500 border-emerald-500/30"
                                                    )} variant="outline">
                                                        {component.impact} IMPACT
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-white/40 font-medium leading-relaxed">
                                                    {component.desc}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Step-by-Step Signals */}
                            <Tabs defaultValue="signals" className="w-full">
                                <TabsList className="bg-white/5 border border-white/5 p-1 rounded-2xl h-16 mb-8">
                                    <TabsTrigger value="signals" className="rounded-xl px-12 data-[state=active]:bg-primary h-full font-black text-xs uppercase tracking-widest transition-all">
                                        Intent Signals
                                    </TabsTrigger>
                                    <TabsTrigger value="persona" className="rounded-xl px-12 data-[state=active]:bg-primary h-full font-black text-xs uppercase tracking-widest transition-all">
                                        Sociological Boosts
                                    </TabsTrigger>
                                </TabsList>
                                <TabsContent value="signals">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-[2.5rem]">
                                            <div className="flex items-center gap-4 mb-8">
                                                <div className="p-3 bg-primary/20 rounded-2xl text-primary"><Activity /></div>
                                                <div>
                                                    <h3 className="text-xl font-black text-white">Implicit Interest</h3>
                                                    <p className="text-xs text-white/30 font-bold uppercase tracking-widest">Passively gathered data</p>
                                                </div>
                                            </div>
                                            <div className="space-y-6">
                                                <div className="flex justify-between items-center px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                                                    <span className="text-xs font-black text-white/60">Property Views Detail</span>
                                                    <span className="text-xl font-black text-primary">{explanationData.interaction_signals.views}</span>
                                                </div>
                                                <p className="text-sm text-white/40 italic px-4">
                                                    AI tracks how long you spend looking at specific asset types and subcities, even without "Liking" them.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-[2.5rem]">
                                            <div className="flex items-center gap-4 mb-8">
                                                <div className="p-3 bg-rose-500/20 rounded-2xl text-rose-500"><Heart /></div>
                                                <div>
                                                    <h3 className="text-xl font-black text-white">Explicit Interest</h3>
                                                    <p className="text-xs text-white/30 font-bold uppercase tracking-widest">User-initiated actions</p>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between py-2 border-b border-white/5">
                                                    <span className="text-xs font-bold text-white/60">Favorites</span>
                                                    <span className="font-black text-white">{explanationData.interaction_signals.favorites}</span>
                                                </div>
                                                <div className="flex justify-between py-2 border-b border-white/5">
                                                    <span className="text-xs font-bold text-white/60">Applications</span>
                                                    <span className="font-black text-white">{explanationData.interaction_signals.applications}</span>
                                                </div>
                                                <div className="flex justify-between py-2">
                                                    <span className="text-xs font-bold text-white/60">Confirmed Purchases</span>
                                                    <span className="font-black text-white">{explanationData.interaction_signals.transactions}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>
                                <TabsContent value="persona">
                                    <Card className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[2.5rem]">
                                        <div className="flex items-start gap-8 flex-col md:flex-row">
                                            <div className="w-full md:w-1/3">
                                                <div className="aspect-square bg-gradient-to-br from-primary/40 to-rose-500/40 rounded-[2rem] flex items-center justify-center border border-white/10 relative overflow-hidden">
                                                    <Brain className="w-24 h-24 text-white drop-shadow-2xl z-10" />
                                                    <div className="absolute inset-0 bg-white/5 animate-pulse" />
                                                </div>
                                            </div>
                                            <div className="flex-1 space-y-6">
                                                <div>
                                                    <h3 className="text-3xl font-black text-white mb-2">FAMILY-READY PROFILE</h3>
                                                    <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">Sociological Identification: {explanationData.demographic_profile.marriageStatus || 'Single'}</p>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                                        <span className="text-[10px] font-black text-primary uppercase block mb-1 tracking-tighter">Large Surface Area Boost</span>
                                                        <span className="font-bold text-white">Active (+0.4)</span>
                                                    </div>
                                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                                        <span className="text-[10px] font-black text-rose-500 uppercase block mb-1 tracking-tighter">Bedroom Count Priority</span>
                                                        <span className="font-bold text-white">Active (+0.6)</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </div>

                        {/* RIGHT COLUMN: TRACED RESULTS */}
                        <div className="lg:col-span-4 sticky top-8 self-start">
                            <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/10">
                                <div className="p-8 border-b border-white/5 bg-white/[0.02]">
                                    <h2 className="text-2xl font-black text-white flex items-center gap-3">
                                        <div className="p-2 bg-primary rounded-xl"><Zap className="w-4 h-4 text-black" /></div>
                                        TOP TRACES
                                    </h2>
                                    <p className="text-xs text-white/30 font-bold uppercase tracking-widest mt-2">{explanationData.results.length} PATHS IDENTIFIED</p>
                                </div>
                                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                    <AnimatePresence>
                                        {explanationData.results.map((rec: any, i: number) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                                className="group p-5 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-3xl transition-all cursor-pointer relative"
                                            >
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xs font-black text-white/20 group-hover:text-primary transition-colors">#{i + 1}</span>
                                                        <div>
                                                            <h4 className="text-sm font-black text-white group-hover:text-primary transition-colors truncate w-32">{rec.title}</h4>
                                                            <p className="text-[10px] text-white/30 font-bold uppercase tracking-tighter">{rec.subcity}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-2xl font-black text-white flex items-center justify-end">
                                                            {rec.score?.toFixed(2)}
                                                        </span>
                                                        <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">AI ACCURACY</p>
                                                    </div>
                                                </div>

                                                {/* Score Breakdown Bars - GRANULAR DETAIL */}
                                                <div className="space-y-3 pt-3 border-t border-white/5 group-hover:border-white/10 transition-colors">
                                                    {Object.entries(rec.score_breakdown || {}).map(([key, val]: any) => (
                                                        <div key={key} className="space-y-1">
                                                            <div className="flex justify-between text-[8px] font-black uppercase text-white/40 group-hover:text-white/60 transition-colors">
                                                                <span>{key.replace(/_/g, ' ')}</span>
                                                                <span className="text-primary">+{val}</span>
                                                            </div>
                                                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${Math.min(100, (val / 1) * 100)}%` }}
                                                                    className="h-full bg-primary"
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                                <div className="p-8 bg-white/[0.03] border-t border-white/5">
                                    <div className="flex items-center gap-3 text-xs text-white/40 font-bold uppercase italic">
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        Streaming real-time intent nodes...
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                ) : (
                    <div className="text-center py-60 border border-dashed border-white/10 rounded-[3rem] bg-white/[0.01] backdrop-blur-sm">
                        <div className="relative inline-block mb-12">
                            <div className="absolute -inset-8 bg-primary/20 blur-3xl opacity-50 rounded-full" />
                            <div className="w-24 h-24 bg-[#0a0a0a] border border-white/10 rounded-full flex items-center justify-center mx-auto relative z-10">
                                <Search className="h-10 w-10 text-white/20" />
                            </div>
                        </div>
                        <h3 className="text-5xl font-black tracking-tighter text-white mb-6 uppercase">Awaiting Neural Trace</h3>
                        <p className="text-white/30 font-bold uppercase tracking-[0.3em] text-xs max-w-md mx-auto leading-loose">
                            Initialize the system by providing a valid user persona ID to generate a logic transparency report.
                        </p>
                    </div>
                )}
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
            `}</style>
        </div>
    );
}

// Helper icons
const Settings = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
    </svg>
);
