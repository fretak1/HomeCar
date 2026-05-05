
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PropertyCard } from '@/components/PropertyCard';
import { CarCard } from '@/components/CarCard';
import { useAIStore } from '@/store/useAIStore';
import { useUserStore } from '@/store/useUserStore';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi
} from "@/components/ui/carousel";
import { useTranslation } from '@/contexts/LanguageContext';

interface AIRecommendationsProps {
  title?: string;
}

import { PropertyGridSkeleton } from './ui/dashboard-skeletons';
import { Skeleton } from './ui/skeleton';

export function AIRecommendations({ title }: AIRecommendationsProps) {
  const { t } = useTranslation();
  const { currentUser } = useUserStore();
  const { recommendations, fetchRecommendations, isRecommendationLoading } = useAIStore();
  const [api, setApi] = useState<CarouselApi>();

  useEffect(() => {
    // Fetch even if no user (gets general recommendations)
    fetchRecommendations(currentUser?.id || '');
  }, [currentUser?.id, fetchRecommendations]);

  // Auto-slide logic
  useEffect(() => {
    if (!api) return;
    const interval = setInterval(() => {
      api.scrollNext();
    }, 5000);
    return () => clearInterval(interval);
  }, [api]);

  if (isRecommendationLoading) {
    return (
      <div className="max-w-7xl mx-auto py-16 px-4">
        <div className="flex justify-between items-end mb-10">
          <div className="space-y-3">
            <Skeleton className="h-10 w-64 rounded" />
            <Skeleton className="h-4 w-96 rounded" />
          </div>
        </div>
        <PropertyGridSkeleton count={3} />
      </div>
    );
  }

  // If absolutely nothing comes back, show a fallback or just empty set
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#F8FAFC] py-16 px-4 sm:px-6 lg:px-8 overflow-hidden relative group">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full -mr-48 -mt-48 blur-3xl group-hover:bg-primary/10 transition-colors" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-4xl font-black text-foreground tracking-tight">
              {title || (
                <>
                  {t('recommendations.justForYou')}
                </>
              )}
            </h2>
            <p className="text-muted-foreground mt-2 font-medium">
              {currentUser
                ? t('recommendations.personalizedSubtitle')
                : t('recommendations.generalSubtitle')}
            </p>
          </div>
          <Link href="/recommendations">
            <Button variant="ghost" className="group font-bold hover:bg-primary/5 hover:text-primary rounded-xl px-6">
              {t('recommendations.viewAll')}
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        <Carousel
          setApi={setApi}
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-8">
            {recommendations.map((item: any) => (
              <CarouselItem key={item.propertyId} className="pl-8 md:basis-1/2 lg:basis-1/3">
                {item.assetType === 'HOME'
                  ? <PropertyCard property={item} />
                  : <CarCard car={item} />
                }
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </div>
  );
}


