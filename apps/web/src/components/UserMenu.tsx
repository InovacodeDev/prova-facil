import { useState, useEffect } from "react";
import { profileRoute, changePasswordRoute } from "@/router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiFetch, apiLogout } from "../lib/api";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Lock, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Profile {
    full_name: string | null;
    avatar_url: string | null;
}

interface User {
    id: string;
    email?: string | null;
}

export const UserMenu = () => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const profileNavigate = profileRoute.useNavigate();
    const changePasswordNavigate = changePasswordRoute.useNavigate();
    const { toast } = useToast();

    useEffect(() => {
        void (async () => {
            try {
                const meRes = await apiFetch("/api/auth/me", { method: "GET", headers: {} });
                if (!meRes.ok) return;
                const me = await meRes.json();
                setUser(me.user || null);

                // If the server returns profile together with user, prefer it
                const returnedProfile = me.profile ?? null;
                if (returnedProfile) {
                    setProfile({
                        full_name: returnedProfile.full_name ?? null,
                        avatar_url: returnedProfile.avatar_url ?? null,
                    });
                } else {
                    const res = await apiFetch("/api/rpc/query", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            table: "profiles",
                            select: "full_name, avatar_url",
                            filter: { user_id: me.user?.id },
                        }),
                    });
                    const payload = await res.json();
                    setProfile(payload?.data?.[0] ?? null);
                }
            } catch (error: unknown) {
                console.error("Erro ao carregar dados do usuário:", error);
            }
        })();
    }, []);

    const handleSignOut = async () => {
        try {
            await apiLogout();
        } catch (e) {
            console.error("Logout error:", e);
        }
        toast({ title: "Logout realizado", description: "Até a próxima!" });
        profileNavigate({ to: "/auth" });
    };

    const getInitials = (name: string | null | undefined, email: string | null | undefined) => {
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
                        <AvatarFallback>{getInitials(profile?.full_name, user.email as string | null)}</AvatarFallback>
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
                <DropdownMenuItem onClick={() => profileNavigate({ to: "/profile" })}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => profileNavigate({ to: "/usage" })}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Uso de Cotas</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => profileNavigate({ to: "/plan" })}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Planos</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changePasswordNavigate({ to: "/change-password" })}>
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
