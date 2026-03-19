"use client";

import { useEffect } from 'react';
import { PropertyCard } from '@/components/PropertyCard';
import { CarCard } from '@/components/CarCard';
import { useAIStore } from '@/store/useAIStore';
import { useUserStore } from '@/store/useUserStore';
import { Loader2, Sparkles, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { motion } from 'motion/react';

export default function RecommendationsPage() {
    const { currentUser } = useUserStore();
    const { recommendations, fetchRecommendations, isRecommendationLoading } = useAIStore();

    useEffect(() => {
        fetchRecommendations(currentUser?.id || '');
    }, [currentUser?.id, fetchRecommendations]);

    return (
        <div className="min-h-screen bg-slate-50 pt-16 pb-16">
            {/* Dynamic Background Elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -mr-64 -mt-64" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-3xl -ml-64 -mb-64" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight">
                                Your <span className="text-primary italic">Exclusive</span> Matches
                            </h1>
                            <p className="text-muted-foreground mt-4 text-lg max-w-2xl font-medium">
                                We've analyzed thousands of listings to find the ones that perfectly match your lifestyle and preferences.
                            </p>
                        </div>
                    </div>
                </div>

                {isRecommendationLoading ? (
                    <div className="py-32 flex flex-col items-center justify-center space-y-6">
                        <div className="relative">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-foreground">Analyzing your preferences...</h3>
                            <p className="text-muted-foreground">Synthetically matching properties based on your unique behavior.</p>
                        </div>
                    </div>
                ) : recommendations.length > 0 ? (
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        {recommendations.map((item: any) => (
                            <div key={item.propertyId} className="h-full">
                                {item.assetType === 'HOME'
                                    ? <PropertyCard property={item} />
                                    : <CarCard car={item} />
                                }
                            </div>
                        ))}
                    </motion.div>
                ) : (
                    <div className="text-center py-24 bg-white rounded-[2.5rem] shadow-sm border border-border/60">
                        <div className="h-24 w-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                            <Sparkles className="h-12 w-12 text-muted-foreground/30" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3">No Personalized Matches Yet</h3>
                        <p className="text-muted-foreground max-w-md mx-auto mb-8 font-medium">
                            Start browsing and interacting with properties to help the AI learn what you love!
                        </p>
                        <Link href="/search">
                            <Button size="lg" className="rounded-2xl px-10 font-black h-14">Start Exploring</Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
