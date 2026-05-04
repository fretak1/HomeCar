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
    ShieldCheck, 
    Zap, 
    Verified, 
    Handshake,
    CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'motion/react';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    type CarouselApi
} from "@/components/ui/carousel";
import { PropertyGridSkeleton } from '@/components/ui/dashboard-skeletons';
import { useTranslation } from '@/contexts/LanguageContext';

const partners = [
    { key: "home.partners.verifiedAgents", icon: ShieldCheck },
    { key: "home.partners.fastProcessing", icon: Zap },
    { key: "home.partners.secureTransactions", icon: Verified },
    { key: "home.partners.trustedOwners", icon: Handshake },
    { key: "home.partners.easyToUse", icon: CheckCircle2 },
];

export default function Home() {
    const { t } = useTranslation();
    const { properties, fetchProperties, isLoading } = usePropertyStore();
    const [homesApi, setHomesApi] = useState<CarouselApi>();
    const [carsApi, setCarsApi] = useState<CarouselApi>();

    // Immediate redirection for management roles to avoid flash
    if (typeof window !== 'undefined') {
        const getCookie = (name: string) => {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop()?.split(';').shift();
            return null;
        };
        const userRole = getCookie('user-role')?.toUpperCase();
        if (userRole && ['ADMIN', 'OWNER', 'AGENT'].includes(userRole)) {
            window.location.href = '/dashboard';
            return <div className="min-h-screen bg-background" />;
        }
    }

    useEffect(() => {
        fetchProperties({ limit: 200 });
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
        <div className="min-h-screen bg-[#F8FAFC]">
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
                            {t('home.heroTitle')}
                        </h1>
                        <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto font-medium lead-relaxed">
                            {t('home.heroSubtitle')}
                        </p>
                    </motion.div>

                    <SearchBar />

                    {/* Feature Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24">
                        <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md shadow-2xl hover:bg-white/20 transition-all duration-300 group p-8 text-center">
                            <div className="bg-primary p-4 rounded-2xl w-fit mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform">
                                <Bot className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="mb-3 text-xl font-bold text-white tracking-tight">{t('home.aiMatchingTitle')}</h3>
                            <p className="text-white/70 text-sm leading-relaxed font-medium">
                                {t('home.aiMatchingSubtitle')}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md shadow-2xl hover:bg-white/20 transition-all duration-300 group p-8 text-center">
                            <div className="bg-secondary p-4 rounded-2xl w-fit mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform">
                                <TrendingUp className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="mb-3 text-xl font-bold text-white tracking-tight">{t('home.pricePredictionsTitle')}</h3>
                            <p className="text-white/70 text-sm leading-relaxed font-medium">
                                {t('home.pricePredictionsSubtitle')}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md shadow-2xl hover:bg-white/20 transition-all duration-300 group p-8 text-center">
                            <div className="bg-accent p-4 rounded-2xl w-fit mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform">
                                <Shield className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="mb-3 text-xl font-bold text-white tracking-tight">{t('home.verifiedListingsTitle')}</h3>
                            <p className="text-white/70 text-sm leading-relaxed font-medium">
                                {t('home.verifiedListingsSubtitle')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Recommendations */}
            <section className="border-b border-border">
                <AIRecommendations title={t('home.recommendedForYou')} />
            </section>

            {/* Featured Properties */}
            <div className="bg-[#F8FAFC] py-20 border-t border-border/40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-end mb-12">
                        <div>
                            <h2 className="text-4xl font-black text-foreground tracking-tight">{t('home.featuredHomes')}</h2>
                            <p className="text-muted-foreground text-lg mt-2">{t('home.featuredHomesSubtitle')}</p>
                        </div>
                        <Link href="/listings">
                            <Button variant="ghost" className="group font-bold hover:bg-primary/5 hover:text-primary rounded-xl px-6">
                                {t('home.viewAllHomes')}
                                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                    </div>

                    {isLoading ? (
                        <PropertyGridSkeleton count={3} />
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
                                <h3 className="text-xl font-bold mb-2">{t('home.noHomesTitle')}</h3>
                                <p className="text-muted-foreground max-w-sm mx-auto">{t('home.noHomesSubtitle')}</p>
                                <Link href="/listings" className="mt-8 inline-block">
                                    <Button className="rounded-2xl px-10 font-black tracking-tight h-12">{t('home.browseAllProperties')}</Button>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Featured Cars Section */}
            <div className="bg-[#F8FAFC] py-20 border-y border-border/40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-end mb-12">
                        <div>
                            <h2 className="text-4xl font-black text-foreground tracking-tight">{t('home.featuredCars')}</h2>
                            <p className="text-muted-foreground text-lg mt-2">{t('home.featuredCarsSubtitle')}</p>
                        </div>
                        <Link href="/listings">
                            <Button variant="ghost" className="group font-bold hover:bg-primary/5 hover:text-primary rounded-xl px-6">
                                {t('home.viewAllCars')}
                                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                    </div>

                    {isLoading ? (
                        <PropertyGridSkeleton count={3} />
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
                                <h3 className="text-xl font-bold mb-2">{t('home.noCarsTitle')}</h3>
                                <p className="text-muted-foreground max-w-sm mx-auto">{t('home.noCarsSubtitle')}</p>
                                <Link href="/listings" className="mt-8 inline-block">
                                    <Button variant="outline" className="rounded-2xl px-10 font-black tracking-tight h-12 border-secondary/20 hover:bg-secondary hover:text-white">{t('home.exploreAvailableCars')}</Button>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-[#005a41] py-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-4xl mb-4 text-white font-bold">{t('home.ctaTitle')}</h2>
                        <p className="text-xl text-white/90 mb-8">
                            {t('home.ctaSubtitle')}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/dashboard/add-property">
                                <Button size="lg" variant="secondary" className="bg-white hover:bg-white/90 text-primary">
                                    {t('home.listYourProperty')}
                                </Button>
                            </Link>
                            <Link href="/listings">
                                <Button size="lg" variant="outline" className="border-white text-primary hover:bg-white/10">
                                    {t('home.browseListings')}
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
                {/* Trust Marquee inside CTA */}
                <div className="mt-16 border-t border-white/10 pt-10 overflow-hidden">
                    <div className="relative flex overflow-x-hidden">
                        <motion.div
                            className="flex whitespace-nowrap"
                            animate={{
                                x: [0, -1035],
                            }}
                            transition={{
                                x: {
                                    repeat: Infinity,
                                    repeatType: "loop",
                                    duration: 30,
                                    ease: "linear",
                                },
                            }}
                        >
                            {[...partners, ...partners].map((partner, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-3 px-12 opacity-40 hover:opacity-100 transition-opacity duration-300 cursor-default grayscale hover:grayscale-0"
                                >
                                    <partner.icon className="h-6 w-6 text-secondary" />
                                    <span className="text-lg font-black tracking-tight uppercase text-white">
                                        {t(partner.key)}
                                    </span>
                                </div>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
