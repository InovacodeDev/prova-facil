"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, ArrowLeft, Plus, Loader2, Filter } from "lucide-react";
import { ProvaFacilLogo, ProvaFacilIcon } from "@/assets/logo";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { UserMenu } from "@/components/UserMenu";
import { QuestionCard } from "@/components/QuestionCard";

interface Answer {
    id: string;
    answer: string;
    is_correct: boolean;
    number: number | null;
}

interface Question {
    id: string;
    question: string;
    type: string;
    copy_count: number;
    answers: Answer[];
}

interface Assessment {
    id: string;
    title: string;
}

interface Subject {
    id: string;
    name: string;
}

interface GroupedData {
    [subjectId: string]: {
        subjectName: string;
        assessments: {
            [assessmentTitle: string]: Question[];
        };
    };
}

export default function MyAssessmentsPage() {
    const [groupedData, setGroupedData] = useState<GroupedData>({});
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [questionTypeFilter, setQuestionTypeFilter] = useState<string>("all");
    const router = useRouter();
    const { toast } = useToast();
    const supabase = createClient();

    const QUESTION_TYPE_FILTERS = [
        { id: "all", label: "Todos os tipos" },
        { id: "multiple_choice", label: "Múltipla Escolha" },
        { id: "true_false", label: "Verdadeiro/Falso" },
        { id: "open", label: "Dissertativa" },
        { id: "sum", label: "Somatória" },
    ];

    // Função para filtrar questões por tipo
    const filterQuestionsByType = (questions: Question[]) => {
        if (questionTypeFilter === "all") return questions;
        return questions.filter((q) => q.type === questionTypeFilter);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                router.push("/auth");
                return;
            }

            const { data } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();

            // Buscar todas as questões com suas respostas e avaliações
            const { data: questionsData, error: questionsError } = await supabase
                .from("questions")
                .select(
                    `
          id,
          question,
          type,
          copy_count,
          answers (
            id,
            answer,
            is_correct,
            number
          ),
          assessments!inner (
            id,
            title,
            user_id,
            subjects (
              id,
              name
            )
          )
        `
                )
                .eq("assessments.user_id", data.id);

            if (questionsError) throw questionsError;

            // Buscar todas as matérias
            const { data: subjectsData, error: subjectsError } = await supabase.from("subjects").select("id, name");

            if (subjectsError) throw subjectsError;

            // Agrupar dados por matéria e título de avaliação
            const grouped: GroupedData = {};

            if (questionsData && subjectsData) {
                setSubjects(subjectsData);

                questionsData.forEach((q: any) => {
                    const assessment = q.assessments;
                    const subjects = assessment?.subjects;

                    if (!subjects) return;

                    // Encontrar a matéria correspondente
                    const subject = subjectsData.find((s) => s.id === subjects.id);
                    if (!subject) return;

                    if (!grouped[subject.id]) {
                        grouped[subject.id] = {
                            subjectName: subject.name,
                            assessments: {},
                        };
                    }

                    const title = assessment.title || "Sem título";
                    if (!grouped[subject.id].assessments[title]) {
                        grouped[subject.id].assessments[title] = [];
                    }

                    grouped[subject.id].assessments[title].push({
                        id: q.id,
                        question: q.question,
                        type: q.type || "multiple_choice",
                        copy_count: q.copy_count || 0,
                        answers: q.answers || [],
                    });
                });
            }

            setGroupedData(grouped);
        } catch (error: any) {
            console.error("Erro ao carregar questões:", error);
            toast({
                title: "Erro",
                description: "Não foi possível carregar suas questões.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 text-primary mx-auto mb-4 animate-spin" />
                    <p className="text-muted-foreground">Carregando questões...</p>
                </div>
            </div>
        );
    }

    const subjectsWithQuestions = subjects.filter((s) => groupedData[s.id]);

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
                            <ProvaFacilLogo className="h-6" />
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Filtro de tipo de questão */}
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-muted-foreground" />
                                <Select value={questionTypeFilter} onValueChange={setQuestionTypeFilter}>
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue placeholder="Filtrar por tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {QUESTION_TYPE_FILTERS.map((filter) => (
                                            <SelectItem key={filter.id} value={filter.id}>
                                                {filter.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={() => router.push("/new-assessment")}>
                                <Plus className="h-4 w-4 mr-2" />
                                Nova Questão
                            </Button>
                            <UserMenu />
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                {subjectsWithQuestions.length === 0 ? (
                    <Card className="text-center py-12">
                        <CardContent>
                            <ProvaFacilIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <h3 className="text-xl font-semibold mb-2">Nenhuma questão encontrada</h3>
                            <p className="text-muted-foreground mb-6">
                                Você ainda não criou nenhuma questão. Comece criando sua primeira!
                            </p>
                            <Button onClick={() => router.push("/new-assessment")}>
                                <Plus className="h-4 w-4 mr-2" />
                                Criar Primeira Questão
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <Tabs defaultValue={subjectsWithQuestions[0]?.id} className="w-full">
                        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
                            {subjectsWithQuestions.map((subject) => (
                                <TabsTrigger key={subject.id} value={subject.id}>
                                    {subject.name}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        {subjectsWithQuestions.map((subject) => (
                            <TabsContent key={subject.id} value={subject.id} className="space-y-8 mt-6">
                                <Accordion type="multiple" className="w-full space-y-4">
                                    {Object.entries(groupedData[subject.id].assessments).map(([title, questions]) => {
                                        const filteredQuestions = filterQuestionsByType(questions);

                                        // Não mostrar seção se não houver questões após filtro
                                        if (filteredQuestions.length === 0) return null;

                                        return (
                                            <AccordionItem key={title} value={title} className="border rounded-lg px-4">
                                                <AccordionTrigger className="hover:no-underline">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-1 w-1 rounded-full bg-primary" />
                                                        <h3 className="text-lg font-semibold text-foreground">
                                                            {title}
                                                        </h3>
                                                        <span className="text-sm text-muted-foreground">
                                                            ({filteredQuestions.length} questões)
                                                        </span>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent className="pt-4">
                                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                                        {filteredQuestions.map((question) => (
                                                            <QuestionCard key={question.id} question={question} />
                                                        ))}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        );
                                    })}
                                </Accordion>
                            </TabsContent>
                        ))}
                    </Tabs>
                )}
            </main>
        </div>
    );
}
