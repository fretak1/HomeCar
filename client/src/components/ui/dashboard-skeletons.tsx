import { Skeleton } from './skeleton';
import { Card, CardContent, CardHeader } from './card';

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
                    <Skeleton className="h-48 w-full rounded-none" />
                    <CardContent className="p-4 space-y-3">
                        <Skeleton className="h-5 w-3/4 rounded" />
                        <Skeleton className="h-4 w-1/2 rounded" />
                        <div className="flex justify-between items-center pt-1">
                            <Skeleton className="h-5 w-24 rounded" />
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
