import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { dashboardRoute } from "@/router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Upload, FileText, TrendingUp, Calendar, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UserMenu } from "@/components/UserMenu";

// Local supabase user shape used by the frontend to avoid importing
// `@supabase/supabase-js` on the client. Keep this intentionally small
// (only what the UI needs). If you persist additional fields, extend it.
type SupabaseUser = {
    id: string;
    email?: string | null;
    phone?: string | null;
    user_metadata?: Record<string, unknown> | null;
};

interface AssessmentStats {
    total: number;
    draft: number;
    published: number;
    recent: Array<{
        id: string;
        title: string;
        created_at: string;
        status: string;
    }>;
}

const Dashboard = () => {
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<AssessmentStats>({
        total: 0,
        draft: 0,
        published: 0,
        recent: [],
    });
    const navigate = dashboardRoute.useNavigate();
    const { toast } = useToast();

    useEffect(() => {
        const init = async () => {
            try {
                const token = localStorage.getItem("sb_access_token");
                if (!token) {
                    setLoading(false);
                    navigate({ to: "/auth" });
                    return;
                }

                const meRes = await apiFetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } });
                if (!meRes.ok) {
                    setLoading(false);
                    navigate({ to: "/auth" });
                    return;
                }
                const { user } = await meRes.json();
                setUser(user || null);
                setLoading(false);
                fetchStats(user.id);
            } catch (e) {
                console.error(e);
                setLoading(false);
                navigate({ to: "/auth" });
            }
        };

        init();
    }, [navigate]);

    const fetchStats = async (userId: string) => {
        try {
            const token = localStorage.getItem("sb_access_token");
            const resp = await apiFetch("/api/rpc/query", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    table: "assessments",
                    select: "id, title, created_at, status",
                    filter: { user_id: userId },
                    order: { by: "created_at", direction: "desc" },
                }),
            });
            const { data: assessments } = await resp.json();

            const total = assessments?.length || 0;
            const draft = assessments?.filter((a) => a.status === "draft").length || 0;
            const published = assessments?.filter((a) => a.status === "published").length || 0;
            const recent = assessments?.slice(0, 3) || [];

            setStats({ total, draft, published, recent });
        } catch (error: unknown) {
            console.error("Erro ao carregar estatísticas:", error);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    const getStatusBadge = (status: string) => {
        const variants = {
            draft: "secondary",
            published: "default",
            archived: "outline",
        } as const;

        const labels = {
            draft: "Rascunho",
            published: "Publicada",
            archived: "Arquivada",
        };

        return (
            <Badge variant={variants[status as keyof typeof variants] || "secondary"} className="text-xs">
                {labels[status as keyof typeof labels] || status}
            </Badge>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <BookOpen className="h-8 w-8 text-primary mx-auto mb-4 animate-pulse" />
                    <p className="text-muted-foreground">Carregando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border bg-card">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <BookOpen className="h-6 w-6 text-primary" />
                            <span className="text-lg font-semibold">ProvaFácil AI</span>
                        </div>
                        <UserMenu />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
                        <p className="text-muted-foreground">
                            Bem-vindo de volta! Crie suas avaliações de forma rápida e inteligente.
                        </p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid gap-4 md:grid-cols-3 mb-8">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total de Avaliações</CardTitle>
                                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.total}</div>
                                <p className="text-xs text-muted-foreground">
                                    {stats.total === 1 ? "avaliação criada" : "avaliações criadas"}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Rascunhos</CardTitle>
                                <FileText className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.draft}</div>
                                <p className="text-xs text-muted-foreground">aguardando finalização</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Publicadas</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.published}</div>
                                <p className="text-xs text-muted-foreground">prontas para uso</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Assessments */}
                    {stats.recent.length > 0 && (
                        <div className="mb-8">
                            <h2 className="text-xl font-semibold mb-4">Avaliações Recentes</h2>
                            <div className="space-y-3">
                                {stats.recent.map((assessment) => (
                                    <Card key={assessment.id} className="hover:shadow-md transition-shadow">
                                        <CardContent className="py-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <h3 className="font-medium">{assessment.title}</h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Calendar className="h-3 w-3 text-muted-foreground" />
                                                        <span className="text-sm text-muted-foreground">
                                                            {formatDate(assessment.created_at)}
                                                        </span>
                                                        {getStatusBadge(assessment.status)}
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => navigate({ to: "/my-assessments" })}
                                                >
                                                    Ver Detalhes
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action Cards */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {/* Create Assessment Card */}
                        <Card
                            className="border-primary/20 hover:border-primary/40 transition-colors cursor-pointer"
                            onClick={() => navigate({ to: "/new-assessment" })}
                        >
                            <CardHeader className="text-center">
                                <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                                    <Upload className="h-6 w-6 text-primary" />
                                </div>
                                <CardTitle>Nova Avaliação</CardTitle>
                                <CardDescription>Faça upload de um PDF e gere questões automaticamente</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button
                                    className="w-full"
                                    variant="default"
                                    onClick={() => navigate({ to: "/new-assessment" })}
                                >
                                    Começar
                                </Button>
                            </CardContent>
                        </Card>

                        {/* My Assessments Card */}
                        <Card
                            className="hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => navigate({ to: "/my-assessments" })}
                        >
                            <CardHeader className="text-center">
                                <div className="mx-auto mb-4 p-3 bg-secondary/10 rounded-full w-fit">
                                    <FileText className="h-6 w-6 text-secondary-foreground" />
                                </div>
                                <CardTitle>Minhas Avaliações</CardTitle>
                                <CardDescription>Visualize e gerencie suas avaliações criadas</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button
                                    className="w-full"
                                    variant="outline"
                                    onClick={() => navigate({ to: "/my-assessments" })}
                                >
                                    Ver Avaliações ({stats.total})
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Templates Card */}
                        <Card className="cursor-pointer" onClick={() => navigate({ to: "/templates" })}>
                            <CardHeader className="text-center">
                                <div className="mx-auto mb-4 p-3 bg-muted/10 rounded-full w-fit">
                                    <BookOpen className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <CardTitle>Modelos</CardTitle>
                                <CardDescription>Use modelos pré-definidos para acelerar a criação</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button
                                    className="w-full"
                                    variant="outline"
                                    onClick={() => navigate({ to: "/templates" })}
                                >
                                    Explorar Modelos
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
