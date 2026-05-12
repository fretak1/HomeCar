"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";
import { useFavoriteStore } from "@/store/useFavoriteStore";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getCookie } from "@/lib/utils";
import { AskAIAssistant } from "@/components/ai/AskAIAssistant";
import { Toaster } from "sonner";

const RESTRICTED_ROLES = ['ADMIN', 'OWNER', 'AGENT'];

function isManagementPath(pathname: string) {
    return (
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/profile') ||
        pathname.startsWith('/verify-email') ||
        pathname.startsWith('/property/') ||
        pathname.startsWith('/chat')
    );
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { getMe, currentUser, isLoading } = useUserStore();
    const { fetchFavorites } = useFavoriteStore();
    const isAuthPage = pathname === "/login" || pathname === "/signup" || pathname === "/forgot-password" || pathname === "/reset-password" || pathname === "/verify-email";

    const userRoleCookie = getCookie('user-role')?.toUpperCase();
    const isRestrictedRoleCookie = userRoleCookie && RESTRICTED_ROLES.includes(userRoleCookie);

    useEffect(() => {
        getMe();
    }, [getMe]);

    useEffect(() => {
        if (currentUser) {
            fetchFavorites();
        }
    }, [currentUser, fetchFavorites]);

    // Role-based Access Control Redirects (client-side safety net)
    useEffect(() => {
        if (!isLoading && currentUser) {
            const role = currentUser.role;
            if (RESTRICTED_ROLES.includes(role)) {
                if (!isManagementPath(pathname) && !isAuthPage) {
                    router.replace('/dashboard');
                }
            }
        }
    }, [currentUser, isLoading, pathname, router, isAuthPage]);

    const isRestrictedRole = currentUser && RESTRICTED_ROLES.includes(currentUser.role);
    
    const isAppWorkspacePage = 
        pathname.startsWith('/dashboard') || 
        pathname.startsWith('/chat') || 
        pathname.startsWith('/checkout') || 
        pathname.startsWith('/verify-email');

    const shouldHideFooter = isRestrictedRole || isAuthPage || isAppWorkspacePage;
    const shouldHideAskAI = isRestrictedRole || isAuthPage || isAppWorkspacePage;

    // Show full-screen spinner only on consumer pages (home, listings) while determining
    // auth state — prevents the flash of home content before restricted roles redirect.
    // Management paths (/profile, /dashboard etc.) render immediately without spinner.
    const isConsumerPage = !isManagementPath(pathname) && !isAuthPage && !isAppWorkspacePage;
    if (isLoading && isConsumerPage) {
        return (
            <LanguageProvider>
                <div className="min-h-screen bg-background flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse">
                            <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                        </div>
                    </div>
                </div>
            </LanguageProvider>
        );
    }

    // Proactive guard: if a restricted role is on a consumer path, render nothing
    if ((isRestrictedRoleCookie || (!isLoading && isRestrictedRole)) && !isManagementPath(pathname) && !isAuthPage) {
        return <div className="min-h-screen bg-background" />;
    }

    return (
        <LanguageProvider>
            <AuthProvider>
                <div className="min-h-screen bg-background flex flex-col">
                    {!isAuthPage && <div className="print:hidden"><Navbar /></div>}
                    <main className="flex-1">
                        {children}
                    </main>
                    {!shouldHideFooter && <div className="print:hidden"><Footer /></div>}
                    {!shouldHideAskAI && <div className="print:hidden"><AskAIAssistant /></div>}
                </div>
                <Toaster position="top-right" expand={true} richColors />
            </AuthProvider>
        </LanguageProvider>
    );
}
