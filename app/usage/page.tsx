"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, BarChart3, Loader2, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { UserMenu } from "@/components/UserMenu";

interface PlanLimits {
    questionLimit: number;
    allowedTypes: string[];
}

interface UsageData {
    subject: string;
    count: number;
}

const PLAN_LIMITS: Record<string, PlanLimits> = {
    starter: {
        questionLimit: 20,
        allowedTypes: ["multiple_choice"],
    },
    basic: {
        questionLimit: 50,
        allowedTypes: ["multiple_choice", "open"],
    },
    essentials: {
        questionLimit: 100,
        allowedTypes: ["multiple_choice", "true_false", "open"],
    },
    plus: {
        questionLimit: 300,
        allowedTypes: ["multiple_choice", "true_false", "open", "sum"],
    },
    advanced: {
        questionLimit: 300,
        allowedTypes: ["multiple_choice", "true_false", "open", "sum"],
    },
};

export default function UsagePage() {
    const [plan, setPlan] = useState<string>("starter");
    const [usageData, setUsageData] = useState<UsageData[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { toast } = useToast();
    const supabase = createClient();

    useEffect(() => {
        fetchUsageData();
    }, []);

    const fetchUsageData = async () => {
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                router.push("/auth");
                return;
            }

            // Buscar plano do usuário
            const { data: profileData, error: profileError } = await supabase
                .from("profiles")
                .select("plan")
                .eq("user_id", user.id)
                .single();

            if (profileError) throw profileError;

            if (profileData) {
                setPlan(profileData.plan);
            }

            // Buscar contagem de questões por matéria no mês atual
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const { data: questionsData, error: questionsError } = await supabase
                .from("questions")
                .select(
                    `
          id,
          assessments!inner (
            id,
            user_id,
            created_at,
            categories (
              id,
              name
            )
          )
        `
                )
                .eq("assessments.user_id", user.id)
                .gte("assessments.created_at", startOfMonth.toISOString());

            if (questionsError) throw questionsError;

            // Agrupar por matéria
            const usage: Record<string, number> = {};

            if (questionsData) {
                questionsData.forEach((q: any) => {
                    const category = q.assessments?.categories;
                    if (category) {
                        const subjectName = category.name || "Sem matéria";
                        usage[subjectName] = (usage[subjectName] || 0) + 1;
                    }
                });
            }

            const usageArray = Object.entries(usage).map(([subject, count]) => ({
                subject,
                count,
            }));

            setUsageData(usageArray);
        } catch (error: any) {
            console.error("Erro ao carregar dados de uso:", error);
            toast({
                title: "Erro",
                description: "Não foi possível carregar os dados de uso.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
        );
    }

    const planLimits = PLAN_LIMITS[plan];
    const totalUsed = usageData.reduce((acc, curr) => acc + curr.count, 0);

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border bg-card">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Voltar
                            </Button>
                            <div className="flex items-center gap-2">
                                <BarChart3 className="h-6 w-6 text-primary" />
                                <span className="text-lg font-semibold">Cota de Uso</span>
                            </div>
                        </div>
                        <UserMenu />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Resumo Geral */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-primary" />
                                Resumo do Mês Atual
                            </CardTitle>
                            <CardDescription>
                                Plano: <span className="font-semibold capitalize">{plan}</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">Uso Total de Questões</span>
                                    <span className="text-sm text-muted-foreground">{totalUsed} / ∞ (por matéria)</span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Limite de {planLimits.questionLimit} questões por matéria por mês
                                </p>
                            </div>

                            <div className="pt-4 border-t">
                                <h4 className="text-sm font-medium mb-2">Tipos de Questões Disponíveis:</h4>
                                <div className="flex flex-wrap gap-2">
                                    {planLimits.allowedTypes.map((type) => (
                                        <span
                                            key={type}
                                            className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium"
                                        >
                                            {type === "multiple_choice" && "Múltipla Escolha"}
                                            {type === "true_false" && "Verdadeiro/Falso"}
                                            {type === "open" && "Dissertativo"}
                                            {type === "sum" && "Somatória"}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Uso por Matéria */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Uso por Matéria</CardTitle>
                            <CardDescription>Questões criadas por matéria no mês atual</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {usageData.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">
                                    Nenhuma questão criada este mês
                                </p>
                            ) : (
                                usageData.map((usage) => {
                                    const percentage = (usage.count / planLimits.questionLimit) * 100;
                                    const isNearLimit = percentage >= 80;
                                    const isOverLimit = percentage > 100;

                                    return (
                                        <div key={usage.subject} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium">{usage.subject}</span>
                                                <span
                                                    className={`text-sm ${
                                                        isOverLimit
                                                            ? "text-destructive font-semibold"
                                                            : isNearLimit
                                                            ? "text-yellow-600 font-semibold"
                                                            : "text-muted-foreground"
                                                    }`}
                                                >
                                                    {usage.count} / {planLimits.questionLimit}
                                                </span>
                                            </div>
                                            <Progress
                                                value={Math.min(percentage, 100)}
                                                className={
                                                    isOverLimit
                                                        ? "[&>div]:bg-destructive"
                                                        : isNearLimit
                                                        ? "[&>div]:bg-yellow-500"
                                                        : ""
                                                }
                                            />
                                            {isOverLimit && (
                                                <p className="text-xs text-destructive">
                                                    Limite excedido! Considere fazer upgrade do plano.
                                                </p>
                                            )}
                                            {isNearLimit && !isOverLimit && (
                                                <p className="text-xs text-yellow-600">Você está próximo do limite.</p>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </CardContent>
                    </Card>

                    {/* Call to Action */}
                    {totalUsed > 0 && (
                        <Card className="bg-primary/5 border-primary/20">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold mb-1">Precisa de mais questões?</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Faça upgrade do seu plano e crie mais questões por mês
                                        </p>
                                    </div>
                                    <Button onClick={() => router.push("/plan")}>Ver Planos</Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>
        </div>
    );
}
