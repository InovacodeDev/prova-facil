"use client";

import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Users, Zap, Shield } from "lucide-react";

const values = [
    {
        icon: BookOpen,
        title: "Educação de Qualidade",
        description: "Comprometidos em facilitar a criação de avaliações pedagógicas eficazes e inovadoras.",
    },
    {
        icon: Users,
        title: "Comunidade",
        description: "Conectamos educadores de todo o Brasil, promovendo compartilhamento de conhecimento.",
    },
    {
        icon: Zap,
        title: "Tecnologia Simples",
        description: "Ferramentas intuitivas que economizam tempo e aumentam a produtividade dos educadores.",
    },
    {
        icon: Shield,
        title: "Segurança e Privacidade",
        description: "Seus dados e os de seus alunos estão protegidos com os mais altos padrões de segurança.",
    },
];

export function About() {
    return (
        <section id="about" className="py-20 bg-background">
            <div className="container mx-auto px-4">
                <div className="max-w-3xl mx-auto text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Sobre o Prova Fácil</h2>
                    <p className="text-lg text-muted-foreground mb-6">
                        Nascemos da necessidade de simplificar o processo de criação de avaliações para educadores.
                        Nossa missão é empoderar professores com tecnologia de ponta, permitindo que se concentrem no
                        que realmente importa: ensinar.
                    </p>
                    <p className="text-lg text-muted-foreground">
                        Com inteligência artificial e uma interface intuitiva, transformamos horas de trabalho em
                        minutos, mantendo a qualidade e personalização que cada turma merece.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                    {values.map((value) => {
                        const Icon = value.icon;
                        return (
                            <Card key={value.title} className="border-border">
                                <CardContent className="pt-6">
                                    <div className="mb-4 flex justify-center">
                                        <div className="p-3 bg-primary/10 rounded-lg">
                                            <Icon className="h-8 w-8 text-primary" />
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-semibold mb-2 text-center">{value.title}</h3>
                                    <p className="text-sm text-muted-foreground text-center">{value.description}</p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
