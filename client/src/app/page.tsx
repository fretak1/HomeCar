"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SearchBar } from '@/components/SearchBar';
import { PropertyCard } from '@/components/PropertyCard';
import { CarCard } from '@/components/CarCard';
import { AIRecommendations } from '@/components/AIRecommendations';
import { usePropertyStore } from '@/store/usePropertyStore';
import {
    Home as HomeIcon,
    Car as CarIcon,
    ArrowRight,
    Bot,
    Shield,
    TrendingUp,
    Loader2,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'motion/react';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
    type CarouselApi
} from "@/components/ui/carousel";

export default function Home() {
    const { properties, fetchProperties, isLoading } = usePropertyStore();
    const [homesApi, setHomesApi] = useState<CarouselApi>();
    const [carsApi, setCarsApi] = useState<CarouselApi>();

    useEffect(() => {
        fetchProperties();
    }, [fetchProperties]);

    // Auto-slide logic for Homes
    useEffect(() => {
        if (!homesApi) return;
        const interval = setInterval(() => {
            homesApi.scrollNext();
        }, 5000);
        return () => clearInterval(interval);
    }, [homesApi]);

    // Auto-slide logic for Cars
    useEffect(() => {
        if (!carsApi) return;
        const interval = setInterval(() => {
            carsApi.scrollNext();
        }, 5000);
        return () => clearInterval(interval);
    }, [carsApi]);

    // Filtering logic for "Featured" sections (Properties created in the last 10 days)
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    const featuredHomes = properties.filter(p =>
        p.assetType === 'HOME' &&
        new Date(p.createdAt) >= tenDaysAgo
    ).slice(0, 9); // Limit to 9 for slider

    const featuredCars = properties.filter(p =>
        p.assetType === 'CAR' &&
        new Date(p.createdAt) >= tenDaysAgo
    ).slice(0, 9); // Limit to 9 for slider

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
                            Find Your Perfect Home or Car
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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h2 className="text-4xl font-black text-foreground tracking-tight">Featured <span className="text-primary italic">Homes</span></h2>
                        <p className="text-muted-foreground text-lg mt-2">Discover our most exceptional residential listings</p>
                    </div>
                    <Link href="/listings">
                        <Button variant="ghost" className="group font-bold hover:bg-primary/5 hover:text-primary rounded-xl px-6">
                            View All Homes
                            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-24">
                        <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
                    </div>
                ) : featuredHomes.length > 0 ? (
                    featuredHomes.length > 3 ? (
                        <Carousel
                            setApi={setHomesApi}
                            opts={{
                                align: "start",
                                loop: true,
                            }}
                            className="w-full"
                        >
                            <CarouselContent className="-ml-6">
                                {featuredHomes.map((property) => (
                                    <CarouselItem key={property.id} className="pl-6 md:basis-1/2 lg:basis-1/3">
                                        <PropertyCard property={property} />
                                    </CarouselItem>
                                ))}
                            </CarouselContent>

                        </Carousel>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {featuredHomes.map((property) => (
                                <PropertyCard key={property.id} property={property} />
                            ))}
                        </div>
                    )
                ) : (
                    <div className="text-center py-24 bg-muted/20 rounded-[2.5rem] border border-dashed border-border/60 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative z-10">
                            <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                                <HomeIcon className="h-10 w-10 text-muted-foreground/40" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">No New Properties Yet</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto">We're constantly adding new verified homes. Check back soon or explore our existing listings.</p>
                            <Link href="/listings" className="mt-8 inline-block">
                                <Button className="rounded-2xl px-10 font-black tracking-tight h-12">Browse All Properties</Button>
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            {/* Featured Cars Section */}
            <div className="bg-muted/30 py-24 border-y border-border/40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-end mb-12">
                        <div>

                            <h2 className="text-4xl font-black text-foreground tracking-tight">Featured <span className="text-primary italic">Cars</span></h2>
                            <p className="text-muted-foreground text-lg mt-2">Premium curated vehicles for performance and style</p>
                        </div>
                        <Link href="/listings">
                            <Button variant="ghost" className="group font-bold hover:bg-primary/5 hover:text-primary rounded-xl px-6">
                                View All Cars
                                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-24">
                            <Loader2 className="h-12 w-12 animate-spin text-secondary opacity-20" />
                        </div>
                    ) : featuredCars.length > 0 ? (
                        featuredCars.length > 3 ? (
                            <Carousel
                                setApi={setCarsApi}
                                opts={{
                                    align: "start",
                                    loop: true,
                                }}
                                className="w-full"
                            >
                                <CarouselContent className="-ml-6">
                                    {featuredCars.map((car) => (
                                        <CarouselItem key={car.id} className="pl-6 md:basis-1/2 lg:basis-1/3">
                                            <CarCard car={car} />
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>

                            </Carousel>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {featuredCars.map((car) => (
                                    <CarCard key={car.id} car={car} />
                                ))}
                            </div>
                        )
                    ) : (
                        <div className="text-center py-24 bg-white/50 rounded-[2.5rem] border border-dashed border-border/60 relative overflow-hidden group shadow-sm">
                            <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative z-10">
                                <div className="h-20 w-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CarIcon className="h-10 w-10 text-muted-foreground/40" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Exclusive Arrivals Pending</h3>
                                <p className="text-muted-foreground max-w-sm mx-auto">New premium vehicles are arriving shortly. Stay tuned for the latest additions to our fleet.</p>
                                <Link href="/listings" className="mt-8 inline-block">
                                    <Button variant="outline" className="rounded-2xl px-10 font-black tracking-tight h-12 border-secondary/20 hover:bg-secondary hover:text-white">Explore Available Cars</Button>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-gradient-to-br from-primary via-primary to-secondary py-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-4xl mb-4 text-white font-bold">Ready to Get Started?</h2>
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
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
