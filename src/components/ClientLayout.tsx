"use client";

import { usePathname } from "next/navigation";
import { AuthProvider } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AIChatWidget } from "@/components/AIChatWidget";
import { Toaster } from "sonner";

export function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAuthPage = pathname === "/login" || pathname === "/signup";

    return (
        <AuthProvider>
            <div className="min-h-screen bg-background flex flex-col">
                {!isAuthPage && <Navbar />}
                <main className="flex-1">
                    {children}
                </main>
                {!isAuthPage && <Footer />}
                {!isAuthPage && <AIChatWidget />}
            </div>
            <Toaster position="top-right" expand={true} richColors />
        </AuthProvider>
    );
}
