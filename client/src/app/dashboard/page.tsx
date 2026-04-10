"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/useUserStore';
import { Skeleton } from '@/components/ui/skeleton';

export default function UserDashboardPage() {
    const router = useRouter();
    const { currentUser, isLoading } = useUserStore();

    useEffect(() => {
        if (!isLoading && !currentUser) {
            router.replace('/login');
            return;
        }

        if (currentUser) {
            const role = currentUser.role.toLowerCase();
            router.replace(`/dashboard/${role}`);
        }
    }, [currentUser, isLoading, router]);

    // Silent full-page skeleton — no spinner text, no "Redirecting" message
    return (
        <div className="min-h-screen bg-background">

            {/* Green header skeleton */}
            <div className="bg-gradient-to-br from-[#005a41] via-[#005a41] to-[#1e3a8a] py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Skeleton className="h-10 w-64 bg-white/20 rounded-lg mb-3" />
                    <Skeleton className="h-5 w-48 bg-white/10 rounded-md" />
                </div>
            </div>
            {/* Stats skeleton */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[1,2,3,4].map(i => (
                        <div key={i} className="border border-border/50 rounded-xl p-6 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <Skeleton className="h-3 w-24 rounded" />
                                <Skeleton className="h-9 w-9 rounded-lg" />
                            </div>
                            <Skeleton className="h-8 w-20 rounded mb-2" />
                            <Skeleton className="h-3 w-32 rounded" />
                        </div>
                    ))}
                </div>
                {/* Tabs skeleton */}
                <div className="flex gap-2 mb-8 border-b border-border/50">
                    {[120, 100, 120, 90, 120].map((w, i) => (
                        <Skeleton key={i} className="h-10 rounded-t-lg" style={{ width: w }} />
                    ))}
                </div>
                {/* Charts skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {[290, 250, 250, 290].map((h, i) => (
                        <Skeleton key={i} className="w-full rounded-xl" style={{ height: h }} />
                    ))}
                </div>
            </div>
        </div>
    );
}
