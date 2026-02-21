"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";
import { AuthProvider } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AIChatWidget } from "@/components/AIChatWidget";
import { Toaster } from "sonner";

export function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { getMe } = useUserStore();
    const isAuthPage = pathname === "/login" || pathname === "/signup";

    useEffect(() => {
        getMe();
    }, [getMe]);

    return (
        <AuthProvider>
            <div className="min-h-screen bg-background flex flex-col">
                {!isAuthPage && <div className="print:hidden"><Navbar /></div>}
                <main className="flex-1">
                    {children}
                </main>
                {!isAuthPage && <div className="print:hidden"><Footer /></div>}
                {!isAuthPage && <div className="print:hidden"><AIChatWidget /></div>}
            </div>
            <Toaster position="top-right" expand={true} richColors />
        </AuthProvider>
    );
}
