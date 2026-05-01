import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Skeleton */}
      <div className="bg-[#005a41] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-10 w-64 bg-white/20 rounded-lg mb-2" />
          <Skeleton className="h-6 w-48 bg-white/10 rounded-md" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-border/50 shadow-sm">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <Skeleton className="h-3 w-24 rounded" />
                  <Skeleton className="h-9 w-9 rounded-lg" />
                </div>
                <Skeleton className="h-8 w-20 rounded mb-2" />
                <Skeleton className="h-3 w-32 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs Skeleton */}
        <div className="flex gap-4 mb-8 border-b border-border/50 pb-px">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10 w-24 rounded-t-lg" />
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border-border/50 shadow-md h-[400px]">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-40 rounded mb-1" />
              <Skeleton className="h-3 w-28 rounded" />
            </CardHeader>
            <CardContent className="p-4">
              <Skeleton className="h-full w-full rounded" />
            </CardContent>
          </Card>
          <Card className="border-border/50 shadow-md h-[400px]">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-40 rounded mb-1" />
              <Skeleton className="h-3 w-28 rounded" />
            </CardHeader>
            <CardContent className="p-4">
              <Skeleton className="h-full w-full rounded" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
