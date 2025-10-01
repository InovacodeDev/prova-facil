"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Lock, LogOut, CreditCard, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface Profile {
    full_name: string | null;
    avatar_url: string | null;
}

export const UserMenu = () => {
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const router = useRouter();
    const { toast } = useToast();
    const supabase = createClient();

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) return;

            setUser(user);

            const { data: profileData } = await supabase
                .from("profiles")
                .select("full_name, avatar_url")
                .eq("user_id", user.id)
                .single();

            if (profileData) {
                setProfile(profileData);
            }
        } catch (error: any) {
            console.error("Erro ao carregar dados do usuário:", error);
        }
    };

    const handleSignOut = async () => {
        const { error } = await supabase.auth.signOut();

        if (error) {
            toast({
                title: "Erro",
                description: "Não foi possível fazer logout.",
                variant: "destructive",
            });
        } else {
            toast({
                title: "Logout realizado",
                description: "Até a próxima!",
            });
            router.push("/");
        }
    };

    const getInitials = (name: string | null, email: string | undefined) => {
        if (name) {
            const words = name
                .trim()
                .split(" ")
                .filter((w) => w.length > 0);
            if (words.length >= 2) {
                return (words[0][0] + words[1][0]).toUpperCase();
            }
            return words[0].slice(0, 2).toUpperCase();
        }

        if (email) {
            return email.charAt(0).toUpperCase();
        }

        return "U";
    };

    const getDisplayName = () => {
        return profile?.full_name || user?.email || "Usuário";
    };

    if (!user) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={profile?.avatar_url || ""} alt={getDisplayName()} />
                        <AvatarFallback>{getInitials(profile?.full_name, user.email)}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{getDisplayName()}</p>
                        {profile?.full_name && (
                            <p className="w-[200px] truncate text-sm text-muted-foreground">{user.email}</p>
                        )}
                    </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/change-password")}>
                    <Lock className="mr-2 h-4 w-4" />
                    <span>Alterar Senha</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/plan")}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Plano</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/usage")}>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    <span>Cota de Uso</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
