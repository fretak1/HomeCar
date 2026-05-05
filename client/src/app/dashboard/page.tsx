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
            if (currentUser.role === 'CUSTOMER') {
                router.replace('/dashboard/customer');
            } else {
                const role = currentUser.role.toLowerCase();
                router.replace(`/dashboard/${role}`);
            }
        }
    }, [currentUser, isLoading, router]);

    // Fast synchronous check to prevent flashing dashboard UI for customers
    const getCookie = (name: string) => {
        if (typeof document === 'undefined') return null;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return null;
    };
    const userRoleCookie = getCookie('user-role')?.toUpperCase();
    const activeRole = currentUser?.role?.toUpperCase() || userRoleCookie;

    if (activeRole === 'CUSTOMER') {
        // Return blank to let the redirect take over seamlessly
        return <div className="min-h-screen bg-background" />; 
    }

    if (!activeRole) {
        // If we just came from Google OAuth and don't know the role yet, show a generic loader, NOT the dashboard
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center">
                <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-muted-foreground font-medium animate-pulse">Completing sign in...</p>
            </div>
        );
    }

    // Match the global dashboard/loading.tsx exactly
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
                        <div key={i} className="bg-card border border-border/50 rounded-xl p-6 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <Skeleton className="h-3 w-24 rounded" />
                                <Skeleton className="h-9 w-9 rounded-lg" />
                            </div>
                            <Skeleton className="h-8 w-20 rounded mb-2" />
                            <Skeleton className="h-3 w-32 rounded" />
                        </div>
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
                    <div className="bg-card border border-border/50 rounded-xl shadow-md h-[400px] p-6">
                        <div className="pb-2 mb-4">
                            <Skeleton className="h-5 w-40 rounded mb-1" />
                            <Skeleton className="h-3 w-28 rounded" />
                        </div>
                        <Skeleton className="h-64 w-full rounded" />
                    </div>
                    <div className="bg-card border border-border/50 rounded-xl shadow-md h-[400px] p-6">
                        <div className="pb-2 mb-4">
                            <Skeleton className="h-5 w-40 rounded mb-1" />
                            <Skeleton className="h-3 w-28 rounded" />
                        </div>
                        <Skeleton className="h-64 w-full rounded" />
                    </div>
                </div>
            </div>
        </div>
    );
}
