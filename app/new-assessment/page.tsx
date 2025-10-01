"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BookOpen, Upload, ArrowLeft, FileText, Loader2, X, Check, Lock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const SUBJECTS = [
    { value: "mathematics", label: "Matemática" },
    { value: "portuguese", label: "Português" },
    { value: "history", label: "História" },
    { value: "geography", label: "Geografia" },
    { value: "science", label: "Ciências" },
    { value: "arts", label: "Artes" },
    { value: "english", label: "Inglês" },
    { value: "literature", label: "Literatura" },
    { value: "physics", label: "Física" },
    { value: "chemistry", label: "Química" },
    { value: "biology", label: "Biologia" },
    { value: "philosophy", label: "Filosofia" },
    { value: "sociology", label: "Sociologia" },
    { value: "spanish", label: "Espanhol" },
];

const QUESTION_TYPES = [
    { id: "multiple_choice", label: "Múltipla escolha" },
    { id: "true_false", label: "Verdadeiro ou Falso" },
    { id: "open", label: "Aberta ou Dissertativa" },
    { id: "sum", label: "Somatória" },
];

const QUESTION_CONTEXTS = [
    { value: "fixacao", label: "Fixação" },
    { value: "contextualizada", label: "Contextualizada (Estilo ENEM)" },
    { value: "teorica", label: "Teórica / Conceitual" },
    { value: "estudo_caso", label: "Estudo de Caso" },
    { value: "discursiva_aberta", label: "Discursiva Aberta" },
    { value: "letra_lei", label: '"Letra da Lei" (Estilo Concurso)' },
    { value: "pesquisa", label: "Prompt para Pesquisa (Nível Pós-Doc)" },
];

const PLAN_LIMITS: Record<string, { questionLimit: number; allowedTypes: string[] }> = {
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

export default function NewAssessmentPage() {
    const [title, setTitle] = useState("");
    const [questionCount, setQuestionCount] = useState("10");
    const [subject, setSubject] = useState("");
    const [questionContext, setQuestionContext] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [questionTypes, setQuestionTypes] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
    const [filteredTitleSuggestions, setFilteredTitleSuggestions] = useState<string[]>([]);
    const [showTitleSuggestions, setShowTitleSuggestions] = useState(false);
    const [userPlan, setUserPlan] = useState<string>("starter");
    const [subjectUsage, setSubjectUsage] = useState<number>(0);
    const [maxQuestions, setMaxQuestions] = useState<number>(20);
    const router = useRouter();
    const { toast } = useToast();
    const supabase = createClient();

    // Buscar plano do usuário e uso atual
    useEffect(() => {
        const fetchUserPlanAndUsage = async () => {
            try {
                const {
                    data: { user },
                } = await supabase.auth.getUser();
                if (!user) return;

                // Buscar plano do usuário
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("id, plan")
                    .eq("user_id", user.id)
                    .single();

                if (profile) {
                    setUserPlan(profile.plan);
                }
            } catch (error) {
                console.error("Erro ao buscar plano:", error);
            }
        };

        fetchUserPlanAndUsage();
    }, [supabase]);

    // Atualizar uso ao selecionar matéria
    useEffect(() => {
        const fetchSubjectUsage = async () => {
            if (!subject) {
                setSubjectUsage(0);
                return;
            }

            try {
                const {
                    data: { user },
                } = await supabase.auth.getUser();
                if (!user) return;

                // Buscar profile
                const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();

                if (!profile) return;

                // Buscar subject_id
                const { data: subjectData } = await supabase.from("subjects").select("id").eq("name", subject).single();

                if (!subjectData) return;

                // Calcular início do mês atual
                const startOfMonth = new Date();
                startOfMonth.setDate(1);
                startOfMonth.setHours(0, 0, 0, 0);

                // Buscar quantas questões foram geradas nesta matéria neste mês
                const { data: questionsData } = await supabase
                    .from("questions")
                    .select(
                        `
                        id,
                        assessments!inner (
                            id,
                            user_id,
                            subject_id,
                            created_at
                        )
                    `
                    )
                    .eq("assessments.user_id", profile.id)
                    .eq("assessments.subject_id", subjectData.id)
                    .gte("assessments.created_at", startOfMonth.toISOString());

                const usage = questionsData?.length || 0;
                setSubjectUsage(usage);

                // Calcular máximo disponível
                const planLimit = PLAN_LIMITS[userPlan]?.questionLimit || 20;
                const available = Math.max(0, planLimit - usage);
                setMaxQuestions(available);
            } catch (error) {
                console.error("Erro ao buscar uso:", error);
            }
        };

        fetchSubjectUsage();
    }, [subject, userPlan, supabase]);

    // Buscar títulos distintos de avaliações existentes
    useEffect(() => {
        const fetchAssessmentTitles = async () => {
            try {
                const { data, error } = await supabase.from("assessments").select("title").not("title", "is", null);

                if (error) throw error;

                const titles = data
                    .map((item) => item.title)
                    .filter((title): title is string => title !== null && title.trim() !== "");

                // Remove duplicatas (DISTINCT)
                const uniqueTitles = Array.from(new Set(titles));
                setTitleSuggestions(uniqueTitles);
            } catch (error) {
                console.error("Erro ao buscar títulos:", error);
            }
        };

        fetchAssessmentTitles();
    }, [supabase]);

    // Filtrar sugestões de título baseado no input
    useEffect(() => {
        if (title.trim()) {
            const filtered = titleSuggestions.filter((suggestion) =>
                suggestion.toLowerCase().includes(title.toLowerCase())
            );
            setFilteredTitleSuggestions(filtered);
        } else {
            setFilteredTitleSuggestions([]);
        }
    }, [title, titleSuggestions]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        const validTypes = [
            "application/pdf",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];

        const validFiles = selectedFiles.filter((file) => validTypes.includes(file.type));

        if (validFiles.length !== selectedFiles.length) {
            toast({
                title: "Erro",
                description: "Apenas arquivos PDF, PPT, PPTX, DOC e DOCX são permitidos.",
                variant: "destructive",
            });
            return;
        }

        const totalSize = [...files, ...validFiles].reduce((acc, file) => acc + file.size, 0);
        const maxSize = 50 * 1024 * 1024; // 50MB

        if (totalSize > maxSize) {
            toast({
                title: "Erro",
                description: "O tamanho total dos arquivos não pode exceder 50MB.",
                variant: "destructive",
            });
            return;
        }

        setFiles([...files, ...validFiles]);
        e.target.value = "";
    };

    const removeFile = (index: number) => {
        setFiles(files.filter((_, i) => i !== index));
    };

    const toggleQuestionType = (typeId: string) => {
        setQuestionTypes((prev) => (prev.includes(typeId) ? prev.filter((id) => id !== typeId) : [...prev, typeId]));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            toast({
                title: "Erro",
                description: "O título da avaliação é obrigatório.",
                variant: "destructive",
            });
            return;
        }

        if (!subject) {
            toast({
                title: "Erro",
                description: "Selecione uma matéria.",
                variant: "destructive",
            });
            return;
        }

        if (!questionContext) {
            toast({
                title: "Erro",
                description: "Selecione o contexto/nível da questão.",
                variant: "destructive",
            });
            return;
        }

        if (questionTypes.length === 0) {
            toast({
                title: "Erro",
                description: "Selecione pelo menos um tipo de questão.",
                variant: "destructive",
            });
            return;
        }

        setUploading(true);

        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                toast({
                    title: "Erro",
                    description: "Você precisa estar logado para criar questões.",
                    variant: "destructive",
                });
                router.push("/auth");
                return;
            }

            // Buscar subject_id pelo nome da matéria
            const { data: subjectData, error: subjectError } = await supabase
                .from("subjects")
                .select("id")
                .eq("name", subject)
                .single();

            if (subjectError || !subjectData) {
                toast({
                    title: "Erro",
                    description: "Matéria inválida.",
                    variant: "destructive",
                });
                setUploading(false);
                return;
            }

            // Buscar academic level do usuário
            const { data: profile } = await supabase
                .from("profiles")
                .select("academic_level_id, academic_levels(name)")
                .eq("user_id", user.id)
                .single();

            const academicLevel = (profile as any)?.academic_levels?.name;

            // Preparar arquivos em base64 para enviar à IA
            const fileContents = await Promise.all(
                files.map(async (file) => {
                    const buffer = await file.arrayBuffer();
                    const base64 = Buffer.from(buffer).toString("base64");
                    return {
                        name: file.name,
                        type: file.type,
                        data: `data:${file.type};base64,${base64}`,
                    };
                })
            );

            // Chamar API de geração de questões
            const response = await fetch("/api/generate-questions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title,
                    questionCount: parseInt(questionCount),
                    subject,
                    subjectId: subjectData.id,
                    questionTypes,
                    questionContext,
                    academicLevel,
                    files: fileContents,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Erro ao gerar questões");
            }

            toast({
                title: "Sucesso!",
                description: `${result.questions_generated} questões foram geradas com sucesso!`,
            });

            // Invalidar cache do dashboard
            if (typeof window !== "undefined") {
                localStorage.removeItem("dashboard_stats_cache");
            }

            router.push("/my-assessments");
        } catch (error: any) {
            console.error("Erro ao criar questões:", error);
            toast({
                title: "Erro",
                description: error.message || "Não foi possível criar as questões. Tente novamente.",
                variant: "destructive",
            });
        } finally {
            setUploading(false);
        }
    };

    const isFormValid = title.trim() && subject && questionContext && questionTypes.length > 0 && files.length > 0;
    const canGenerate = isFormValid && maxQuestions > 0;

    const getBlockReason = () => {
        if (files.length === 0) return "Você precisa selecionar pelo menos um documento para gerar questões.";
        if (maxQuestions === 0)
            return `Você atingiu o limite de ${
                PLAN_LIMITS[userPlan]?.questionLimit || 20
            } questões por matéria neste mês. Tente novamente no próximo mês ou faça upgrade do seu plano.`;
        if (!title.trim()) return "Preencha o título da avaliação.";
        if (!subject) return "Selecione uma matéria.";
        if (!questionContext) return "Selecione o contexto/nível da questão.";
        if (questionTypes.length === 0) return "Selecione pelo menos um tipo de questão.";
        return null;
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border bg-card">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Voltar
                        </Button>
                        <div className="flex items-center gap-2">
                            <BookOpen className="h-6 w-6 text-primary" />
                            <span className="text-lg font-semibold">Criar Questões</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto">
                    <Card className="overflow-visible">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                Criar Questões com IA
                            </CardTitle>
                            <CardDescription>
                                Preencha os campos abaixo para gerar questões automaticamente com inteligência
                                artificial
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Título da Avaliação com Autocomplete */}
                                <div className="space-y-2">
                                    <Label htmlFor="title">Título da Avaliação *</Label>
                                    <div className="relative">
                                        <Input
                                            id="title"
                                            value={title}
                                            onChange={(e) => {
                                                setTitle(e.target.value);
                                                setShowTitleSuggestions(true);
                                            }}
                                            onFocus={() => setShowTitleSuggestions(true)}
                                            onBlur={() => {
                                                // Delay para permitir click nas sugestões
                                                setTimeout(() => setShowTitleSuggestions(false), 200);
                                            }}
                                            placeholder="Ex: Revolução Francesa, Equações do 2º Grau..."
                                            required
                                            autoComplete="off"
                                        />
                                        {showTitleSuggestions && filteredTitleSuggestions.length > 0 && (
                                            <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md">
                                                <div className="p-1 max-h-[200px] overflow-y-auto">
                                                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                                        Títulos usados anteriormente
                                                    </div>
                                                    {filteredTitleSuggestions.slice(0, 5).map((suggestion, index) => (
                                                        <div
                                                            key={index}
                                                            className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                                                            onClick={() => {
                                                                setTitle(suggestion);
                                                                setShowTitleSuggestions(false);
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    title === suggestion ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {suggestion}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Use o mesmo título para agrupar questões sobre o mesmo tema
                                    </p>
                                </div>

                                {/* Contexto/Nível da Questão */}
                                <div className="space-y-2">
                                    <Label htmlFor="questionContext">Contexto/Nível da Questão *</Label>
                                    <Select value={questionContext} onValueChange={setQuestionContext}>
                                        <SelectTrigger id="questionContext">
                                            <SelectValue placeholder="Selecione o contexto da questão" />
                                        </SelectTrigger>
                                        <SelectContent position="popper" sideOffset={5}>
                                            {QUESTION_CONTEXTS.map((ctx) => (
                                                <SelectItem key={ctx.value} value={ctx.value}>
                                                    {ctx.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        Define o estilo e a complexidade das questões que serão geradas
                                    </p>
                                </div>

                                {/* Quantidade e Matéria */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="questionCount">Quantidade de Questões *</Label>
                                        <Input
                                            id="questionCount"
                                            type="number"
                                            min="1"
                                            max={maxQuestions}
                                            value={questionCount}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value) || 0;
                                                setQuestionCount(Math.min(val, maxQuestions).toString());
                                            }}
                                            required
                                        />
                                        {subject && (
                                            <p className="text-xs text-muted-foreground">
                                                Plano {userPlan}: {subjectUsage}/
                                                {PLAN_LIMITS[userPlan]?.questionLimit || 20} questões usadas este mês em{" "}
                                                {subject}. <strong>Disponível: {maxQuestions}</strong>
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="subject">Matéria *</Label>
                                        <Select value={subject} onValueChange={setSubject}>
                                            <SelectTrigger id="subject">
                                                <SelectValue placeholder="Selecione a matéria" />
                                            </SelectTrigger>
                                            <SelectContent position="popper" sideOffset={5}>
                                                {SUBJECTS.map((subj) => (
                                                    <SelectItem key={subj.value} value={subj.value}>
                                                        {subj.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Upload de Arquivos */}
                                <div className="space-y-2">
                                    <Label htmlFor="files" className="flex items-center gap-2">
                                        Importar Documentos *
                                        {files.length === 0 && (
                                            <span className="text-xs text-destructive font-normal">(Obrigatório)</span>
                                        )}
                                    </Label>
                                    <div
                                        className={cn(
                                            "border-2 border-dashed rounded-lg p-6 transition-colors",
                                            files.length === 0
                                                ? "border-destructive/50 bg-destructive/5"
                                                : "border-border"
                                        )}
                                    >
                                        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                        <div className="space-y-2 text-center">
                                            <p className="text-sm text-muted-foreground">
                                                Arraste arquivos aqui ou clique para selecionar
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                PDF, PPT, PPTX, DOC ou DOCX - Máximo 50MB total
                                            </p>
                                            <Input
                                                id="files"
                                                type="file"
                                                accept=".pdf,.ppt,.pptx,.doc,.docx"
                                                multiple
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => document.getElementById("files")?.click()}
                                            >
                                                Selecionar Arquivos
                                            </Button>
                                        </div>

                                        {files.length > 0 && (
                                            <div className="mt-4 space-y-2">
                                                {files.map((file, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center justify-between bg-muted p-2 rounded"
                                                    >
                                                        <span className="text-sm truncate flex-1">{file.name}</span>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeFile(index)}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <p className="text-xs text-muted-foreground mt-4 italic">
                                            * Os documentos são usados para gerar as questões e não ficam salvos
                                        </p>
                                    </div>
                                </div>

                                {/* Tipos de Questões */}
                                <div className="space-y-2">
                                    <Label>Tipos de Questões *</Label>
                                    <TooltipProvider>
                                        <div className="space-y-3">
                                            {QUESTION_TYPES.map((type) => {
                                                const allowedTypes = PLAN_LIMITS[userPlan]?.allowedTypes || [
                                                    "multiple_choice",
                                                ];
                                                const isAllowed = allowedTypes.includes(type.id);

                                                return (
                                                    <div key={type.id} className="flex items-center space-x-2">
                                                        {isAllowed ? (
                                                            <>
                                                                <Checkbox
                                                                    id={type.id}
                                                                    checked={questionTypes.includes(type.id)}
                                                                    onCheckedChange={() => toggleQuestionType(type.id)}
                                                                />
                                                                <Label
                                                                    htmlFor={type.id}
                                                                    className="text-sm font-normal cursor-pointer"
                                                                >
                                                                    {type.label}
                                                                </Label>
                                                            </>
                                                        ) : (
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <div className="flex items-center space-x-2 opacity-50 cursor-not-allowed">
                                                                        <Checkbox
                                                                            id={type.id}
                                                                            checked={false}
                                                                            disabled
                                                                        />
                                                                        <Label
                                                                            htmlFor={type.id}
                                                                            className="text-sm font-normal cursor-not-allowed flex items-center gap-1"
                                                                        >
                                                                            {type.label}
                                                                            <Lock className="h-3 w-3" />
                                                                        </Label>
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p className="text-xs">
                                                                        Este tipo de questão não está disponível no
                                                                        plano <strong>{userPlan}</strong>. Faça upgrade
                                                                        para desbloquear.
                                                                    </p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </TooltipProvider>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.push("/dashboard")}
                                        className="flex-1"
                                    >
                                        Cancelar
                                    </Button>

                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="flex-1">
                                                    <Button
                                                        type="submit"
                                                        disabled={uploading || !canGenerate}
                                                        className="w-full"
                                                    >
                                                        {uploading ? (
                                                            <>
                                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                                Gerando Questões...
                                                            </>
                                                        ) : (
                                                            <>
                                                                {!canGenerate && (
                                                                    <AlertCircle className="h-4 w-4 mr-2" />
                                                                )}
                                                                Gerar Questões
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            </TooltipTrigger>
                                            {!canGenerate && getBlockReason() && (
                                                <TooltipContent>
                                                    <p className="text-xs max-w-[250px]">{getBlockReason()}</p>
                                                </TooltipContent>
                                            )}
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
