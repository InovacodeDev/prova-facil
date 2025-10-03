"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, TrendingUp, BarChart3, PieChart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UserMenu } from "@/components/UserMenu";
import { ProvaFacilLogo } from "@/assets/logo";
import { DashboardSkeleton } from "@/components/ui/loading";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface QuestionStats {
    total: number;
    bySubject: Record<string, { count: number; name: string }>;
    byType: Record<string, number>;
    totalCopies: number;
    uniqueQuestionsCopied: number;
    mostCopiedQuestion?: {
        id: string;
        question: string;
        copyCount: number;
    };
}

export default function DashboardPage() {
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<QuestionStats>({
        total: 0,
        bySubject: {},
        byType: {},
        totalCopies: 0,
        uniqueQuestionsCopied: 0,
    });
    const [monthlyUsage, setMonthlyUsage] = useState(0);
    const [monthlyLimit, setMonthlyLimit] = useState(30);
    const [planName, setPlanName] = useState("Starter");
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
            // Buscar o profile do usuário com plano
            const { data: profile } = await supabase.from("profiles").select("id, plan").eq("user_id", userId).single();

            if (!profile) return;

            // Buscar dados do plano
            const { data: planData } = await supabase
                .from("plans")
                .select("id, questions_month")
                .eq("id", profile.plan)
                .single();

            if (planData) {
                setPlanName(planData.id.charAt(0).toUpperCase() + planData.id.slice(1));
                setMonthlyLimit(planData.questions_month || 30);
            }

            // Buscar uso mensal do ciclo atual
            const now = new Date();
            const cycle = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

            const { data: cycleData } = await supabase
                .from("profile_logs_cycle")
                .select("total_questions")
                .eq("user_id", profile.id)
                .eq("cycle", cycle)
                .maybeSingle();

            setMonthlyUsage(cycleData?.total_questions || 0);

            // Buscar todas as questões com copy_count e informações de cópia
            const { data: questionsData, error } = await supabase
                .from("questions")
                .select(
                    `
                    id,
                    question,
                    type,
                    copy_count,
                    created_at,
                    assessments!inner (
                        id,
                        title,
                        user_id,
                        subject
                    )
                `
                )
                .eq("assessments.user_id", profile.id)
                .order("created_at", { ascending: false });

            if (error) throw error;

            const total = questionsData?.length || 0;

            // Calcular estatísticas de cópias
            const totalCopies = questionsData?.reduce((sum, q: any) => sum + (q.copy_count || 0), 0) || 0;
            const uniqueQuestionsCopied = questionsData?.filter((q: any) => (q.copy_count || 0) > 0).length || 0;

            // Encontrar questão mais copiada
            const mostCopied = questionsData?.reduce((max: any, q: any) => {
                return (q.copy_count || 0) > (max?.copy_count || 0) ? q : max;
            }, null);

            const mostCopiedQuestion =
                mostCopied && mostCopied.copy_count > 0
                    ? {
                          id: mostCopied.id,
                          question: mostCopied.question,
                          copyCount: mostCopied.copy_count,
                      }
                    : undefined;

            // Agrupar por matéria (subject é uma string, não um objeto)
            const bySubject: Record<string, { count: number; name: string }> = {};
            questionsData?.forEach((q: any) => {
                const subject = q.assessments?.subject;
                if (subject && typeof subject === "string") {
                    if (!bySubject[subject]) {
                        bySubject[subject] = { count: 0, name: subject };
                    }
                    bySubject[subject].count++;
                }
            });

            // Agrupar por tipo
            const byType: Record<string, number> = {};
            questionsData?.forEach((q: any) => {
                const type = q.type || "unknown";
                byType[type] = (byType[type] || 0) + 1;
            });

            setStats({
                total,
                bySubject,
                byType,
                totalCopies,
                uniqueQuestionsCopied,
                mostCopiedQuestion,
            });

            // Salvar no cache
            localStorage.setItem(
                CACHE_KEY,
                JSON.stringify({
                    data: {
                        total,
                        bySubject,
                        byType,
                        totalCopies,
                        uniqueQuestionsCopied,
                        mostCopiedQuestion,
                    },
                    timestamp: Date.now(),
                })
            );
        } catch (error: any) {
            console.error("Erro ao carregar estatísticas:", error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                {/* Header */}
                <header className="border-b border-border bg-card">
                    <div className="container mx-auto px-4 py-4">
                        <div className="flex items-center justify-between">
                            <ProvaFacilLogo className="h-6" />
                            <UserMenu />
                        </div>
                    </div>
                </header>

                {/* Loading Skeleton */}
                <main>
                    <DashboardSkeleton />
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border bg-card">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <ProvaFacilLogo className="h-6" />
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
                        <Card className="transition-all hover:shadow-lg hover:scale-105 border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/20">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total de Questões</CardTitle>
                                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {stats.total === 1 ? "questão criada" : "questões criadas"}
                                </p>
                                {/* Mini progress bar */}
                                <div className="mt-3 h-2 bg-blue-100 dark:bg-blue-900/30 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 transition-all duration-500"
                                        style={{ width: `${Math.min((stats.total / 100) * 100, 100)}%` }}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Gráfico de Pizza - Questões por Matéria */}
                        <Card className="md:col-span-1 transition-all hover:shadow-lg hover:scale-105 border-l-4 border-l-green-500 bg-gradient-to-br from-green-50/50 to-transparent dark:from-green-950/20">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Por Matéria</CardTitle>
                                <div className="p-2.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                    <PieChart className="h-4 w-4 text-green-600 dark:text-green-400" />
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="space-y-2">
                                    {Object.entries(stats.bySubject).length > 0 ? (
                                        (() => {
                                            const entries = Object.entries(stats.bySubject)
                                                .sort((a, b) => b[1].count - a[1].count)
                                                .slice(0, 3);
                                            const total = entries.reduce((sum, [, data]) => sum + data.count, 0);
                                            const colors = ["bg-green-500", "bg-green-400", "bg-green-300"];
                                            return entries.map(([id, data], index) => {
                                                const percentage = Math.round((data.count / total) * 100);
                                                return (
                                                    <div key={id} className="space-y-1">
                                                        <div className="flex items-center justify-between text-xs">
                                                            <span className="text-muted-foreground truncate flex-1">
                                                                {data.name}
                                                            </span>
                                                            <span className="font-semibold ml-2 text-green-600 dark:text-green-400">
                                                                {data.count} ({percentage}%)
                                                            </span>
                                                        </div>
                                                        <div className="h-2 bg-green-100 dark:bg-green-900/30 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full ${colors[index]} transition-all duration-500`}
                                                                style={{ width: `${percentage}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            });
                                        })()
                                    ) : (
                                        <p className="text-xs text-muted-foreground">Nenhuma questão ainda</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Gráfico de Barras - Tipos de Questões */}
                        <Card className="md:col-span-1 transition-all hover:shadow-lg hover:scale-105 border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-950/20">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Por Tipo</CardTitle>
                                <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                    <BarChart3 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="space-y-2">
                                    {Object.entries(stats.byType).length > 0 ? (
                                        (() => {
                                            const entries = Object.entries(stats.byType)
                                                .sort((a, b) => b[1] - a[1])
                                                .slice(0, 3);
                                            const maxCount = Math.max(...entries.map(([, count]) => count));
                                            const typeLabels: Record<string, string> = {
                                                multiple_choice: "Múltipla Escolha",
                                                true_false: "V ou F",
                                                open: "Dissertativa",
                                                sum: "Somatória",
                                                fill_in_the_blank: "Preencher Lacunas",
                                                matching_columns: "Relacionar Colunas",
                                                problem_solving: "Resolução de Problemas",
                                                essay: "Redação",
                                                project_based: "Projeto",
                                                gamified: "Gamificada",
                                                summative: "Avaliativa",
                                            };
                                            const colors = ["bg-purple-500", "bg-purple-400", "bg-purple-300"];
                                            return entries.map(([type, count], index) => {
                                                const percentage = Math.round((count / maxCount) * 100);
                                                return (
                                                    <div key={type} className="space-y-1">
                                                        <div className="flex items-center justify-between text-xs">
                                                            <span className="text-muted-foreground truncate flex-1">
                                                                {typeLabels[type] || type}
                                                            </span>
                                                            <span className="font-semibold ml-2 text-purple-600 dark:text-purple-400">
                                                                {count}
                                                            </span>
                                                        </div>
                                                        <div className="h-2 bg-purple-100 dark:bg-purple-900/30 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full ${colors[index]} transition-all duration-500`}
                                                                style={{ width: `${percentage}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            });
                                        })()
                                    ) : (
                                        <p className="text-xs text-muted-foreground">Nenhuma questão ainda</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Monthly Usage and Copy Insights Row */}
                    <div className="grid gap-4 md:grid-cols-3 mb-8">
                        {/* Monthly Usage Card */}
                        <Card className="transition-all hover:shadow-lg border-l-4 border-l-orange-500 bg-gradient-to-br from-orange-50/50 to-transparent dark:from-orange-950/20">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <div>
                                    <CardTitle className="text-sm font-medium">Uso Mensal</CardTitle>
                                    <CardDescription className="text-xs mt-1">Plano {planName}</CardDescription>
                                </div>
                                <div className="p-2.5 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                    <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="space-y-3">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                                            {monthlyUsage}
                                        </span>
                                        <span className="text-lg text-muted-foreground">/ {monthlyLimit}</span>
                                        <span className="text-xs text-muted-foreground ml-auto">
                                            {Math.round((monthlyUsage / monthlyLimit) * 100)}% usado
                                        </span>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="h-2 bg-orange-100 dark:bg-orange-900/30 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-500 ${
                                                monthlyUsage / monthlyLimit > 0.9
                                                    ? "bg-red-500"
                                                    : monthlyUsage / monthlyLimit > 0.7
                                                    ? "bg-orange-500"
                                                    : "bg-green-500"
                                            }`}
                                            style={{ width: `${Math.min((monthlyUsage / monthlyLimit) * 100, 100)}%` }}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>
                                            Restam{" "}
                                            <strong className="text-orange-600 dark:text-orange-400">
                                                {Math.max(0, monthlyLimit - monthlyUsage)}
                                            </strong>{" "}
                                            questões
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Total Copies Card */}
                        <Card className="transition-all hover:shadow-lg border-l-4 border-l-cyan-500 bg-gradient-to-br from-cyan-50/50 to-transparent dark:from-cyan-950/20">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total de Cópias</CardTitle>
                                <div className="p-2.5 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                                    <FileText className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">
                                    {stats.totalCopies}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {stats.totalCopies === 1 ? "cópia realizada" : "cópias realizadas"}
                                </p>
                                <div className="mt-3 h-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-cyan-500 transition-all duration-500"
                                        style={{ width: `${Math.min((stats.totalCopies / 50) * 100, 100)}%` }}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Unique Questions Copied Card */}
                        <Card className="transition-all hover:shadow-lg border-l-4 border-l-pink-500 bg-gradient-to-br from-pink-50/50 to-transparent dark:from-pink-950/20">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Questões Únicas Copiadas</CardTitle>
                                <div className="p-2.5 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                                    <TrendingUp className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="text-3xl font-bold text-pink-600 dark:text-pink-400">
                                    {stats.uniqueQuestionsCopied}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">de {stats.total} questões criadas</p>
                                {stats.total > 0 && (
                                    <div className="mt-3">
                                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                            <span>
                                                {Math.round((stats.uniqueQuestionsCopied / stats.total) * 100)}%
                                            </span>
                                        </div>
                                        <div className="h-2 bg-pink-100 dark:bg-pink-900/30 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-pink-500 transition-all duration-500"
                                                style={{
                                                    width: `${(stats.uniqueQuestionsCopied / stats.total) * 100}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

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
                            <CardContent className="pt-4">
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
                            <CardContent className="pt-4">
                                <Button className="w-full" variant="outline">
                                    Ver Questões ({stats.total})
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
