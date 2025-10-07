"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Target } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface StatsData {
    totals: {
        questionsGenerated: number;
        questionsCopied: number;
        totalActions: number;
        uniqueAssessments: number;
        meanQuestionsPerAssessment: number;
    };
}

export const Hero = () => {
    const [stats, setStats] = useState<StatsData | null>(null);
    const router = useRouter();

    useEffect(() => {
        // Fetch stats from API
        fetch("/api/stats")
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    setStats(data.data);
                }
            })
            .catch((error) => console.error("Error fetching stats:", error));
    }, []);

    const formatNumber = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    const questionsGenerated = stats?.totals.questionsGenerated || 0;
    const usersCount = Math.ceil(questionsGenerated / 10); // Aproximação de usuários
    const uniqueAssessments = stats?.totals.uniqueAssessments || 0;
    const meanQuestionsPerAssessment = stats?.totals.meanQuestionsPerAssessment || 0;

    return (
        <section className="relative py-20 lg:py-32 overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-muted via-background to-accent-muted"></div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Content */}
                    <div className="space-y-8">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-muted text-primary font-medium text-sm">
                            <Sparkles className="w-4 h-4" />
                            Powered by IA Avançada
                        </div>

                        {/* Headlines */}
                        <div className="space-y-4">
                            <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                                Crie provas em{" "}
                                <span className="bg-gradient-primary bg-clip-text text-transparent">segundos</span>, não
                                horas
                            </h1>
                            <p className="text-xl text-muted-foreground max-w-xl">
                                Transforme qualquer material didático em avaliações diversificadas e personalizadas.
                                Economize 90% do seu tempo de preparação com nossa IA especializada em educação.
                            </p>
                        </div>

                        {/* Stats */}
                        <div className="flex flex-wrap gap-8">
                            <div className="flex items-center gap-2">
                                <Target className="w-5 h-5 text-secondary" />
                                <span className="text-sm font-medium text-foreground">100% personalizado</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-accent" />
                                <span className="text-sm font-medium text-foreground">Qualidade garantida</span>
                            </div>
                        </div>

                        {/* CTAs */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button variant="hero" size="lg" className="text-base" onClick={() => router.push("/auth")}>
                                Gerar Minha Primeira Prova
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                className="text-base"
                                onClick={() => router.push("/support")}
                            >
                                Ver Demonstração
                            </Button>
                        </div>

                        {/* Social Proof */}
                        <div className="pt-8 border-t border-border space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-2xl font-bold text-primary">
                                        {questionsGenerated > 0 ? formatNumber(questionsGenerated) : "---"}
                                    </p>
                                    <p className="text-sm text-muted-foreground">Questões geradas</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-2xl font-bold text-primary">
                                        {uniqueAssessments > 0 ? formatNumber(uniqueAssessments) : "---"}
                                    </p>
                                    <p className="text-sm text-muted-foreground">Conteúdos avaliados</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-2xl font-bold text-primary">
                                        {usersCount > 0 ? formatNumber(usersCount) : "---"}
                                    </p>
                                    <p className="text-sm text-muted-foreground">Educadores ativos</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-2xl font-bold text-primary">
                                        {meanQuestionsPerAssessment > 0 ? meanQuestionsPerAssessment.toFixed(1) : "---"}
                                    </p>
                                    <p className="text-sm text-muted-foreground">Questões por conteúdo</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6 pt-4">
                                <div className="text-2xl font-bold text-primary">4.9★</div>
                                <div className="text-sm text-muted-foreground">
                                    "Revolucionou minha rotina de preparação"
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Hero Image */}
                    <div className="relative">
                        <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                            <img
                                src="/assets/hero-education.jpg"
                                alt="Professor criando avaliações com IA"
                                className="w-full h-auto object-cover"
                                loading="eager"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
