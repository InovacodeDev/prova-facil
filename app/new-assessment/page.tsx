'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Upload, ArrowLeft, FileText, Loader2, X, Check, Lock, AlertCircle, Link, Type } from 'lucide-react';
import { ProvaFacilLogo } from '@/assets/logo';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { useProfile, usePlan, useMonthlyUsage, invalidateUsageCache } from '@/hooks/use-cache';
import { cn } from '@/lib/utils';
import { invalidateDashboardCache } from '@/lib/cache';
import { track } from '@vercel/analytics';
import { Autocomplete } from '@/components/ui/autocomplete';
import { QUESTION_TYPES } from '@/lib/question-types';
import {
  extractTextFromFiles,
  formatExtractedTextForAPI,
  validateFiles,
  ACCEPTED_FILE_EXTENSIONS,
  type ExtractedText,
} from '@/lib/document-extractor';

const SUBJECTS = [
  'Matemática',
  'Português',
  'História',
  'Geografia',
  'Ciências',
  'Artes',
  'Inglês',
  'Literatura',
  'Física',
  'Química',
  'Biologia',
  'Filosofia',
  'Sociologia',
  'Espanhol',
];

const QUESTION_CONTEXTS = [
  { value: 'fixacao', label: 'Fixação' },
  { value: 'contextualizada', label: 'Contextualizada (Estilo ENEM)' },
  { value: 'teorica', label: 'Teórica / Conceitual' },
  { value: 'estudo_caso', label: 'Estudo de Caso' },
  { value: 'discursiva_aberta', label: 'Discursiva Aberta' },
  { value: 'letra_lei', label: '"Letra da Lei" (Estilo Concurso)' },
  { value: 'pesquisa', label: 'Prompt para Pesquisa (Nível Pós-Doc)' },
];

type DocumentMode = 'file' | 'url' | 'text';

type PlanConfig = {
  id: string;
  monthlyQuestionLimit: number;
  docTypes: string[];
  maxQuestionTypes: number;
};

const DEFAULT_PLAN_CONFIG: PlanConfig = {
  id: 'starter',
  monthlyQuestionLimit: 30,
  docTypes: ['text', 'docx', 'txt'],
  maxQuestionTypes: 1,
};

function mapDocTypesToModes(docTypes: string[]): { modes: DocumentMode[]; allowPdf: boolean } {
  if (!docTypes || docTypes.length === 0) {
    return { modes: ['text'], allowPdf: false };
  }

  const normalized = docTypes.map((type) => type.toLowerCase());
  const modes = new Set<DocumentMode>();

  if (normalized.includes('text')) {
    modes.add('text');
  }

  if (normalized.includes('link') || normalized.includes('url')) {
    modes.add('url');
  }

  if (normalized.some((type) => ['txt', 'doc', 'docx', 'ppt', 'pptx', 'pdf'].includes(type))) {
    modes.add('file');
  }

  if (modes.size === 0) {
    modes.add('text');
  }

  return {
    modes: Array.from(modes),
    allowPdf: normalized.includes('pdf'),
  };
}

export default function NewAssessmentPage() {
  const [title, setTitle] = useState('');
  const [questionCount, setQuestionCount] = useState('10');
  const [subject, setSubject] = useState('');
  const [subjectSuggestions, setSubjectSuggestions] = useState<string[]>([]);
  const [questionContext, setQuestionContext] = useState<string | undefined>(undefined);

  // Document input modes - supports multiple documents of each type
  const [documentMode, setDocumentMode] = useState<DocumentMode>('file');
  const [documentUrls, setDocumentUrls] = useState<string[]>(['']);
  const [documentTexts, setDocumentTexts] = useState<string[]>(['']);

  const [files, setFiles] = useState<File[]>([]);
  const [extractedTexts, setExtractedTexts] = useState<ExtractedText[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState({ current: 0, total: 0, fileName: '' });
  const [questionTypes, setQuestionTypes] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);

  // Use cache hooks for profile, plan, and usage data
  const { profile, loading: profileLoading } = useProfile();
  const { plan, loading: planLoading } = usePlan(profile?.plan);
  const { usage, loading: usageLoading } = useMonthlyUsage(profile?.id);

  // Derived values from cache
  const userPlan = profile?.plan || 'starter';
  const allowedQuestionTypes = profile?.selected_question_types || [];
  const planConfig: PlanConfig = useMemo(
    () =>
      plan
        ? {
            id: plan.id,
            monthlyQuestionLimit: plan.questions_month ?? DEFAULT_PLAN_CONFIG.monthlyQuestionLimit,
            docTypes: plan.doc_type ?? DEFAULT_PLAN_CONFIG.docTypes,
            maxQuestionTypes: plan.max_question_types ?? DEFAULT_PLAN_CONFIG.maxQuestionTypes,
          }
        : DEFAULT_PLAN_CONFIG,
    [plan]
  );
  const planConfigId = plan?.id || DEFAULT_PLAN_CONFIG.id;
  const monthlyUsage = usage || 0;
  const maxQuestions = Math.max(0, (plan?.questions_month || DEFAULT_PLAN_CONFIG.monthlyQuestionLimit) - monthlyUsage);

  const router = useRouter();
  const { toast } = useToast();
  const supabase = useMemo(() => createClient(), []);
  const { modes: allowedDocModes, allowPdf: canUploadPdf } = useMemo(
    () => mapDocTypesToModes(planConfig.docTypes),
    [planConfig]
  );

  useEffect(() => {
    if (allowedDocModes.length > 0 && !allowedDocModes.includes(documentMode)) {
      const fallbackMode = allowedDocModes[0] ?? 'text';
      setDocumentMode(fallbackMode);
    }
  }, [allowedDocModes, documentMode]);

  // Update questionCount when maxQuestions changes
  useEffect(() => {
    if (maxQuestions === 0) {
      setQuestionCount('0');
      return;
    }

    const parsed = parseInt(questionCount, 10);
    const currentValue = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;

    if (currentValue === 0) {
      const defaultValue = Math.min(10, maxQuestions);
      setQuestionCount(defaultValue.toString());
    } else if (currentValue > maxQuestions) {
      setQuestionCount(maxQuestions.toString());
    }
  }, [maxQuestions]);

  const titleOptions = useMemo(
    () => titleSuggestions.map((item) => ({ value: item, label: item })),
    [titleSuggestions]
  );

  const subjectOptions = useMemo(() => {
    const normalized = new Map<string, string>();

    SUBJECTS.forEach((subjectName) => {
      normalized.set(subjectName.toLowerCase(), subjectName);
    });

    subjectSuggestions.forEach((subjectName) => {
      const key = subjectName.toLowerCase();
      if (!normalized.has(key)) {
        normalized.set(key, subjectName);
      }
    });

    return Array.from(normalized.values()).map((subjectName) => ({ value: subjectName, label: subjectName }));
  }, [subjectSuggestions]);

  // Buscar títulos distintos de avaliações existentes
  useEffect(() => {
    const fetchAssessmentTitles = async () => {
      try {
        const { data, error } = await supabase.from('assessments').select('title').not('title', 'is', null);

        if (error) throw error;

        const titles = data
          .map((item) => item.title)
          .filter((title): title is string => title !== null && title.trim() !== '');

        // Remove duplicatas (DISTINCT)
        const uniqueTitles = Array.from(new Set(titles));
        setTitleSuggestions(uniqueTitles);
      } catch (error) {
        console.error('Erro ao buscar títulos:', error);
      }
    };

    fetchAssessmentTitles();
  }, [supabase]);

  // Buscar matérias distintas já utilizadas
  useEffect(() => {
    const fetchSubjectSuggestions = async () => {
      try {
        const { data, error } = await supabase.from('assessments').select('subject').not('subject', 'is', null);

        if (error) throw error;

        const subjects = data
          .map((item) => item.subject)
          .filter((subject): subject is string => subject !== null && subject.trim() !== '');

        // Remove duplicatas (DISTINCT)
        const uniqueSubjects = Array.from(new Set(subjects));
        setSubjectSuggestions(uniqueSubjects);
      } catch (error) {
        console.error('Erro ao buscar matérias:', error);
      }
    };

    fetchSubjectSuggestions();
  }, [supabase]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);

    if (selectedFiles.length === 0) return;

    // Verificar se tem PDFs e se o plano permite
    const hasPDFs = selectedFiles.some((file) => file.type === 'application/pdf');

    if (hasPDFs && !canUploadPdf) {
      toast({
        title: 'PDF não permitido',
        description: 'PDFs são permitidos apenas para planos Plus e Advanced. Use arquivos DOCX.',
        variant: 'destructive',
      });
      e.target.value = '';
      return;
    }

    // Validar arquivos
    const newFiles = [...files, ...selectedFiles];
    const validation = validateFiles(newFiles);

    if (!validation.valid) {
      toast({
        title: 'Erro',
        description: validation.error,
        variant: 'destructive',
      });
      e.target.value = '';
      return;
    }

    setFiles(newFiles);
    e.target.value = '';

    // Extrair texto apenas de arquivos DOCX/DOC
    // PDFs em planos plus/advanced são enviados completos para a IA
    setExtracting(true);
    try {
      const filesToExtract = selectedFiles.filter((file) => file.type !== 'application/pdf' || !canUploadPdf);

      if (filesToExtract.length > 0) {
        const extracted = await extractTextFromFiles(filesToExtract, (current, total, fileName) => {
          setExtractionProgress({ current, total, fileName });
        });

        setExtractedTexts([...extractedTexts, ...extracted]);

        const totalWords = extracted.reduce((sum, item) => sum + item.wordCount, 0);
        const avgTime = extracted.reduce((sum, item) => sum + item.extractionTime, 0) / extracted.length;

        toast({
          title: 'Texto extraído com sucesso!',
          description: `${extracted.length} arquivo(s) processado(s). ${totalWords} palavras extraídas em ${(
            avgTime / 1000
          ).toFixed(1)}s em média.`,
        });
      } else if (hasPDFs && canUploadPdf) {
        toast({
          title: 'PDFs adicionados',
          description: `${selectedFiles.length} PDF(s) serão enviados completos para a IA (sem transcrição prévia).`,
        });
      }
    } catch (error: any) {
      console.error('Erro ao extrair texto:', error);
      toast({
        title: 'Erro na extração',
        description: error.message || 'Não foi possível extrair o texto dos arquivos.',
        variant: 'destructive',
      });
      // Remover arquivos que falharam
      setFiles(files);
    } finally {
      setExtracting(false);
      setExtractionProgress({ current: 0, total: 0, fileName: '' });
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
        title: 'Erro',
        description: 'O título da avaliação é obrigatório.',
        variant: 'destructive',
      });
      return;
    }

    if (!subject) {
      toast({
        title: 'Erro',
        description: 'Selecione uma matéria.',
        variant: 'destructive',
      });
      return;
    }

    if (!questionContext) {
      toast({
        title: 'Erro',
        description: 'Selecione o contexto/nível da questão.',
        variant: 'destructive',
      });
      return;
    }

    if (questionTypes.length === 0) {
      toast({
        title: 'Erro',
        description: 'Selecione pelo menos um tipo de questão.',
        variant: 'destructive',
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
          title: 'Erro',
          description: 'Você precisa estar logado para criar questões.',
          variant: 'destructive',
        });
        router.push('/auth');
        return;
      }

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('academic_level_id, academic_levels(name)')
        .eq('user_id', user.id)
        .single();

      const academicLevel = (userProfile as any)?.academic_levels?.name;

      let documentContent = '';
      let pdfFilesData: Array<{ name: string; type: string; data: string }> = [];
      const documentUrlsToSend: string[] = [];

      const validTexts = documentTexts.filter((t) => t.trim().length > 0);
      if (validTexts.length > 0) {
        documentContent = validTexts.map((text, index) => `\n--- Texto ${index + 1} ---\n${text.trim()}`).join('\n\n');
      }

      const validUrls = documentUrls.filter((u) => u.trim().length > 0);
      if (validUrls.length > 0) {
        documentUrlsToSend.push(...validUrls);
        const urlsText = validUrls
          .map(
            (url, index) =>
              `\n--- URL ${index + 1} ---\n${url}\n\nNOTA: Extraia o conteúdo desta URL para gerar as questões.`
          )
          .join('\n\n');
        documentContent = documentContent ? `${documentContent}\n\n${urlsText}` : urlsText;
      }

      // Processar arquivos
      if (files.length > 0) {
        const allowPdfUpload = canUploadPdf;
        const pdfFiles = files.filter((f) => f.type === 'application/pdf');

        // Para planos plus/advanced: enviar PDFs como arquivos base64
        if (allowPdfUpload && pdfFiles.length > 0) {
          pdfFilesData = await Promise.all(
            pdfFiles.map(async (file) => {
              const arrayBuffer = await file.arrayBuffer();
              const base64 = Buffer.from(arrayBuffer).toString('base64');
              return {
                name: file.name,
                type: file.type,
                data: `data:${file.type};base64,${base64}`,
              };
            })
          );
        }

        const extractedContent = formatExtractedTextForAPI(extractedTexts);
        if (extractedContent) {
          documentContent = documentContent
            ? `${documentContent}\n\n--- Arquivos Transcritos ---\n${extractedContent}`
            : extractedContent;
        }
      }

      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          questionCount: parseInt(questionCount),
          subject,
          questionTypes,
          questionContext,
          academicLevel,
          documentContent, // Todos os conteúdos combinados
          documentUrls: documentUrlsToSend.length > 0 ? documentUrlsToSend : undefined, // Array de URLs
          pdfFiles: pdfFilesData, // PDFs completos (apenas plus/advanced)
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao gerar questões');
      }

      toast({
        title: 'Sucesso!',
        description: `${result.questions_generated} questões foram geradas com sucesso!`,
      });

      // Track do evento (Vercel Analytics)
      track('questions_generated', {
        count: result.questions_generated,
        subject: subject,
        types: questionTypes.join(','),
      });

      // Invalidar cache do dashboard e usage
      invalidateDashboardCache();
      if (profile?.id) {
        invalidateUsageCache(profile.id);
      }

      router.push('/my-assessments');
    } catch (error: any) {
      console.error('Erro ao criar questões:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível criar as questões. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  // Check if user has provided content in any mode (files, texts, or URLs)
  const hasDocumentContent =
    files.length > 0 || documentTexts.some((t) => t.trim().length > 0) || documentUrls.some((u) => u.trim().length > 0);

  const isFormValid = title.trim() && subject && questionContext && questionTypes.length > 0 && hasDocumentContent;
  const canGenerate = isFormValid && maxQuestions > 0;

  const getBlockReason = () => {
    if (!hasDocumentContent) {
      return 'Você precisa fornecer material de referência (arquivo, texto ou link).';
    }
    if (maxQuestions === 0)
      return `Você atingiu o limite mensal de ${planConfig.monthlyQuestionLimit} questões. Tente novamente no próximo mês ou faça upgrade do seu plano.`;
    if (!title.trim()) return 'Preencha o título da avaliação.';
    if (!subject) return 'Selecione uma matéria.';
    if (!questionContext) return 'Selecione o contexto/nível da questão.';
    if (questionTypes.length === 0) return 'Selecione pelo menos um tipo de questão.';
    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <ProvaFacilLogo className="h-6" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-[920px] mx-auto">
          <Card className="overflow-visible">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Criar Questões com IA
              </CardTitle>
              <CardDescription>
                Preencha os campos abaixo para gerar questões automaticamente com inteligência artificial
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Título da Avaliação com Autocomplete */}
                <div className="space-y-2">
                  <Label htmlFor="title">Título da Avaliação *</Label>
                  <Autocomplete
                    id="title"
                    value={title}
                    onValueChange={setTitle}
                    options={titleOptions}
                    placeholder="Selecione ou digite o título da avaliação"
                    emptyText="Nenhum título encontrado. Digite para criar um novo."
                    searchPlaceholder="Buscar título..."
                  />
                  <div className="flex items-start gap-2 p-2 rounded-md bg-blue-50 border border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
                    <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-800 dark:text-blue-300">
                      <strong>Dica:</strong> Use o mesmo título para agrupar questões relacionadas. Isso facilita
                      encontrar e filtrar suas questões depois!
                    </p>
                  </div>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="questionCount">Quantidade de Questões *</Label>
                    <Input
                      id="questionCount"
                      type="number"
                      min={maxQuestions === 0 ? 0 : 1}
                      max={Math.max(0, maxQuestions)}
                      value={questionCount}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        const capped = maxQuestions === 0 ? 0 : Math.max(1, Math.min(val, maxQuestions));
                        setQuestionCount(capped.toString());
                      }}
                      required
                      disabled={maxQuestions === 0}
                    />
                    <p className="text-xs text-muted-foreground">
                      Plano {userPlan}: {monthlyUsage}/{planConfig.monthlyQuestionLimit} questões usadas este mês.{' '}
                      <strong>Disponível: {maxQuestions}</strong>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Conteúdo das Questões *</Label>
                    <Autocomplete
                      id="subject"
                      value={subject}
                      onValueChange={setSubject}
                      options={subjectOptions}
                      placeholder="Selecione ou digite a matéria/tema"
                      emptyText="Nenhuma matéria encontrada. Digite para criar uma nova."
                      searchPlaceholder="Buscar matéria ou tema..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Escolha uma matéria comum ou digite um tema específico
                    </p>
                  </div>
                </div>

                {/* Upload de Arquivos / Documentos */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      Material de Referência *
                      {files.length === 0 &&
                        documentTexts.every((t) => !t.trim()) &&
                        documentUrls.every((u) => !u.trim()) && (
                          <span className="text-xs text-destructive font-normal">(Obrigatório)</span>
                        )}
                    </Label>
                    <div className="flex gap-1">
                      {allowedDocModes.includes('text') && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant={documentMode === 'text' ? 'default' : 'outline'}
                                size="sm"
                                className="h-8 px-2"
                                onClick={() => setDocumentMode('text')}
                              >
                                <Type className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Digitar texto direto</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}

                      {allowedDocModes.includes('url') && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant={documentMode === 'url' ? 'default' : 'outline'}
                                size="sm"
                                className="h-8 px-2"
                                onClick={() => setDocumentMode('url')}
                              >
                                <Link className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Inserir link/URL</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}

                      {allowedDocModes.includes('file') && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant={documentMode === 'file' ? 'default' : 'outline'}
                                size="sm"
                                className="h-8 px-2"
                                onClick={() => setDocumentMode('file')}
                              >
                                <Upload className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                Enviar arquivo (DOC/DOCX
                                {canUploadPdf ? '/PDF' : ''})
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>

                  {/* Text Mode - Multiple Texts */}
                  {documentMode === 'text' && (
                    <div className="space-y-3">
                      {documentTexts.map((text, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs text-muted-foreground">Texto {index + 1}</Label>
                            {documentTexts.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setDocumentTexts(documentTexts.filter((_, i) => i !== index));
                                }}
                                className="h-6 px-2 text-xs"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          <div className="relative">
                            <textarea
                              placeholder="Cole ou digite o conteúdo do material de referência aqui..."
                              value={text}
                              onChange={(e) => {
                                const newTexts = [...documentTexts];
                                newTexts[index] = e.target.value;
                                setDocumentTexts(newTexts);
                              }}
                              className="min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                              rows={6}
                            />
                            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background/80 px-1 rounded">
                              {text.split(/\s+/).filter((w) => w.length > 0).length} palavras
                            </div>
                          </div>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setDocumentTexts([...documentTexts, ''])}
                        className="w-full"
                      >
                        <Type className="h-4 w-4 mr-2" />
                        Adicionar outro texto
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        💡 Cole textos, trechos de livros, artigos ou qualquer conteúdo textual
                      </p>
                    </div>
                  )}

                  {/* URL Mode - Multiple URLs */}
                  {documentMode === 'url' && (
                    <div className="space-y-3">
                      {documentUrls.map((url, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Input
                              type="url"
                              placeholder={`https://exemplo.com/artigo-${index + 1}`}
                              value={url}
                              onChange={(e) => {
                                const newUrls = [...documentUrls];
                                newUrls[index] = e.target.value;
                                setDocumentUrls(newUrls);
                              }}
                              className="flex-1"
                            />
                            {documentUrls.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setDocumentUrls(documentUrls.filter((_, i) => i !== index));
                                }}
                                className="h-10 px-3"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setDocumentUrls([...documentUrls, ''])}
                        className="w-full"
                      >
                        <Link className="h-4 w-4 mr-2" />
                        Adicionar outro link
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        🔗 Insira links para artigos, PDFs online, páginas da web ou recursos educacionais
                      </p>
                      {!allowedDocModes.includes('url') && (
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted border border-border">
                          <Lock className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div className="text-xs text-muted-foreground">
                            <p className="font-semibold">Links não disponíveis no plano {userPlan}</p>
                            <p>Faça upgrade para Essentials ou superior para usar URLs</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* File Mode */}
                  {documentMode === 'file' && (
                    <div
                      className={cn(
                        'border-2 border-dashed rounded-lg p-6 transition-colors',
                        files.length === 0 ? 'border-destructive/50 bg-destructive/5' : 'border-border'
                      )}
                    >
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <div className="space-y-2 text-center">
                        <p className="text-sm text-muted-foreground">Arraste arquivos aqui ou clique para selecionar</p>
                        <p className="text-xs text-muted-foreground">
                          {canUploadPdf
                            ? 'PDF, DOC ou DOCX - Máximo 10MB por arquivo, 30MB total'
                            : 'DOC ou DOCX - Máximo 10MB por arquivo, 30MB total'}
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
                          onClick={() => document.getElementById('files')?.click()}
                          disabled={extracting}
                        >
                          {extracting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Extraindo texto...
                            </>
                          ) : (
                            'Selecionar Arquivos'
                          )}
                        </Button>
                      </div>

                      {/* Progresso de extração */}
                      {extracting && extractionProgress.total > 0 && (
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Processando {extractionProgress.current} de {extractionProgress.total}
                            </span>
                            <span className="text-muted-foreground">
                              {Math.round((extractionProgress.current / extractionProgress.total) * 100)}%
                            </span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${(extractionProgress.current / extractionProgress.total) * 100}%`,
                              }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{extractionProgress.fileName}</p>
                        </div>
                      )}

                      {files.length > 0 && !extracting && (
                        <div className="mt-4 space-y-2">
                          {files.map((file, index) => {
                            const extracted = extractedTexts[index];
                            return (
                              <div key={index} className="flex items-start justify-between bg-muted p-3 rounded gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{file.name}</p>
                                  {extracted && (
                                    <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                                      <span>{extracted.wordCount} palavras</span>
                                      {extracted.pageCount && <span>{extracted.pageCount} páginas</span>}
                                      <span className="text-green-600">✓ Texto extraído</span>
                                    </div>
                                  )}
                                </div>
                                <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(index)}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground mt-4 italic">
                        * O texto é extraído no seu navegador e apenas o conteúdo textual é enviado para a IA
                      </p>
                    </div>
                  )}
                </div>

                {/* Tipos de Questões */}
                <div className="space-y-2">
                  <Label>Tipos de Questões *</Label>
                  <p className="text-xs text-muted-foreground">
                    Selecione um ou mais tipos para diversificar sua avaliação
                  </p>
                  {allowedQuestionTypes.length === 0 && (
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
                      <p className="text-sm text-amber-900 dark:text-amber-300">
                        ⚠️ Você ainda não selecionou tipos de questões. Vá para{' '}
                        <Button
                          variant="link"
                          className="p-0 h-auto text-amber-900 dark:text-amber-300 underline"
                          onClick={() => router.push('/profile')}
                        >
                          Perfil
                        </Button>{' '}
                        para escolher seus tipos.
                      </p>
                    </div>
                  )}
                  <TooltipProvider>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {QUESTION_TYPES.map((type) => {
                        const isAllowed = allowedQuestionTypes.includes(type.id);

                        return (
                          <div
                            key={type.id}
                            className={cn(
                              'flex items-start space-x-3 px-3 rounded-lg border transition-all',
                              isAllowed
                                ? 'border-border hover:border-primary hover:bg-primary/5 cursor-pointer'
                                : 'border-border bg-muted/50 opacity-50 cursor-not-allowed'
                            )}
                          >
                            {isAllowed ? (
                              <>
                                <div className="pt-3">
                                  <Checkbox
                                    id={type.id}
                                    checked={questionTypes.includes(type.id)}
                                    onCheckedChange={() => toggleQuestionType(type.id)}
                                    className="mt-0.5"
                                  />
                                </div>
                                <div className="flex-1">
                                  <p
                                    className="text-sm font-medium leading-tight cursor-pointer pt-3"
                                    onClick={() => toggleQuestionType(type.id)}
                                  >
                                    {type.label}
                                  </p>
                                  <p
                                    className="text-xs text-muted-foreground mt-1 pb-3"
                                    onClick={() => toggleQuestionType(type.id)}
                                  >
                                    {type.description}
                                  </p>
                                </div>
                              </>
                            ) : (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-start space-x-3 w-full">
                                    <Checkbox id={type.id} checked={false} disabled className="mt-0.5" />
                                    <div className="flex-1">
                                      <Label
                                        htmlFor={type.id}
                                        className="text-sm font-medium cursor-not-allowed flex items-center gap-1 leading-tight"
                                      >
                                        {type.label}
                                        <Lock className="h-3 w-3" />
                                      </Label>
                                      <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                                    </div>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">
                                    Este tipo de questão não está disponível no plano <strong>{userPlan}</strong>. Faça
                                    upgrade para desbloquear.
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
                  <Button type="button" variant="outline" onClick={() => router.push('/dashboard')} className="flex-1">
                    Cancelar
                  </Button>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex-1">
                          <Button type="submit" disabled={uploading || !canGenerate} className="w-full">
                            {uploading ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Gerando Questões...
                              </>
                            ) : (
                              <>
                                {!canGenerate && <AlertCircle className="h-4 w-4 mr-2" />}
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
