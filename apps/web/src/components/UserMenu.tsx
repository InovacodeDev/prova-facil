import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Settings, Lock, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface Profile {
    full_name: string | null;
    avatar_url: string | null;
}

export const UserMenu = () => {
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const navigate = useNavigate();
    const { toast } = useToast();

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const token = localStorage.getItem("sb_access_token");
            if (!token) return;

            const meRes = await fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } });
            const me = await meRes.json();
            if (!meRes.ok) return;
            setUser(me.user || null);

            const res = await fetch("/api/rpc/query", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    table: "profiles",
                    select: "full_name, avatar_url",
                    filter: { user_id: me.user?.id },
                }),
            });
            const payload = await res.json();
            setProfile(payload?.data?.[0] ?? null);
        } catch (error: unknown) {
            console.error("Erro ao carregar dados do usuário:", error);
        }
    };

    const handleSignOut = async () => {
        // Clear client token and redirect
        localStorage.removeItem("sb_access_token");
        toast({ title: "Logout realizado", description: "Até a próxima!" });
        navigate("/");
    };

    const getInitials = (name: string | null, email: string | undefined) => {
        if (name) {
            return name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
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
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/change-password")}>
                    <Lock className="mr-2 h-4 w-4" />
                    <span>Alterar Senha</span>
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
