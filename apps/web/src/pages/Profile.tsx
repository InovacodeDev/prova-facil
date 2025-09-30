import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { dashboardRoute, profileRoute } from "@/router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BookOpen, ArrowLeft, User, Camera, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ProfileData {
    id: string;
    user_id: string;
    full_name?: string | null;
    avatar_url?: string | null;
    bio?: string | null;
}

type User = { id: string; email?: string | null };

const Profile = () => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const navigate = dashboardRoute.useNavigate();
    const profileNavigate = profileRoute.useNavigate();
    const { toast } = useToast();

    const getInitials = (name: string) => {
        if (!name) return "U";
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    useEffect(() => {
        const fetchUserAndProfile = async () => {
            try {
                // server will authenticate using cookies
                const meRes = await apiFetch("/api/auth/me", { method: "GET", headers: {} });
                const meJson = await meRes.json();
                if (!meRes.ok) {
                    profileNavigate({ to: "/auth" });
                    return;
                }

                const meUser: User | null = meJson?.user ?? null;
                setUser(meUser);
                setEmail(meUser?.email ?? "");

                const res = await apiFetch("/api/rpc/query", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ table: "profiles", select: "*", filter: { user_id: meUser?.id } }),
                });
                const payload = await res.json();
                const profileData: ProfileData | null = payload?.data?.[0] ?? null;

                if (profileData) {
                    setProfile(profileData);
                    setFullName(profileData.full_name ?? "");
                }
            } catch (err: unknown) {
                console.error("Erro ao carregar dados do usuário:", err);
                toast({
                    title: "Erro",
                    description: "Não foi possível carregar os dados do perfil.",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        void fetchUserAndProfile();
    }, [profileNavigate, toast]);

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            const res = await apiFetch("/api/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ full_name: fullName.trim() || null, bio: undefined }),
            });
            const payload = await res.json();
            if (!res.ok) throw new Error(payload?.error || "Erro ao atualizar perfil");

            toast({ title: "Sucesso", description: "Perfil atualizado com sucesso!" });

            // reload profile
            const r = await apiFetch("/api/rpc/query", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ table: "profiles", select: "*", filter: { user_id: user.id } }),
            });
            const p = await r.json();
            const profileData: ProfileData | null = p?.data?.[0] ?? null;
            if (profileData) setProfile(profileData);
        } catch (err: unknown) {
            console.error("Erro ao salvar perfil:", err);
            toast({ title: "Erro", description: "Não foi possível salvar as alterações.", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!user) return;
        const confirmed = window.confirm("Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.");
        if (!confirmed) return;

        setDeleting(true);
        try {
            await apiFetch("/api/rpc/query", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    table: "profiles",
                    select: "*",
                    filter: { user_id: user.id },
                    action: "delete",
                }),
            });
            await apiFetch("/api/rpc/query", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    table: "assessments",
                    select: "*",
                    filter: { user_id: user.id },
                    action: "delete",
                }),
            });

            toast({ title: "Conta excluída", description: "Sua conta foi excluída com sucesso." });
            profileNavigate({ to: "/" });
        } catch (err: unknown) {
            console.error("Erro ao excluir conta:", err);
            toast({
                title: "Erro",
                description: "Não foi possível excluir a conta. Tente novamente.",
                variant: "destructive",
            });
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <BookOpen className="h-8 w-8 text-primary mx-auto mb-4 animate-pulse" />
                    <p className="text-muted-foreground">Carregando perfil...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border bg-card">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/dashboard" })}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Voltar
                        </Button>
                        <div className="flex items-center gap-2">
                            <User className="h-6 w-6 text-primary" />
                            <span className="text-lg font-semibold">Meu Perfil</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informações do Perfil</CardTitle>
                            <CardDescription>
                                Gerencie suas informações pessoais e configurações da conta
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Avatar Section */}
                            <div className="flex items-center gap-4">
                                <Avatar className="h-20 w-20">
                                    <AvatarImage src={profile?.avatar_url ?? ""} />
                                    <AvatarFallback className="text-lg">
                                        {getInitials(fullName || email || "")}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <Button variant="outline" size="sm" disabled>
                                        <Camera className="h-4 w-4 mr-2" />
                                        Alterar Foto
                                    </Button>
                                    <p className="text-sm text-muted-foreground mt-1">Em breve - Upload de avatar</p>
                                </div>
                            </div>

                            {/* Form Fields */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Nome Completo</Label>
                                    <Input
                                        id="fullName"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Seu nome completo"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="seu@email.com"
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Alterar o email pode exigir verificação
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <Button onClick={handleSave} disabled={saving} className="flex-1">
                                    {saving ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Salvando...
                                        </>
                                    ) : (
                                        "Salvar Alterações"
                                    )}
                                </Button>
                                <Button variant="outline" onClick={() => navigate({ to: "/change-password" })}>
                                    Alterar Senha
                                </Button>
                            </div>

                            {/* Danger Zone */}
                            <div className="pt-6 border-t border-border">
                                <CardTitle className="text-destructive mb-2">Zona de Perigo</CardTitle>
                                <CardDescription className="mb-4">
                                    Esta ação é irreversível. Todos os seus dados serão permanentemente excluídos.
                                </CardDescription>

                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" disabled={deleting}>
                                            {deleting ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Excluindo...
                                                </>
                                            ) : (
                                                <>
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Excluir Conta
                                                </>
                                            )}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Confirmar Exclusão da Conta</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Tem certeza que deseja excluir sua conta? Esta ação não pode ser
                                                desfeita e todos os seus dados serão permanentemente removidos.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={handleDeleteAccount}
                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            >
                                                Sim, Excluir Conta
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
};

export default Profile;
