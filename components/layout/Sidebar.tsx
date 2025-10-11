"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    LayoutDashboard,
    FileEdit,
    ClipboardList,
    Crown,
    Sparkles,
    Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface SidebarProps {
    isExpanded: boolean;
    isOpen: boolean;
    onNavigate?: () => void;
}

type PlanType = "starter" | "basic" | "advanced";

interface PlanData {
    name: string;
    type: PlanType;
}

const navigationItems = [
    {
        href: "/dashboard",
        icon: LayoutDashboard,
        label: "Dashboard",
    },
    {
        href: "/new-assessment",
        icon: FileEdit,
        label: "Criar Questões",
    },
    {
        href: "/my-assessments",
        icon: ClipboardList,
        label: "Minhas Questões",
    },
] as const;

const planConfig = {
    starter: {
        icon: Sparkles,
        color: "text-gray-500",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-200",
    },
    basic: {
        icon: Zap,
        color: "text-blue-500",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
    },
    advanced: {
        icon: Crown,
        color: "text-purple-500",
        bgColor: "bg-purple-50",
        borderColor: "border-purple-200",
    },
};

export function Sidebar({ isExpanded, isOpen, onNavigate }: SidebarProps) {
    const pathname = usePathname();
    const [plan, setPlan] = useState<PlanData | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchPlan();
    }, []);

    const fetchPlan = async () => {
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) return;

            const { data: profile } = await supabase
                .from("profiles")
                .select("plan")
                .eq("user_id", user.id)
                .single();

            if (profile?.plan) {
                const { data: planData } = await supabase
                    .from("plans")
                    .select("name, type")
                    .eq("id", profile.plan)
                    .single();

                if (planData) {
                    setPlan(planData as PlanData);
                }
            }
        } catch (error) {
            console.error("Erro ao carregar plano:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleNavigation = () => {
        if (onNavigate) {
            onNavigate();
        }
    };

    const getPlanCTA = () => {
        if (!plan || plan.type === "starter") {
            return {
                text: "Selecionar Plano",
                href: "/plan",
            };
        }

        if (plan.type !== "advanced") {
            return {
                text: "Fazer Upgrade",
                href: "/plan",
            };
        }

        return null;
    };

    const renderNavItem = (item: (typeof navigationItems)[number]) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        const content = (
            <Button
                asChild
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                    "w-full justify-start gap-3 transition-colors",
                    isActive && "bg-primary/10 text-primary hover:bg-primary/15",
                    !isExpanded && "justify-center px-2"
                )}
                onClick={handleNavigation}
            >
                <Link href={item.href}>
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {isExpanded && <span>{item.label}</span>}
                </Link>
            </Button>
        );

        if (!isExpanded) {
            return (
                <Tooltip key={item.href}>
                    <TooltipTrigger asChild>{content}</TooltipTrigger>
                    <TooltipContent side="right">
                        <p>{item.label}</p>
                    </TooltipContent>
                </Tooltip>
            );
        }

        return <div key={item.href}>{content}</div>;
    };

    const renderPlanCard = () => {
        if (loading) {
            return (
                <div
                    className={cn(
                        "animate-pulse rounded-lg bg-muted",
                        isExpanded ? "h-24" : "h-12"
                    )}
                />
            );
        }

        if (!plan) return null;

        const config = planConfig[plan.type];
        const PlanIcon = config.icon;
        const cta = getPlanCTA();

        if (!isExpanded) {
            return (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div
                            className={cn(
                                "flex items-center justify-center rounded-lg border p-3",
                                config.bgColor,
                                config.borderColor
                            )}
                        >
                            <PlanIcon className={cn("h-5 w-5", config.color)} />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        <p className="font-medium">Plano {plan.name}</p>
                        {cta && <p className="text-xs text-muted-foreground">{cta.text}</p>}
                    </TooltipContent>
                </Tooltip>
            );
        }

        return (
            <div
                className={cn(
                    "rounded-lg border p-3 space-y-2",
                    config.bgColor,
                    config.borderColor
                )}
            >
                <div className="flex items-center gap-2">
                    <PlanIcon className={cn("h-5 w-5", config.color)} />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">Plano Ativo</p>
                        <p className="text-xs text-muted-foreground truncate">
                            {plan.name}
                        </p>
                    </div>
                </div>

                {cta && (
                    <Button
                        asChild
                        size="sm"
                        className="w-full"
                        variant={plan.type === "starter" ? "default" : "outline"}
                    >
                        <Link href={cta.href}>{cta.text}</Link>
                    </Button>
                )}
            </div>
        );
    };

    return (
        <aside
            className={cn(
                "fixed left-0 top-16 h-[calc(100vh-4rem)] border-r bg-background transition-all duration-300 z-40",
                "flex flex-col",
                isExpanded ? "w-64" : "w-16",
                // Mobile: overlay when open, hidden when closed
                "lg:translate-x-0",
                isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )}
        >
            {/* Navigation */}
            <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
                {navigationItems.map(renderNavItem)}
            </nav>

            {/* Footer with plan card */}
            <div className="p-3 space-y-3 border-t">
                <Separator className="mb-3" />
                {renderPlanCard()}
            </div>
        </aside>
    );
}
