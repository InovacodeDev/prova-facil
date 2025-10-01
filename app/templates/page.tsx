"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ArrowLeft, Search, Filter, FileText, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Template {
    id: string;
    title: string;
    description: string | null;
    category: string | null;
    is_public: boolean;
    created_by: string | null;
    created_at: string;
}

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const router = useRouter();
    const { toast } = useToast();
    const supabase = createClient();

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const { data, error } = await supabase
                .from("templates")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;

            setTemplates(data || []);
        } catch (error: any) {
            console.error("Erro ao carregar modelos:", error);
            toast({
                title: "Erro",
                description: "Não foi possível carregar os modelos.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const filteredTemplates = templates.filter((template) => {
        const matchesSearch =
            template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
        const matchesCategory = categoryFilter === "all" || template.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const categories = [...new Set(templates.map((t) => t.category).filter(Boolean))];

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <BookOpen className="h-8 w-8 text-primary mx-auto mb-4 animate-pulse" />
                    <p className="text-muted-foreground">Carregando modelos...</p>
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
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Voltar
                            </Button>
                            <div className="flex items-center gap-2">
                                <FileText className="h-6 w-6 text-primary" />
                                <span className="text-lg font-semibold">Modelos de Avaliação</span>
                            </div>
                        </div>
                        <Button variant="outline" disabled>
                            <Plus className="h-4 w-4 mr-2" />
                            Criar Modelo
                        </Button>
                    </div>
                </div>
            </header>

            {/* Filters */}
            <div className="border-b border-border bg-card/50">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex gap-4 items-center">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar modelos..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-48">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Categoria" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas as categorias</SelectItem>
                                {categories.map((category) => (
                                    <SelectItem key={category} value={category!}>
                                        {category}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    {filteredTemplates.length === 0 ? (
                        <Card className="text-center py-12">
                            <CardContent>
                                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <CardTitle className="mb-2">
                                    {searchTerm || categoryFilter !== "all"
                                        ? "Nenhum modelo encontrado"
                                        : "Nenhum modelo disponível"}
                                </CardTitle>
                                <CardDescription className="mb-6">
                                    {searchTerm || categoryFilter !== "all"
                                        ? "Tente ajustar os filtros de busca."
                                        : "Os modelos de avaliação estarão disponíveis em breve."}
                                </CardDescription>
                                {searchTerm || categoryFilter !== "all" ? (
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setSearchTerm("");
                                            setCategoryFilter("all");
                                        }}
                                    >
                                        Limpar Filtros
                                    </Button>
                                ) : null}
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {filteredTemplates.map((template) => (
                                <Card key={template.id} className="hover:shadow-md transition-shadow">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-2 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <CardTitle className="text-lg">{template.title}</CardTitle>
                                                    {template.is_public && <Badge variant="secondary">Público</Badge>}
                                                    {template.category && (
                                                        <Badge variant="outline">{template.category}</Badge>
                                                    )}
                                                </div>
                                                {template.description && (
                                                    <CardDescription>{template.description}</CardDescription>
                                                )}
                                                <div className="text-sm text-muted-foreground">
                                                    Criado em {formatDate(template.created_at)}
                                                </div>
                                            </div>
                                            <Button variant="outline" disabled>
                                                Usar Modelo
                                            </Button>
                                        </div>
                                    </CardHeader>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
