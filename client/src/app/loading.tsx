import { Skeleton } from "@/components/ui/skeleton";
import { PropertyGridSkeleton } from "@/components/ui/dashboard-skeletons";

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Hero Section Skeleton */}
      <div className="relative pt-24 pb-40 min-h-[700px] flex items-center bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full text-center">
            {/* Title */}
            <Skeleton className="h-16 w-3/4 max-w-4xl mx-auto mb-6 bg-muted/30" />
            <Skeleton className="h-16 w-1/2 max-w-2xl mx-auto mb-8 bg-muted/30" />
            {/* Subtitle */}
            <Skeleton className="h-6 w-2/3 max-w-2xl mx-auto mb-12 bg-muted/20" />
            {/* Search Bar */}
            <Skeleton className="h-20 w-full max-w-4xl mx-auto rounded-full bg-muted/30" />
            
            {/* Feature Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-2xl border border-border bg-white/50 backdrop-blur-sm p-8 text-center opacity-50">
                        <Skeleton className="h-16 w-16 rounded-2xl mx-auto mb-6 bg-muted/30" />
                        <Skeleton className="h-6 w-32 mx-auto mb-3 bg-muted/30" />
                        <Skeleton className="h-3 w-48 mx-auto bg-muted/20" />
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Recommended Section Skeleton */}
      <section className="border-b border-border/40 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Skeleton className="h-10 w-64 mb-10 bg-muted/40" />
            <PropertyGridSkeleton count={4} />
        </div>
      </section>

      {/* Featured Properties Skeleton */}
      <div className="py-24 border-t border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <Skeleton className="h-10 w-64 mb-2 bg-muted/40" />
              <Skeleton className="h-5 w-80 bg-muted/30" />
            </div>
            <Skeleton className="h-10 w-40 rounded-xl bg-muted/30" />
          </div>
          <PropertyGridSkeleton count={3} />
        </div>
      </div>

      {/* Featured Cars Skeleton */}
      <div className="py-24 border-t border-border/40 bg-muted/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <Skeleton className="h-10 w-56 mb-2 bg-muted/40" />
              <Skeleton className="h-5 w-72 bg-muted/30" />
            </div>
            <Skeleton className="h-10 w-40 rounded-xl bg-muted/30" />
          </div>
          <PropertyGridSkeleton count={3} />
        </div>
      </div>
    </div>
  );
}
