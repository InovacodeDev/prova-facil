import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Upload, ArrowLeft, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const NewAssessment = () => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && selectedFile.type === "application/pdf") {
            setFile(selectedFile);
        } else {
            toast({
                title: "Erro",
                description: "Por favor, selecione um arquivo PDF válido.",
                variant: "destructive",
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            toast({
                title: "Erro",
                description: "O título é obrigatório.",
                variant: "destructive",
            });
            return;
        }

        setUploading(true);

        try {
            // get token from localStorage (set by signin flow)
            const token = localStorage.getItem("sb_access_token");
            if (!token) {
                navigate("/auth");
                return;
            }

            const res = await fetch("/api/assessments", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim() || null,
                    pdf_filename: file?.name || null,
                    status: "draft",
                }),
            });
            const payload = await res.json();
            if (!res.ok) throw new Error(payload?.error || "Erro ao criar avaliação");
            toast({
                title: "Sucesso",
                description: "Avaliação criada com sucesso!",
            });

            navigate("/my-assessments");
        } catch (error: any) {
            console.error("Erro ao criar avaliação:", error);
            toast({
                title: "Erro",
                description: "Não foi possível criar a avaliação. Tente novamente.",
                variant: "destructive",
            });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border bg-card">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Voltar
                        </Button>
                        <div className="flex items-center gap-2">
                            <BookOpen className="h-6 w-6 text-primary" />
                            <span className="text-lg font-semibold">Nova Avaliação</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                Criar Nova Avaliação
                            </CardTitle>
                            <CardDescription>
                                Preencha as informações básicas e faça o upload do PDF para gerar questões
                                automaticamente
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Título da Avaliação *</Label>
                                    <Input
                                        id="title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Ex: Avaliação de História - Segunda Guerra Mundial"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Descrição (opcional)</Label>
                                    <Textarea
                                        id="description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Descreva o conteúdo ou objetivo desta avaliação..."
                                        rows={3}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="file">Upload do PDF (opcional)</Label>
                                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                                        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                        <div className="space-y-2">
                                            <p className="text-sm text-muted-foreground">
                                                {file
                                                    ? file.name
                                                    : "Arraste um arquivo PDF aqui ou clique para selecionar"}
                                            </p>
                                            <Input
                                                id="file"
                                                type="file"
                                                accept=".pdf"
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => document.getElementById("file")?.click()}
                                            >
                                                Selecionar PDF
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => navigate("/dashboard")}
                                        className="flex-1"
                                    >
                                        Cancelar
                                    </Button>
                                    <Button type="submit" disabled={uploading} className="flex-1">
                                        {uploading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Criando...
                                            </>
                                        ) : (
                                            "Criar Avaliação"
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
};

export default NewAssessment;
