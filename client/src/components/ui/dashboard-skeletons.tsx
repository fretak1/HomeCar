import { Skeleton } from './skeleton';
import { Card, CardContent, CardHeader } from './card';

/** Shared dashboard route skeleton used for dashboard loading states */
export function DashboardRouteSkeleton() {
    return (
        <div className="min-h-screen bg-background">
            <div className="bg-[#005a41] py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Skeleton className="h-10 w-64 bg-white/20 rounded-lg mb-2" />
                    <Skeleton className="h-6 w-48 bg-white/10 rounded-md" />
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

                <div className="flex gap-4 mb-8 border-b border-border/50 pb-px">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-10 w-24 rounded-t-lg" />
                    ))}
                </div>

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

/** 4-col stat card row skeleton */
export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${count} gap-6 mb-8`}>
            {Array.from({ length: count }).map((_, i) => (
                <Card key={i} className="border-border">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-12 w-12 rounded-xl" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-3 w-24 rounded" />
                                <Skeleton className="h-7 w-20 rounded" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

/** Property card grid skeleton */
export function PropertyGridSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <Card key={i} className="border-border overflow-hidden">
                    <Skeleton className="h-56 w-full rounded-none" />
                    <CardContent className="p-5 space-y-4">
                        <div className="flex justify-between items-start mb-2">
                            <Skeleton className="h-6 w-3/4 rounded" />
                            <Skeleton className="h-5 w-8 rounded" />
                        </div>
                        <Skeleton className="h-4 w-1/2 rounded" />
                        <Skeleton className="h-4 w-2/3 rounded" />
                        <div className="flex justify-between items-center pt-2">
                            <Skeleton className="h-7 w-28 rounded" />
                            <Skeleton className="h-8 w-20 rounded-lg" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

/** Generic list item skeleton (for applications/leases/maintenance rows) */
export function ListItemSkeleton() {
    return (
        <div className="p-6 border-b flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
                <Skeleton className="h-16 w-16 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-48 rounded" />
                    <Skeleton className="h-3 w-32 rounded" />
                    <Skeleton className="h-3 w-24 rounded" />
                </div>
            </div>
            <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-9 w-24 rounded-xl" />
            </div>
        </div>
    );
}

/** Card-wrapped list skeleton for tabs like Leases, Applications */
export function TabListSkeleton({ rows = 3 }: { rows?: number }) {
    return (
        <Card className="border-border">
            <CardHeader className="border-b">
                <Skeleton className="h-6 w-40 rounded" />
            </CardHeader>
            <CardContent className="p-0">
                {Array.from({ length: rows }).map((_, i) => (
                    <ListItemSkeleton key={i} />
                ))}
            </CardContent>
        </Card>
    );
}

/** Lease card skeleton (more complex — has progress bar) */
export function LeaseCardSkeleton() {
    return (
        <Card className="border-border">
            <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4 flex-1">
                        <Skeleton className="h-24 w-24 rounded-lg flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-5 w-40 rounded" />
                            <Skeleton className="h-3 w-28 rounded" />
                            <Skeleton className="h-3 w-20 rounded" />
                            <div className="flex gap-2 pt-1">
                                <Skeleton className="h-6 w-20 rounded-full" />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2 text-right">
                        <Skeleton className="h-7 w-28 rounded" />
                        <Skeleton className="h-3 w-16 rounded ml-auto" />
                        <div className="flex gap-2 justify-end pt-1">
                            <Skeleton className="h-9 w-28 rounded-xl" />
                        </div>
                    </div>
                </div>
                <div className="pt-4 border-t space-y-2">
                    <Skeleton className="h-3 w-full rounded" />
                    <Skeleton className="h-2 w-full rounded-full" />
                </div>
            </CardContent>
        </Card>
    );
}

/** Inline card skeleton for maintenance requests */
export function MaintenanceCardSkeleton() {
    return (
        <Card className="border-border">
            <CardContent className="p-5 flex items-start gap-4">
                <Skeleton className="h-10 w-10 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                    <div className="flex justify-between">
                        <Skeleton className="h-4 w-36 rounded" />
                        <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                    <Skeleton className="h-3 w-24 rounded" />
                    <Skeleton className="h-3 w-full rounded" />
                </div>
            </CardContent>
        </Card>
    );
}

/** Simple table-row skeleton */
export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
    return (
        <tr className="border-b">
            {Array.from({ length: cols }).map((_, i) => (
                <td key={i} className="p-4">
                    <Skeleton className="h-4 w-full rounded" />
                </td>
            ))}
        </tr>
    );
}

/** Full property detail page skeleton */
export function PropertyDetailSkeleton() {
    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back button skeleton */}
                <Skeleton className="h-6 w-32 mb-6 rounded" />
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    {/* Image Gallery Skeleton */}
                    <div className="lg:col-span-2">
                        <Skeleton className="w-full h-[500px] rounded-2xl" />
                        <div className="grid grid-cols-4 gap-4 mt-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <Skeleton key={i} className="w-full h-24 rounded-lg" />
                            ))}
                        </div>
                        {/* Title/Stats/Description area skeleton */}
                        <Card className="border-border mt-8">
                            <CardContent className="p-6 space-y-8">
                                <div className="space-y-4">
                                    <Skeleton className="h-10 w-2/3 rounded" />
                                    <div className="flex gap-4">
                                        <Skeleton className="h-6 w-32 rounded" />
                                        <Skeleton className="h-6 w-32 rounded" />
                                    </div>
                                </div>
                                
                                <div className="flex gap-8 py-4 border-y border-border">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="flex items-center gap-2">
                                            <Skeleton className="h-5 w-5 rounded" />
                                            <Skeleton className="h-4 w-20 rounded" />
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-4">
                                    <Skeleton className="h-6 w-32 rounded" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-full rounded" />
                                        <Skeleton className="h-4 w-full rounded" />
                                        <Skeleton className="h-4 w-3/4 rounded" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Amenities skeleton */}
                        <Card className="border-border mt-6">
                            <CardContent className="p-6">
                                <Skeleton className="h-6 w-32 mb-4" />
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {[1, 2, 3, 4, 5, 6].map((i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <Skeleton className="h-5 w-5 rounded-full" />
                                            <Skeleton className="h-4 w-24 rounded" />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Booking/Contact Card Skeleton */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-24 border-border shadow-lg">
                            <CardContent className="p-6 space-y-6">
                                <div>
                                    <Skeleton className="h-10 w-1/2 mb-2 rounded" />
                                    <Skeleton className="h-4 w-1/3 rounded" />
                                </div>
                                <Skeleton className="h-12 w-full rounded-xl" />
                                <Skeleton className="h-12 w-full rounded-xl" />
                                <div className="pt-6 border-t space-y-4">
                                    <div className="flex items-center gap-4">
                                        <Skeleton className="h-12 w-12 rounded-full" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-4 w-1/2 rounded" />
                                            <Skeleton className="h-3 w-1/3 rounded" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-11 w-full rounded-xl" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

/** Profile page skeleton */
export function ProfileSkeleton() {
    return (
        <div className="min-h-screen bg-muted/20 p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <Card className="border-none shadow-xl shadow-black/5 overflow-hidden rounded-[2.5rem] bg-white">
                    <div className="h-48 bg-[#005a41]" />
                    <CardContent className="px-8 pb-8 -mt-12 relative z-10">
                        <div className="flex flex-col md:flex-row items-end gap-6 mb-8">
                            <Skeleton className="h-40 w-40 rounded-full border-4 border-white shadow-xl" />
                            <div className="flex-1 space-y-3 pb-2">
                                <Skeleton className="h-8 w-64 rounded" />
                                <Skeleton className="h-4 w-48 rounded" />
                            </div>
                            <Skeleton className="h-12 w-40 rounded-xl" />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="h-3 w-20 rounded" />
                                    <Skeleton className="h-7 w-24 rounded" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i} className="border-border overflow-hidden rounded-2xl">
                            <Skeleton className="h-48 w-full" />
                            <CardContent className="p-4 space-y-3">
                                <Skeleton className="h-5 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}

/** Lease detail page skeleton */
export function LeaseDetailSkeleton() {
    return (
        <div className="min-h-screen bg-muted/30 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <Skeleton className="h-96 w-full rounded-2xl" />
                        <Card className="border-border shadow-md">
                            <CardContent className="p-8 space-y-6">
                                <Skeleton className="h-6 w-1/4 rounded" />
                                <Skeleton className="h-4 w-full rounded" />
                                <Skeleton className="h-2 w-full rounded-full" />
                                <div className="flex justify-between">
                                    <Skeleton className="h-3 w-24 rounded" />
                                    <Skeleton className="h-3 w-24 rounded" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-border shadow-md">
                            <CardContent className="p-0">
                                <div className="p-6 border-b">
                                    <Skeleton className="h-6 w-40 rounded" />
                                </div>
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="p-6 border-b flex justify-between">
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-48 rounded" />
                                            <Skeleton className="h-3 w-32 rounded" />
                                        </div>
                                        <Skeleton className="h-8 w-20 rounded-lg" />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                    <div className="space-y-8">
                        <Card className="border-border shadow-md p-6 space-y-4">
                            <Skeleton className="h-6 w-3/4 rounded" />
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-16 w-16 rounded-2xl" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-32 rounded" />
                                    <Skeleton className="h-3 w-24 rounded" />
                                </div>
                            </div>
                            <Skeleton className="h-11 w-full rounded-xl" />
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

/** Receipt/Document skeleton */
export function ReceiptSkeleton() {
    return (
        <div className="min-h-screen bg-muted/20 pb-20 pt-20">
            <div className="max-w-4xl mx-auto px-4">
                <Card className="border-none shadow-2xl bg-white overflow-hidden rounded-[2rem]">
                    <CardContent className="p-12 sm:p-20 space-y-12">
                        <div className="flex justify-between items-start">
                            <div className="space-y-4">
                                <Skeleton className="h-20 w-20 rounded-xl" />
                                <div className="space-y-2">
                                    <Skeleton className="h-3 w-48 rounded" />
                                    <Skeleton className="h-3 w-32 rounded" />
                                </div>
                            </div>
                            <div className="text-right space-y-4">
                                <Skeleton className="h-10 w-40 rounded ml-auto" />
                                <Skeleton className="h-4 w-64 rounded ml-auto" />
                                <Skeleton className="h-6 w-32 rounded-full ml-auto" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 py-12 border-y border-border/50">
                            <div className="space-y-4">
                                <Skeleton className="h-3 w-24 rounded" />
                                <Skeleton className="h-8 w-48 rounded" />
                                <Skeleton className="h-4 w-40 rounded" />
                            </div>
                            <div className="space-y-4 md:text-right">
                                <Skeleton className="h-3 w-24 rounded ml-auto" />
                                <Skeleton className="h-4 w-32 rounded ml-auto" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <Skeleton className="h-8 w-full rounded" />
                            <div className="space-y-2">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="flex justify-between py-6 border-b border-border/50">
                                        <Skeleton className="h-4 w-1/3 rounded" />
                                        <Skeleton className="h-4 w-24 rounded" />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <div className="w-full md:w-64 space-y-3">
                                <div className="flex justify-between">
                                    <Skeleton className="h-3 w-20 rounded" />
                                    <Skeleton className="h-3 w-20 rounded" />
                                </div>
                                <div className="flex justify-between pt-4 border-t-2 border-foreground/10">
                                    <Skeleton className="h-8 w-32 rounded" />
                                    <Skeleton className="h-8 w-24 rounded" />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

/** Dashboard home skeleton */
export function DashboardSkeleton() {
    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <div className="bg-[#005a41] py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="space-y-3">
                        <Skeleton className="h-10 w-64 bg-white/20 rounded" />
                        <Skeleton className="h-5 w-96 bg-white/10 rounded" />
                    </div>
                </div>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <StatCardsSkeleton count={5} />
                <div className="mt-8 space-y-6">
                    <div className="flex gap-4 border-b">
                        <Skeleton className="h-10 w-28 rounded-t-lg" />
                        <Skeleton className="h-10 w-28 rounded-t-lg" />
                        <Skeleton className="h-10 w-28 rounded-t-lg" />
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <Skeleton className="h-8 w-48 rounded" />
                            <Skeleton className="h-10 w-32 rounded-xl" />
                        </div>
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Card key={i} className="border-border overflow-hidden">
                                <CardContent className="p-6 flex gap-6">
                                    <Skeleton className="h-32 w-32 rounded-xl" />
                                    <div className="flex-1 space-y-3">
                                        <Skeleton className="h-6 w-1/3 rounded" />
                                        <Skeleton className="h-4 w-1/4 rounded" />
                                        <div className="pt-4 flex gap-2">
                                            <Skeleton className="h-8 w-24 rounded-lg" />
                                            <Skeleton className="h-8 w-24 rounded-lg" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
