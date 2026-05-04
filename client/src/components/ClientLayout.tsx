"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";
import { useFavoriteStore } from "@/store/useFavoriteStore";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
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

    // Use cookie for immediate role check to prevent flash
    const getCookie = (name: string) => {
        if (typeof document === 'undefined') return null;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return null;
    };
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
    
    // Pages where the footer should be hidden for ALL users (interactive workspaces & utilities)
    const isAppWorkspacePage = 
        pathname.startsWith('/dashboard') || 
        pathname.startsWith('/chat') || 
        pathname.startsWith('/checkout') || 
        pathname.startsWith('/verify-email');

    // Hide footer on intense workspaces and utility screens
    const shouldHideFooter = isRestrictedRole || isAuthPage || isAppWorkspacePage;
    
    // Hide AI Assistant on Auth pages, restricted roles, and all dashboard/app workspaces
    const shouldHideAskAI = isRestrictedRole || isAuthPage || isAppWorkspacePage;

    // Proactive guard: if a restricted role is on a consumer path, render nothing
    // (middleware already redirected — this blocks the brief content flash)
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
