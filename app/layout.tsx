import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "@/components/providers/query-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Prova Fácil",
    description: "Sistema de criação e gestão de avaliações",
};

// Force dynamic rendering to avoid pre-rendering issues with client components
export const dynamic = "force-dynamic";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pt-BR" suppressHydrationWarning>
            <body className={inter.className}>
                <QueryProvider>
                    <TooltipProvider>
                        {children}
                        <Toaster />
                        <Sonner />
                    </TooltipProvider>
                </QueryProvider>
            </body>
        </html>
    );
}
