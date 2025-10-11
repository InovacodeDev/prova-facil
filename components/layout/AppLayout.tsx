"use client";

import { ReactNode, useState, useEffect } from "react";
import { AppHeader } from "./AppHeader";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface AppLayoutProps {
    children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
    const isMobile = useIsMobile();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

    // Initialize sidebar state based on screen size
    useEffect(() => {
        if (isMobile !== undefined) {
            setIsSidebarOpen(false);
            setIsSidebarExpanded(!isMobile);
        }
    }, [isMobile]);

    const handleMenuClick = () => {
        if (isMobile) {
            // Mobile: toggle open/closed
            setIsSidebarOpen(!isSidebarOpen);
        } else {
            // Desktop: toggle expanded/collapsed
            setIsSidebarExpanded(!isSidebarExpanded);
        }
    };

    const handleSidebarNavigate = () => {
        // Close sidebar on mobile after navigation
        if (isMobile) {
            setIsSidebarOpen(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <AppHeader onMenuClick={handleMenuClick} />

            <Sidebar
                isExpanded={isSidebarExpanded}
                isOpen={isSidebarOpen}
                onNavigate={handleSidebarNavigate}
            />

            {/* Overlay for mobile when sidebar is open */}
            {isMobile && isSidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 lg:hidden"
                    style={{ top: "4rem" }}
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Main content */}
            <main
                className={cn(
                    "transition-all duration-300 pt-6 pb-12 px-4 sm:px-6",
                    "min-h-[calc(100vh-4rem)]",
                    // Add left margin for sidebar on desktop
                    isSidebarExpanded ? "lg:ml-64" : "lg:ml-16"
                )}
            >
                <div className="mx-auto max-w-[1264px]">{children}</div>
            </main>
        </div>
    );
}
