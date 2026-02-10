"use client";

import Link from 'next/link';
import { SearchBar } from '@/components/SearchBar';
import { PropertyCard } from '@/components/PropertyCard';
import { CarCard } from '@/components/CarCard';
import { AIRecommendations } from '@/components/AIRecommendations';
import { mockProperties, mockCars } from '@/data/mockData';
import { ArrowRight, Shield, Sparkles, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'motion/react';

export default function Home() {
    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section */}
            <div className="relative overflow-hidden pt-20 pb-32 min-h-[600px] flex items-center">
                {/* Background Image */}
                <div className="absolute inset-0 overflow-hidden">
                    <div
                        className="w-full h-full bg-cover bg-center"
                        style={{
                            backgroundImage: `url('/homecar.png')`,
                        }}
                    />
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <motion.div
                        className="text-center mb-12"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h1 className="text-5xl md:text-6xl mb-4 text-black">
                            Find Your Perfect Home or Car
                        </h1>
                        <p className="text-xl text-black max-w-3xl mx-auto">
                            AI-powered platform for renting and purchasing properties and vehicles with confidence
                        </p>
                    </motion.div>

                    <SearchBar />

                    {/* Feature Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
                        <Card className="border-border bg-white/80 backdrop-blur">
                            <CardContent className="p-6 text-center">
                                <div className="bg-primary/10 p-3 rounded-lg w-fit mx-auto mb-4">
                                    <Sparkles className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="mb-2 text-foreground">AI-Powered Matching</h3>
                                <p className="text-muted-foreground">
                                    Smart recommendations based on your preferences and behavior
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-border bg-white/80 backdrop-blur">
                            <CardContent className="p-6 text-center">
                                <div className="bg-secondary/10 p-3 rounded-lg w-fit mx-auto mb-4">
                                    <TrendingUp className="h-8 w-8 text-secondary" />
                                </div>
                                <h3 className="mb-2 text-foreground">Price Predictions</h3>
                                <p className="text-muted-foreground">
                                    AI-powered price predictions to help you make informed decisions
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-border bg-white/80 backdrop-blur">
                            <CardContent className="p-6 text-center">
                                <div className="bg-accent/10 p-3 rounded-lg w-fit mx-auto mb-4">
                                    <Shield className="h-8 w-8 text-accent" />
                                </div>
                                <h3 className="mb-2 text-foreground">Verified Listings</h3>
                                <p className="text-muted-foreground">
                                    Safe and verified listings with trusted owners and agents
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

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

            {/* AI Recommendations */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <AIRecommendations type="property" title="Recommended Properties for You" />
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
