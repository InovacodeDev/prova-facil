"use client";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, FileText, Mail, Activity, MessageCircle, Search } from "lucide-react";

export default function SupportPage() {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main>
                {/* Hero Section */}
                <section className="py-20 bg-muted/50">
                    <div className="container mx-auto px-4 text-center">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">Central de Suporte</h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                            Estamos aqui para ajudar você. Encontre respostas, documentação e entre em contato com nossa
                            equipe.
                        </p>
                        <div className="max-w-xl mx-auto">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                                <Input placeholder="Pesquisar na base de conhecimento..." className="pl-10 h-12" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Support Options */}
                <section className="py-16">
                    <div className="container mx-auto px-4">
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                            {/* Central de Ajuda */}
                            <Card className="border-border hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <div className="mb-4 flex justify-center">
                                        <div className="p-3 bg-primary/10 rounded-lg">
                                            <BookOpen className="h-8 w-8 text-primary" />
                                        </div>
                                    </div>
                                    <CardTitle className="text-center">Central de Ajuda</CardTitle>
                                    <CardDescription className="text-center">
                                        Artigos e guias para começar
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2 text-sm">
                                        <li>
                                            <a
                                                href="#"
                                                className="text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                Como criar sua primeira prova
                                            </a>
                                        </li>
                                        <li>
                                            <a
                                                href="#"
                                                className="text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                Tipos de questões disponíveis
                                            </a>
                                        </li>
                                        <li>
                                            <a
                                                href="#"
                                                className="text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                Gerenciando seus alunos
                                            </a>
                                        </li>
                                        <li>
                                            <a
                                                href="#"
                                                className="text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                Análise de resultados
                                            </a>
                                        </li>
                                    </ul>
                                    <Button variant="link" className="w-full mt-4 p-0">
                                        Ver todos os artigos →
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Documentação */}
                            <Card className="border-border hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <div className="mb-4 flex justify-center">
                                        <div className="p-3 bg-primary/10 rounded-lg">
                                            <FileText className="h-8 w-8 text-primary" />
                                        </div>
                                    </div>
                                    <CardTitle className="text-center">Documentação</CardTitle>
                                    <CardDescription className="text-center">
                                        Documentação técnica completa
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2 text-sm">
                                        <li>
                                            <a
                                                href="#"
                                                className="text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                Guia de início rápido
                                            </a>
                                        </li>
                                        <li>
                                            <a
                                                href="#"
                                                className="text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                Referência da API
                                            </a>
                                        </li>
                                        <li>
                                            <a
                                                href="#"
                                                className="text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                Integrações
                                            </a>
                                        </li>
                                        <li>
                                            <a
                                                href="#"
                                                className="text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                Webhooks e eventos
                                            </a>
                                        </li>
                                    </ul>
                                    <Button variant="link" className="w-full mt-4 p-0">
                                        Acessar documentação →
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Contato */}
                            <Card className="border-border hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <div className="mb-4 flex justify-center">
                                        <div className="p-3 bg-primary/10 rounded-lg">
                                            <Mail className="h-8 w-8 text-primary" />
                                        </div>
                                    </div>
                                    <CardTitle className="text-center">Contato</CardTitle>
                                    <CardDescription className="text-center">
                                        Fale diretamente com nosso time
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3 text-sm">
                                        <div>
                                            <p className="font-medium mb-1">Email:</p>
                                            <a
                                                href="mailto:suporte@provafacil.ai"
                                                className="text-muted-foreground hover:text-foreground"
                                            >
                                                suporte@provafacil.ai
                                            </a>
                                        </div>
                                        <div>
                                            <p className="font-medium mb-1">Telefone:</p>
                                            <a
                                                href="tel:+551199999999"
                                                className="text-muted-foreground hover:text-foreground"
                                            >
                                                +55 (11) 9999-9999
                                            </a>
                                        </div>
                                        <div>
                                            <p className="font-medium mb-1">Horário:</p>
                                            <p className="text-muted-foreground">Seg-Sex: 9h às 18h</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Status */}
                            <Card className="border-border hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <div className="mb-4 flex justify-center">
                                        <div className="p-3 bg-green-500/10 rounded-lg">
                                            <Activity className="h-8 w-8 text-green-500" />
                                        </div>
                                    </div>
                                    <CardTitle className="text-center">Status do Sistema</CardTitle>
                                    <CardDescription className="text-center">
                                        Verifique o status dos serviços
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex items-center justify-between">
                                            <span>Plataforma</span>
                                            <span className="flex items-center gap-2 text-green-500">
                                                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                                                Operacional
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span>API</span>
                                            <span className="flex items-center gap-2 text-green-500">
                                                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                                                Operacional
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span>Geração IA</span>
                                            <span className="flex items-center gap-2 text-green-500">
                                                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                                                Operacional
                                            </span>
                                        </div>
                                    </div>
                                    <Button variant="link" className="w-full mt-4 p-0">
                                        Ver página de status →
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </section>

                {/* Contact Form */}
                <section className="py-16 bg-muted/50">
                    <div className="container mx-auto px-4">
                        <div className="max-w-2xl mx-auto">
                            <Card>
                                <CardHeader className="text-center">
                                    <div className="mb-4 flex justify-center">
                                        <div className="p-3 bg-primary/10 rounded-lg">
                                            <MessageCircle className="h-8 w-8 text-primary" />
                                        </div>
                                    </div>
                                    <CardTitle>Entre em Contato</CardTitle>
                                    <CardDescription>
                                        Não encontrou o que procurava? Envie-nos uma mensagem e responderemos em breve.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form className="space-y-4">
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label htmlFor="name" className="text-sm font-medium">
                                                    Nome
                                                </label>
                                                <Input id="name" placeholder="Seu nome" />
                                            </div>
                                            <div className="space-y-2">
                                                <label htmlFor="email" className="text-sm font-medium">
                                                    Email
                                                </label>
                                                <Input id="email" type="email" placeholder="seu@email.com" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="subject" className="text-sm font-medium">
                                                Assunto
                                            </label>
                                            <Input id="subject" placeholder="Como podemos ajudar?" />
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="message" className="text-sm font-medium">
                                                Mensagem
                                            </label>
                                            <Textarea
                                                id="message"
                                                placeholder="Descreva sua dúvida ou problema..."
                                                rows={5}
                                            />
                                        </div>
                                        <Button type="submit" className="w-full">
                                            Enviar Mensagem
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </section>

                {/* FAQ Section */}
                <section className="py-16">
                    <div className="container mx-auto px-4">
                        <div className="max-w-3xl mx-auto">
                            <h2 className="text-3xl font-bold text-center mb-8">Perguntas Frequentes</h2>
                            <div className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Como funciona o período de teste?</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-muted-foreground">
                                            Oferecemos 14 dias de teste grátis para todos os nossos planos pagos. Não é
                                            necessário cartão de crédito para começar. Você pode cancelar a qualquer
                                            momento durante o período de teste sem nenhum custo.
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Posso mudar de plano depois?</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-muted-foreground">
                                            Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento.
                                            As alterações são aplicadas imediatamente e o valor é ajustado
                                            proporcionalmente.
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">
                                            Como funciona a geração de questões com IA?
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-muted-foreground">
                                            Nossa IA utiliza modelos de linguagem avançados para gerar questões
                                            personalizadas baseadas no seu conteúdo. Você pode fornecer textos, tópicos
                                            ou documentos e a IA criará questões relevantes e educacionalmente válidas.
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Meus dados estão seguros?</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-muted-foreground">
                                            Sim! Utilizamos criptografia de ponta a ponta e seguimos as melhores
                                            práticas de segurança da indústria. Todos os dados são armazenados em
                                            servidores seguros e estamos em conformidade com a LGPD.
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
