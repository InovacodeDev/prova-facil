import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, ArrowLeft, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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

const MyAssessments = () => {
  const [groupedData, setGroupedData] = useState<GroupedData>({});
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      // Buscar todas as questões com suas respostas e avaliações
      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select(`
          id,
          question,
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
            categories (
              id,
              name
            )
          )
        `)
        .eq("assessments.user_id", user.id);

      if (questionsError) throw questionsError;

      // Buscar todas as matérias
      const { data: subjectsData, error: subjectsError } = await supabase
        .from("subjects")
        .select("id, name");

      if (subjectsError) throw subjectsError;

      // Agrupar dados por matéria e título de avaliação
      const grouped: GroupedData = {};
      
      if (questionsData && subjectsData) {
        setSubjects(subjectsData);
        
        questionsData.forEach((q: any) => {
          const assessment = q.assessments;
          const category = assessment?.categories;
          
          if (!category) return;
          
          // Encontrar a matéria correspondente
          const subject = subjectsData.find(s => s.id === category.id);
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

  const subjectsWithQuestions = subjects.filter(s => groupedData[s.id]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div className="flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-primary" />
                <span className="text-lg font-semibold">Minhas Questões</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={() => navigate("/new-assessment")}>
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
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhuma questão encontrada</h3>
              <p className="text-muted-foreground mb-6">
                Você ainda não criou nenhuma questão. Comece criando sua primeira!
              </p>
              <Button onClick={() => navigate("/new-assessment")}>
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
                {Object.entries(groupedData[subject.id].assessments).map(
                  ([title, questions]) => (
                    <div key={title} className="space-y-4">
                      <h3 className="text-xl font-semibold text-foreground border-l-4 border-primary pl-4">
                        {title}
                      </h3>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {questions.map((question) => (
                          <QuestionCard key={question.id} question={question} />
                        ))}
                      </div>
                    </div>
                  )
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default MyAssessments;
