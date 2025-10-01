"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Upload, FileText, TrendingUp, Calendar, BarChart3, PieChart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UserMenu } from "@/components/UserMenu";
import type { User as SupabaseUser } from "@supabase/supabase-js";

// Função global para invalidar cache do dashboard
export const invalidateDashboardCache = () => {
    if (typeof window !== "undefined") {
        localStorage.removeItem("dashboard_stats_cache");
    }
};

interface QuestionStats {
    total: number;
    bySubject: Record<string, { count: number; name: string }>;
    byType: Record<string, number>;
    recent: Array<{
        id: string;
        question: string;
        title: string;
        created_at: string;
    }>;
}

export default function DashboardPage() {
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<QuestionStats>({
        total: 0,
        bySubject: {},
        byType: {},
        recent: [],
    });
    const router = useRouter();
    const { toast } = useToast();
    const supabase = createClient();

    // Cache configuration
    const CACHE_KEY = "dashboard_stats_cache";
    const CACHE_DURATION = 10 * 60 * 1000; // 10 minutos

    useEffect(() => {
        // Verificar se veio da confirmação de email
        const searchParams = new URLSearchParams(window.location.search);
        const confirmed = searchParams.get("confirmed");

        if (confirmed === "true") {
            toast({
                title: "Email confirmado com sucesso!",
                description: "Bem-vindo à plataforma Prova Fácil. Agora você pode começar a criar suas avaliações.",
                duration: 8000,
            });
            // Limpar o parâmetro da URL
            window.history.replaceState({}, "", "/dashboard");
        }

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);

            if (!session) {
                router.push("/auth");
            } else {
                fetchStatsWithCache(session.user.id);
            }
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user ?? null);
            if (!session) {
                router.push("/auth");
            } else {
                fetchStatsWithCache(session.user.id);
            }
        });

        return () => subscription.unsubscribe();
    }, [router]);

    const fetchStatsWithCache = async (userId: string) => {
        try {
            // Verificar cache
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                const now = Date.now();

                // Se cache válido (menos de 10 minutos), usar dados cacheados
                if (now - timestamp < CACHE_DURATION) {
                    setStats(data);
                    return;
                }
            }

            // Se cache inválido ou inexistente, buscar novos dados
            await fetchStats(userId);
        } catch (error) {
            console.error("Erro ao carregar cache:", error);
            await fetchStats(userId);
        }
    };

    const fetchStats = async (userId: string) => {
        try {
            // Buscar o profile do usuário
            const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", userId).single();

            if (!profile) return;

            // Buscar todas as questões com suas respostas, avaliações e matérias
            const { data: questionsData, error } = await supabase
                .from("questions")
                .select(
                    `
                    id,
                    question,
                    type,
                    created_at,
                    assessments!inner (
                        id,
                        title,
                        user_id,
                        subjects (
                            id,
                            name
                        )
                    )
                `
                )
                .eq("assessments.user_id", profile.id)
                .order("created_at", { ascending: false });

            if (error) throw error;

            const total = questionsData?.length || 0;
            const recent =
                questionsData?.slice(0, 3).map((q: any) => ({
                    id: q.id,
                    question: q.question,
                    title: q.assessments?.title || "Sem título",
                    created_at: q.created_at,
                })) || [];

            // Agrupar por matéria
            const bySubject: Record<string, { count: number; name: string }> = {};
            questionsData?.forEach((q: any) => {
                const subject = q.assessments?.subjects;
                if (subject) {
                    if (!bySubject[subject.id]) {
                        bySubject[subject.id] = { count: 0, name: subject.name };
                    }
                    bySubject[subject.id].count++;
                }
            });

            // Agrupar por tipo
            const byType: Record<string, number> = {};
            questionsData?.forEach((q: any) => {
                const type = q.type || "unknown";
                byType[type] = (byType[type] || 0) + 1;
            });

            setStats({ total, bySubject, byType, recent });

            // Salvar no cache
            localStorage.setItem(
                CACHE_KEY,
                JSON.stringify({
                    data: { total, bySubject, byType, recent },
                    timestamp: Date.now(),
                })
            );
        } catch (error: any) {
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
                <div className="max-w-6xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
                        <p className="text-muted-foreground">
                            Bem-vindo de volta! Crie suas questões de forma rápida e inteligente.
                        </p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid gap-4 md:grid-cols-3 mb-8">
                        <Card className="transition-all hover:shadow-lg hover:scale-105">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total de Questões</CardTitle>
                                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.total}</div>
                                <p className="text-xs text-muted-foreground">
                                    {stats.total === 1 ? "questão criada" : "questões criadas"}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Gráfico de Pizza - Questões por Matéria */}
                        <Card className="md:col-span-1 transition-all hover:shadow-lg hover:scale-105">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Por Matéria</CardTitle>
                                <PieChart className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {Object.entries(stats.bySubject).length > 0 ? (
                                        (() => {
                                            const entries = Object.entries(stats.bySubject)
                                                .sort((a, b) => b[1].count - a[1].count)
                                                .slice(0, 3);
                                            const itemCount = entries.length;
                                            // Ajustar tamanho de fonte baseado na quantidade:
                                            // 1-2 itens: text-sm (14px), 3+ itens: text-xs (12px), máximo: text-[10px]
                                            const fontSize =
                                                itemCount <= 2 ? "text-sm" : itemCount <= 4 ? "text-xs" : "text-[10px]";
                                            return entries.map(([id, data]) => (
                                                <div key={id} className="flex items-center justify-between">
                                                    <span
                                                        className={`${fontSize} text-muted-foreground truncate flex-1`}
                                                    >
                                                        {data.name}
                                                    </span>
                                                    <span className={`${fontSize} font-semibold ml-2`}>
                                                        {data.count}
                                                    </span>
                                                </div>
                                            ));
                                        })()
                                    ) : (
                                        <p className="text-xs text-muted-foreground">Nenhuma questão ainda</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Gráfico de Barras - Tipos de Questões */}
                        <Card className="md:col-span-1 transition-all hover:shadow-lg hover:scale-105">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Por Tipo</CardTitle>
                                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {Object.entries(stats.byType).length > 0 ? (
                                        (() => {
                                            const entries = Object.entries(stats.byType).sort((a, b) => b[1] - a[1]);
                                            const itemCount = entries.length;
                                            const fontSize =
                                                itemCount <= 2 ? "text-sm" : itemCount <= 4 ? "text-xs" : "text-[10px]";
                                            const typeLabels: Record<string, string> = {
                                                multiple_choice: "Múltipla Escolha",
                                                true_false: "V ou F",
                                                open: "Dissertativa",
                                                sum: "Somatória",
                                            };
                                            return entries.map(([type, count]) => (
                                                <div key={type} className="flex items-center justify-between">
                                                    <span
                                                        className={`${fontSize} text-muted-foreground truncate flex-1`}
                                                    >
                                                        {typeLabels[type] || type}
                                                    </span>
                                                    <span className={`${fontSize} font-semibold ml-2`}>{count}</span>
                                                </div>
                                            ));
                                        })()
                                    ) : (
                                        <p className="text-xs text-muted-foreground">Nenhuma questão ainda</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Questions */}
                    {stats.recent.length > 0 && (
                        <div className="mb-8">
                            <h2 className="text-xl font-semibold mb-4">Questões Recentes</h2>
                            <div className="space-y-3">
                                {stats.recent.map((question) => (
                                    <Card key={question.id} className="hover:shadow-md transition-shadow">
                                        <CardContent className="py-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <h3 className="font-medium line-clamp-1">{question.question}</h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Calendar className="h-3 w-3 text-muted-foreground" />
                                                        <span className="text-sm text-muted-foreground">
                                                            {formatDate(question.created_at)}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            • {question.title}
                                                        </span>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => router.push("/my-assessments")}
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
                        {/* Create Question Card */}
                        <Card
                            className="border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg hover:scale-105 cursor-pointer"
                            onClick={() => router.push("/new-assessment")}
                        >
                            <CardHeader className="text-center">
                                <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                                    <Upload className="h-6 w-6 text-primary" />
                                </div>
                                <CardTitle>Nova Questão</CardTitle>
                                <CardDescription>Faça upload de um PDF e gere questões automaticamente</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button className="w-full" variant="default">
                                    Começar
                                </Button>
                            </CardContent>
                        </Card>

                        {/* My Questions Card */}
                        <Card
                            className="hover:shadow-lg transition-all hover:scale-105 cursor-pointer"
                            onClick={() => router.push("/my-assessments")}
                        >
                            <CardHeader className="text-center">
                                <div className="mx-auto mb-4 p-3 bg-secondary/10 rounded-full w-fit">
                                    <FileText className="h-6 w-6 text-secondary-foreground" />
                                </div>
                                <CardTitle>Minhas Questões</CardTitle>
                                <CardDescription>Visualize e gerencie suas questões criadas</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button className="w-full" variant="outline">
                                    Ver Questões ({stats.total})
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Templates Card */}
                        <Card
                            className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
                            onClick={() => router.push("/templates")}
                        >
                            <CardHeader className="text-center">
                                <div className="mx-auto mb-4 p-3 bg-muted/10 rounded-full w-fit">
                                    <BookOpen className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <CardTitle>Modelos</CardTitle>
                                <CardDescription>Use modelos pré-definidos para acelerar a criação</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button className="w-full" variant="outline">
                                    Explorar Modelos
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
