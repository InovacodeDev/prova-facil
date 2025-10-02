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
import { ProvaFacilLogo } from "@/assets/logo";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { invalidateDashboardCache } from "@/lib/cache";
import { track } from "@vercel/analytics";
import {
    extractTextFromFiles,
    formatExtractedTextForAPI,
    validateFiles,
    ACCEPTED_FILE_EXTENSIONS,
    MAX_FILE_SIZE,
    MAX_TOTAL_SIZE,
    type ExtractedText,
} from "@/lib/document-extractor";

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

const PLAN_LIMITS: Record<string, { monthlyQuestionLimit: number; allowedTypes: string[]; allowPdfUpload: boolean }> = {
    starter: {
        monthlyQuestionLimit: 30, // 20 * 1.5
        allowedTypes: ["multiple_choice"],
        allowPdfUpload: false,
    },
    basic: {
        monthlyQuestionLimit: 75, // 50 * 1.5
        allowedTypes: ["multiple_choice", "open"],
        allowPdfUpload: false,
    },
    essentials: {
        monthlyQuestionLimit: 150, // 100 * 1.5
        allowedTypes: ["multiple_choice", "true_false", "open"],
        allowPdfUpload: false,
    },
    plus: {
        monthlyQuestionLimit: 450, // 300 * 1.5
        allowedTypes: ["multiple_choice", "true_false", "open", "sum"],
        allowPdfUpload: true,
    },
    advanced: {
        monthlyQuestionLimit: 450, // 300 * 1.5
        allowedTypes: ["multiple_choice", "true_false", "open", "sum"],
        allowPdfUpload: true,
    },
};

export default function NewAssessmentPage() {
    const [title, setTitle] = useState("");
    const [questionCount, setQuestionCount] = useState("10");
    const [subject, setSubject] = useState("");
    const [questionContext, setQuestionContext] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [extractedTexts, setExtractedTexts] = useState<ExtractedText[]>([]);
    const [extracting, setExtracting] = useState(false);
    const [extractionProgress, setExtractionProgress] = useState({ current: 0, total: 0, fileName: "" });
    const [questionTypes, setQuestionTypes] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
    const [filteredTitleSuggestions, setFilteredTitleSuggestions] = useState<string[]>([]);
    const [showTitleSuggestions, setShowTitleSuggestions] = useState(false);
    const [userPlan, setUserPlan] = useState<string>("starter");
    const [monthlyUsage, setMonthlyUsage] = useState<number>(0);
    const [maxQuestions, setMaxQuestions] = useState<number>(30);
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

    // Atualizar uso mensal total ao carregar componente
    useEffect(() => {
        const fetchMonthlyUsage = async () => {
            try {
                const {
                    data: { user },
                } = await supabase.auth.getUser();
                if (!user) return;

                // Buscar profile
                const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();

                if (!profile) return;

                // Calcular início do mês atual
                const startOfMonth = new Date();
                startOfMonth.setDate(1);
                startOfMonth.setHours(0, 0, 0, 0);

                // Buscar TODAS as questões geradas neste mês (independente da matéria)
                const { data: questionsData } = await supabase
                    .from("questions")
                    .select(
                        `
                        id,
                        assessments!inner (
                            user_id,
                            created_at
                        )
                    `
                    )
                    .eq("assessments.user_id", profile.id)
                    .gte("assessments.created_at", startOfMonth.toISOString());

                const usage = questionsData?.length || 0;
                setMonthlyUsage(usage);

                // Calcular máximo disponível
                const planLimit = PLAN_LIMITS[userPlan]?.monthlyQuestionLimit || 30;
                const available = Math.max(0, planLimit - usage);
                setMaxQuestions(available);
            } catch (error) {
                console.error("Erro ao buscar uso mensal:", error);
            }
        };

        if (userPlan) {
            fetchMonthlyUsage();
        }
    }, [userPlan, supabase]);

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

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);

        if (selectedFiles.length === 0) return;

        // Verificar se tem PDFs e se o plano permite
        const hasPDFs = selectedFiles.some((file) => file.type === "application/pdf");
        const allowPdfUpload = PLAN_LIMITS[userPlan]?.allowPdfUpload;

        if (hasPDFs && !allowPdfUpload) {
            toast({
                title: "PDF não permitido",
                description: "PDFs são permitidos apenas para planos Plus e Advanced. Use arquivos DOCX.",
                variant: "destructive",
            });
            e.target.value = "";
            return;
        }

        // Validar arquivos
        const newFiles = [...files, ...selectedFiles];
        const validation = validateFiles(newFiles);

        if (!validation.valid) {
            toast({
                title: "Erro",
                description: validation.error,
                variant: "destructive",
            });
            e.target.value = "";
            return;
        }

        setFiles(newFiles);
        e.target.value = "";

        // Extrair texto apenas de arquivos DOCX/DOC
        // PDFs em planos plus/advanced são enviados completos para a IA
        setExtracting(true);
        try {
            const filesToExtract = selectedFiles.filter((file) => file.type !== "application/pdf" || !allowPdfUpload);

            if (filesToExtract.length > 0) {
                const extracted = await extractTextFromFiles(filesToExtract, (current, total, fileName) => {
                    setExtractionProgress({ current, total, fileName });
                });

                setExtractedTexts([...extractedTexts, ...extracted]);

                const totalWords = extracted.reduce((sum, item) => sum + item.wordCount, 0);
                const avgTime = extracted.reduce((sum, item) => sum + item.extractionTime, 0) / extracted.length;

                toast({
                    title: "Texto extraído com sucesso!",
                    description: `${extracted.length} arquivo(s) processado(s). ${totalWords} palavras extraídas em ${(
                        avgTime / 1000
                    ).toFixed(1)}s em média.`,
                });
            } else if (hasPDFs && allowPdfUpload) {
                toast({
                    title: "PDFs adicionados",
                    description: `${selectedFiles.length} PDF(s) serão enviados completos para a IA (sem transcrição prévia).`,
                });
            }
        } catch (error: any) {
            console.error("Erro ao extrair texto:", error);
            toast({
                title: "Erro na extração",
                description: error.message || "Não foi possível extrair o texto dos arquivos.",
                variant: "destructive",
            });
            // Remover arquivos que falharam
            setFiles(files);
        } finally {
            setExtracting(false);
            setExtractionProgress({ current: 0, total: 0, fileName: "" });
        }
    };

    const removeFile = (index: number) => {
        setFiles(files.filter((_, i) => i !== index));
        setExtractedTexts(extractedTexts.filter((_, i) => i !== index));
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

            // Preparar dados de documentos
            const allowPdfUpload = PLAN_LIMITS[userPlan]?.allowPdfUpload;
            const pdfFiles = files.filter((f) => f.type === "application/pdf");
            const nonPdfFiles = files.filter((f) => f.type !== "application/pdf");

            // Para planos plus/advanced: enviar PDFs como arquivos base64
            let pdfFilesData: Array<{ name: string; type: string; data: string }> = [];
            if (allowPdfUpload && pdfFiles.length > 0) {
                pdfFilesData = await Promise.all(
                    pdfFiles.map(async (file) => {
                        const arrayBuffer = await file.arrayBuffer();
                        const base64 = Buffer.from(arrayBuffer).toString("base64");
                        return {
                            name: file.name,
                            type: file.type,
                            data: `data:${file.type};base64,${base64}`,
                        };
                    })
                );
            }

            // Para DOCX: enviar texto transcrito
            const documentContent = formatExtractedTextForAPI(extractedTexts);

            // Chamar API de geração de questões
            const response = await fetch("/api/generate-questions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title: title.trim(),
                    questionCount: parseInt(questionCount),
                    subject,
                    subjectId: subjectData.id,
                    questionTypes,
                    questionContext,
                    academicLevel,
                    documentContent, // Texto extraído de DOCX
                    pdfFiles: pdfFilesData, // PDFs completos (apenas plus/advanced)
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

            // Track do evento (Vercel Analytics)
            track("questions_generated", {
                count: result.questions_generated,
                subject: subject,
                types: questionTypes.join(","),
            });

            // Invalidar cache do dashboard
            invalidateDashboardCache();

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
            return `Você atingiu o limite mensal de ${
                PLAN_LIMITS[userPlan]?.monthlyQuestionLimit || 30
            } questões. Tente novamente no próximo mês ou faça upgrade do seu plano.`;
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
                        <ProvaFacilLogo className="h-6" />
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
                                        <p className="text-xs text-muted-foreground">
                                            Plano {userPlan}: {monthlyUsage}/
                                            {PLAN_LIMITS[userPlan]?.monthlyQuestionLimit || 30} questões usadas este
                                            mês. <strong>Disponível: {maxQuestions}</strong>
                                        </p>
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
                                                PDF, DOC ou DOCX - Máximo 10MB por arquivo, 30MB total
                                            </p>
                                            <Input
                                                id="files"
                                                type="file"
                                                accept={ACCEPTED_FILE_EXTENSIONS}
                                                multiple
                                                onChange={handleFileChange}
                                                className="hidden"
                                                disabled={extracting}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => document.getElementById("files")?.click()}
                                                disabled={extracting}
                                            >
                                                {extracting ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                        Extraindo texto...
                                                    </>
                                                ) : (
                                                    "Selecionar Arquivos"
                                                )}
                                            </Button>
                                        </div>

                                        {/* Progresso de extração */}
                                        {extracting && extractionProgress.total > 0 && (
                                            <div className="mt-4 space-y-2">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">
                                                        Processando {extractionProgress.current} de{" "}
                                                        {extractionProgress.total}
                                                    </span>
                                                    <span className="text-muted-foreground">
                                                        {Math.round(
                                                            (extractionProgress.current / extractionProgress.total) *
                                                                100
                                                        )}
                                                        %
                                                    </span>
                                                </div>
                                                <div className="w-full bg-secondary rounded-full h-2">
                                                    <div
                                                        className="bg-primary h-2 rounded-full transition-all duration-300"
                                                        style={{
                                                            width: `${
                                                                (extractionProgress.current /
                                                                    extractionProgress.total) *
                                                                100
                                                            }%`,
                                                        }}
                                                    />
                                                </div>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {extractionProgress.fileName}
                                                </p>
                                            </div>
                                        )}

                                        {files.length > 0 && !extracting && (
                                            <div className="mt-4 space-y-2">
                                                {files.map((file, index) => {
                                                    const extracted = extractedTexts[index];
                                                    return (
                                                        <div
                                                            key={index}
                                                            className="flex items-start justify-between bg-muted p-3 rounded gap-2"
                                                        >
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium truncate">
                                                                    {file.name}
                                                                </p>
                                                                {extracted && (
                                                                    <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                                                                        <span>{extracted.wordCount} palavras</span>
                                                                        {extracted.pageCount && (
                                                                            <span>{extracted.pageCount} páginas</span>
                                                                        )}
                                                                        <span className="text-green-600">
                                                                            ✓ Texto extraído
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => removeFile(index)}
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        <p className="text-xs text-muted-foreground mt-4 italic">
                                            * O texto é extraído no seu navegador e apenas o conteúdo textual é enviado
                                            para a IA
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
