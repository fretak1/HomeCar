import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClientLayout } from "@/components/ClientLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "HomeCar - Find Your Perfect Home or Car",
    description: "Advanced AI-powered platform for property and vehicle listings.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <script dangerouslySetInnerHTML={{
                    __html: `
                        (function() {
                            try {
                                var cookie = document.cookie;
                                if (cookie && /user-role=(ADMIN|OWNER|AGENT)/i.test(cookie)) {
                                    if (window.location.pathname === '/' || window.location.pathname === '') {
                                        window.location.href = '/dashboard';
                                    }
                                }
                            } catch (e) {}
                        })();
                    `
                }} />
            </head>
            <body className={inter.className}>
                <ClientLayout>
                    {children}
                </ClientLayout>
            </body>
        </html>
    );
}
