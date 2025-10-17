import { CookieBanner } from "@/components/CookieBanner";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Prova Fácil",
    description: "Sistema de criação e gestão de avaliações",
};

// Force dynamic rendering to avoid pre-rendering issues with client components
export const dynamic = "force-dynamic";
export const fetchCache = "force-cache";
export const revalidate = 3600; // 1 hour

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pt-BR" suppressHydrationWarning>
            <body className={inter.className} suppressHydrationWarning>
                <QueryProvider>
                    <TooltipProvider>
                        {children}
                        <Toaster />
                        <Sonner />
                        <CookieBanner />
                    </TooltipProvider>
                </QueryProvider>
                <SpeedInsights />
                <Analytics />
            </body>
        </html>
    );
}
