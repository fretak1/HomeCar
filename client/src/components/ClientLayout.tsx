"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";
import { useFavoriteStore } from "@/store/useFavoriteStore";
import { AuthProvider } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AskAIAssistant } from "@/components/ai/AskAIAssistant";
import { Toaster } from "sonner";

export function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { getMe, currentUser } = useUserStore();
    const { fetchFavorites } = useFavoriteStore();
    const isAuthPage = pathname === "/login" || pathname === "/signup" || pathname === "/forgot-password" || pathname === "/reset-password";

    useEffect(() => {
        getMe();
    }, [getMe]);

    useEffect(() => {
        if (currentUser) {
            fetchFavorites();
        }
    }, [currentUser, fetchFavorites]);

    return (
        <AuthProvider>
            <div className="min-h-screen bg-background flex flex-col">
                {!isAuthPage && <div className="print:hidden"><Navbar /></div>}
                <main className="flex-1">
                    {children}
                </main>
                {!isAuthPage && <div className="print:hidden"><Footer /></div>}
                {!isAuthPage && <div className="print:hidden"><AskAIAssistant /></div>}
            </div>
            <Toaster position="top-right" expand={true} richColors />
        </AuthProvider>
    );
}
