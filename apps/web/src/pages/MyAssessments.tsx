import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { dashboardRoute } from "@/router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ArrowLeft, Plus, FileText, Calendar, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Assessment {
    id: string;
    title: string;
    status: string;
    created_at: string;
    // removed description and pdf_filename per schema changes
}

const MyAssessments = () => {
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const navigate = dashboardRoute.useNavigate();
    const { toast } = useToast();

    useEffect(() => {
        const fetchAssessments = async () => {
            try {
                const token = localStorage.getItem("sb_access_token");
                if (!token) {
                    navigate({ to: "/auth" });
                    return;
                }

                const res = await apiFetch("/api/rpc/query", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        table: "assessments",
                        select: "*",
                        filter: {},
                        order: { column: "created_at", asc: false },
                    }),
                });
                const payload = await res.json();
                if (!res.ok) throw new Error(payload?.error || "Erro ao carregar avaliações");
                setAssessments(payload.data || []);
            } catch (error: unknown) {
                console.error("Erro ao carregar avaliações:", error);
                toast({
                    title: "Erro",
                    description: "Não foi possível carregar suas avaliações.",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        void fetchAssessments();
    }, [navigate, toast]);

    const handleDelete = async (id: string) => {
        try {
            const token = localStorage.getItem("sb_access_token");
            if (!token) throw new Error("Usuário não autenticado");

            const res = await apiFetch("/api/rpc/query", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ table: "assessments", action: "delete", filter: { id } }),
            });
            const payload = await res.json();
            if (!res.ok) throw new Error(payload?.error || "Erro ao excluir avaliação");

            setAssessments((prev) => prev.filter((a) => a.id !== id));
            toast({
                title: "Sucesso",
                description: "Avaliação excluída com sucesso.",
            });
        } catch (error: unknown) {
            console.error("Erro ao excluir avaliação:", error);
            toast({
                title: "Erro",
                description: "Não foi possível excluir a avaliação.",
                variant: "destructive",
            });
        } finally {
            setDeleteId(null);
        }
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
            <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
                {labels[status as keyof typeof labels] || status}
            </Badge>
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <BookOpen className="h-8 w-8 text-primary mx-auto mb-4 animate-pulse" />
                    <p className="text-muted-foreground">Carregando avaliações...</p>
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
                            <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/dashboard" })}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Voltar
                            </Button>
                            <div className="flex items-center gap-2">
                                <BookOpen className="h-6 w-6 text-primary" />
                                <span className="text-lg font-semibold">Minhas Avaliações</span>
                            </div>
                        </div>
                        <Button onClick={() => navigate({ to: "/new-assessment" })}>
                            <Plus className="h-4 w-4 mr-2" />
                            Nova Avaliação
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    {assessments.length === 0 ? (
                        <Card className="text-center py-12">
                            <CardContent>
                                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <CardTitle className="mb-2">Nenhuma avaliação encontrada</CardTitle>
                                <CardDescription className="mb-6">
                                    Você ainda não criou nenhuma avaliação. Comece criando sua primeira!
                                </CardDescription>
                                <Button onClick={() => navigate({ to: "/new-assessment" })}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Criar Primeira Avaliação
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {assessments.map((assessment) => (
                                <Card key={assessment.id} className="hover:shadow-md transition-shadow">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1 flex-1">
                                                <CardTitle className="text-lg">{assessment.title}</CardTitle>
                                                {/* description removed from schema */}
                                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-4 w-4" />
                                                        {formatDate(assessment.created_at)}
                                                    </div>
                                                    {/* pdf_filename removed from schema */}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {getStatusBadge(assessment.status)}
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem>
                                                            <Edit className="h-4 w-4 mr-2" />
                                                            Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            onClick={() => setDeleteId(assessment.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Excluir
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    </CardHeader>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir esta avaliação? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteId && handleDelete(deleteId)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default MyAssessments;
