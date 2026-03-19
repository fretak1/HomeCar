
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PropertyCard } from '@/components/PropertyCard';
import { CarCard } from '@/components/CarCard';
import { useAIStore } from '@/store/useAIStore';
import { useUserStore } from '@/store/useUserStore';
import { Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi
} from "@/components/ui/carousel";

interface AIRecommendationsProps {
  title?: string;
}

export function AIRecommendations({ title }: AIRecommendationsProps) {
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
      <div className="py-16 flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <Bot className="h-5 w-5 text-primary absolute inset-0 m-auto" />
        </div>
        <p className="text-muted-foreground font-medium animate-pulse">Personalizing suggestions for you...</p>
      </div>
    );
  }

  // If absolutely nothing comes back, show a fallback or just empty set
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-accent/5 to-secondary/5 py-16 px-4 sm:px-6 lg:px-8 overflow-hidden relative group">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full -mr-48 -mt-48 blur-3xl group-hover:bg-primary/10 transition-colors" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-4xl font-black text-foreground tracking-tight">
              {title || (
                <>
                  Recommended <span className="text-primary italic">Just For You</span>
                </>
              )}
            </h2>
            <p className="text-muted-foreground mt-2 font-medium">
              {currentUser
                ? "Based on your activity and local neighborhood trends."
                : "Discover our top-rated properties and vehicles near you."}
            </p>
          </div>
          <Link href="/recommendations">
            <Button variant="ghost" className="group font-bold hover:bg-primary/5 hover:text-primary rounded-xl px-6">
              View All
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

// Internal Bot icon for loading state
function Bot(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </svg>
  )
}
