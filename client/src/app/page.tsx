"use client";

import Link from 'next/link';
import { SearchBar } from '@/components/SearchBar';
import { PropertyCard } from '@/components/PropertyCard';
import { CarCard } from '@/components/CarCard';
import { AIRecommendations } from '@/components/AIRecommendations';
import { mockProperties, mockCars } from '@/data/mockData';
import { ArrowRight, Bot, Shield, Sparkles, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'motion/react';

export default function Home() {
    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section */}
            <div className="relative overflow-hidden pt-24 pb-40 min-h-[700px] flex items-center">
                {/* Background Image with Overlay */}
                <div className="absolute inset-0 overflow-hidden">
                    <div
                        className="w-full h-full bg-cover bg-center transition-transform duration-1000 hover:scale-105"
                        style={{
                            backgroundImage: `url('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=2070')`,
                        }}
                    />
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <motion.div
                        className="text-center mb-16"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                    >
                        <h1 className="text-5xl md:text-7xl mb-6 text-white font-extrabold tracking-tight leading-tight">
                            Find Your <span className="text-primary italic">Perfect</span> Home or Car
                        </h1>
                        <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto font-medium lead-relaxed">
                            The AI-powered platform for renting and purchasing <br className="hidden md:block" /> properties and vehicles with absolute confidence.
                        </p>
                    </motion.div>

                    <SearchBar />

                    {/* Feature Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24">
                        <Card className="border-white/20 bg-white/10 backdrop-blur-md shadow-2xl hover:bg-white/20 transition-all duration-300 group">
                            <CardContent className="p-8 text-center">
                                <div className="bg-primary p-4 rounded-2xl w-fit mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform">
                                    <Bot />
                                </div>
                                <h3 className="mb-3 text-xl font-bold text-white tracking-tight">AI-Powered Matching</h3>
                                <p className="text-white/70 text-sm leading-relaxed font-medium">
                                    Smart recommendations based on your preferences and behavior
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-white/20 bg-white/10 backdrop-blur-md shadow-2xl hover:bg-white/20 transition-all duration-300 group">
                            <CardContent className="p-8 text-center">
                                <div className="bg-secondary p-4 rounded-2xl w-fit mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform">
                                    <TrendingUp className="h-8 w-8 text-white" />
                                </div>
                                <h3 className="mb-3 text-xl font-bold text-white tracking-tight">Price Predictions</h3>
                                <p className="text-white/70 text-sm leading-relaxed font-medium">
                                    AI-powered price predictions to help you make informed decisions
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-white/20 bg-white/10 backdrop-blur-md shadow-2xl hover:bg-white/20 transition-all duration-300 group">
                            <CardContent className="p-8 text-center">
                                <div className="bg-accent p-4 rounded-2xl w-fit mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform">
                                    <Shield className="h-8 w-8 text-white" />
                                </div>
                                <h3 className="mb-3 text-xl font-bold text-white tracking-tight">Verified Listings</h3>
                                <p className="text-white/70 text-sm leading-relaxed font-medium">
                                    Safe and verified listings with trusted owners and agents
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* AI Recommendations */}
            <section className="border-b border-border">
                <AIRecommendations type="property" title="Recommended Properties for You" />
            </section>

            {/* Featured Properties */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-3xl text-foreground mb-2">Featured Homes</h2>
                        <p className="text-muted-foreground">Handpicked Homes just for you</p>
                    </div>
                    <Link href="/listings">
                        <Button variant="outline" className="group">
                            View All
                            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {mockProperties.map((property) => (
                        <PropertyCard key={property.id} property={property} />
                    ))}
                </div>
            </div>

            {/* Featured Cars */}
            <div className="bg-muted/30 py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-3xl text-foreground mb-2">Featured Cars</h2>
                            <p className="text-muted-foreground">Premium vehicles available now</p>
                        </div>
                        <Link href="/listings">
                            <Button variant="outline" className="group">
                                View All
                                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {mockCars.map((car) => (
                            <CarCard key={car.id} car={car} />
                        ))}
                    </div>
                </div>
            </div>


            {/* CTA Section */}
            <div className="bg-gradient-to-br from-primary via-primary to-secondary py-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-4xl mb-4 text-white">Ready to Get Started?</h2>
                    <p className="text-xl text-white/90 mb-8">
                        Join thousands of satisfied customers who found their perfect property or vehicle
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/dashboard/add-property">
                            <Button size="lg" variant="secondary" className="bg-white hover:bg-white/90 text-primary">
                                List Your Property
                            </Button>
                        </Link>
                        <Link href="/listings">
                            <Button size="lg" variant="outline" className="border-white text-primary hover:bg-white/10">
                                Browse Listings
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
