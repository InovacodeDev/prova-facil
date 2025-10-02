"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";

const plans = [
    {
        id: "starter",
        name: "Starter",
        price: "Grátis",
        description: "Para começar a criar questões",
        aiLevel: "IA Básica",
        features: [
            "Apenas múltipla escolha",
            "Máximo de 20 questões por matéria/mês",
            "Upload: TXT, PDF (até 5MB)",
            "IA com capacidade fundamental",
            "Suporte por email",
        ],
        cta: "Começar Grátis",
        highlighted: false,
    },
    {
        id: "basic",
        name: "Basic",
        price: "R$ 29,90",
        period: "/mês",
        description: "Para professores iniciantes",
        aiLevel: "IA Básica",
        features: [
            "Múltipla escolha e dissertativo",
            "Máximo de 50 questões por matéria/mês",
            "Upload: TXT, PDF, DOCX (até 10MB)",
            "IA com capacidade fundamental",
            "Suporte prioritário",
        ],
        cta: "Começar Agora",
        highlighted: false,
    },
    {
        id: "essentials",
        name: "Essentials",
        price: "R$ 49,90",
        period: "/mês",
        description: "Para professores ativos",
        aiLevel: "IA Avançada",
        features: [
            "Todos os tipos exceto somatória",
            "Máximo de 100 questões por matéria/mês",
            "Upload: TXT, PDF, DOCX, Links (até 20MB)",
            "IA com processamento avançado",
            "Suporte prioritário",
            "Estatísticas avançadas",
        ],
        cta: "Começar Agora",
        highlighted: false,
    },
    {
        id: "plus",
        name: "Plus",
        price: "R$ 79,90",
        period: "/mês",
        description: "Para professores profissionais",
        aiLevel: "IA Avançada",
        features: [
            "Todos os tipos de questões",
            "Máximo de 300 questões por matéria/mês",
            "Upload: Todos os formatos (até 50MB)",
            "IA com processamento avançado",
            "Suporte prioritário VIP",
            "Estatísticas avançadas",
        ],
        cta: "Começar Agora",
        highlighted: false,
    },
    {
        id: "advanced",
        name: "Advanced",
        price: "R$ 129,90",
        period: "/mês",
        description: "Para professores universitários",
        aiLevel: "IA Premium",
        features: [
            "Todos os tipos de questões",
            "Máximo de 300 questões por matéria/mês",
            "Upload: Todos os formatos (até 100MB)",
            "IA com máxima capacidade e precisão",
            "Matérias específicas por área",
            "Suporte prioritário VIP",
            "Estatísticas avançadas",
        ],
        cta: "Começar Agora",
        highlighted: true,
    },
];

export function Pricing() {
    const router = useRouter();

    const handlePlanClick = (planId: string) => {
        router.push("/auth");
    };

    return (
        <section id="pricing" className="py-20 bg-muted/50">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Planos e Preços</h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Escolha o plano ideal para suas necessidades. Comece grátis e faça upgrade quando precisar.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-7xl mx-auto">
                    {plans.map((plan) => (
                        <Card
                            key={plan.id}
                            className={`relative flex flex-col ${
                                plan.highlighted ? "border-primary shadow-lg md:scale-105" : "border-border"
                            }`}
                        >
                            {plan.highlighted && (
                                <div className="absolute -top-4 left-0 right-0 text-center">
                                    <Badge className="bg-primary text-primary-foreground">Recomendado</Badge>
                                </div>
                            )}

                            <CardHeader>
                                <div className="flex items-center justify-between mb-2">
                                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                                    <Badge variant="outline" className="text-xs">
                                        {plan.aiLevel}
                                    </Badge>
                                </div>
                                <CardDescription className="text-xs">{plan.description}</CardDescription>
                                <div className="mt-4">
                                    <span className="text-3xl font-bold">{plan.price}</span>
                                    {plan.period && (
                                        <span className="text-sm text-muted-foreground">{plan.period}</span>
                                    )}
                                </div>
                            </CardHeader>

                            <CardContent className="flex-grow">
                                <ul className="space-y-2">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-start gap-2">
                                            <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                            <span className="text-xs">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>

                            <CardFooter>
                                <Button
                                    className="w-full"
                                    variant={plan.highlighted ? "default" : "outline"}
                                    onClick={() => handlePlanClick(plan.id)}
                                >
                                    {plan.cta}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
