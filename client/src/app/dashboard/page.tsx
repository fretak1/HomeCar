"use client";


import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/useUserStore';
import { Loader2 } from 'lucide-react';

export default function UserDashboardPage() {
    const router = useRouter();
    const { currentUser, isLoading } = useUserStore();

    useEffect(() => {
        if (!isLoading && !currentUser) {
            router.push('/login');
            return;
        }

        if (currentUser) {
            const role = currentUser.role.toLowerCase();
            router.push(`/dashboard/${role}`);
        }
    }, [currentUser, isLoading, router]);

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
            <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <p className="text-muted-foreground font-medium animate-pulse">
                    Redirecting to your {currentUser?.role.toLowerCase() || ''} dashboard...
                </p>
            </div>
        </div>
    );
}
