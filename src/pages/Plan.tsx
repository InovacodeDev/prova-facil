import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, Crown, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserMenu } from "@/components/UserMenu";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "Grátis",
    description: "Para começar a criar questões",
    features: [
      "Apenas múltipla escolha",
      "Máximo de 20 questões por matéria/mês",
      "Suporte por email",
    ],
  },
  {
    id: "basic",
    name: "Basic",
    price: "R$ 29,90/mês",
    description: "Para professores iniciantes",
    features: [
      "Múltipla escolha e dissertativo",
      "Máximo de 50 questões por matéria/mês",
      "Suporte prioritário",
    ],
  },
  {
    id: "essentials",
    name: "Essentials",
    price: "R$ 49,90/mês",
    description: "Para professores ativos",
    features: [
      "Todos os tipos exceto somatória",
      "Máximo de 100 questões por matéria/mês",
      "Suporte prioritário",
      "Estatísticas avançadas",
    ],
  },
  {
    id: "plus",
    name: "Plus",
    price: "R$ 79,90/mês",
    description: "Para professores profissionais",
    features: [
      "Todos os tipos de questões",
      "Máximo de 300 questões por matéria/mês",
      "Suporte prioritário VIP",
      "Estatísticas avançadas",
      "Exportação em múltiplos formatos",
    ],
  },
  {
    id: "advanced",
    name: "Advanced",
    price: "R$ 129,90/mês",
    description: "Para professores universitários",
    features: [
      "Todos os tipos de questões",
      "Máximo de 300 questões por matéria/mês",
      "Matérias específicas por área",
      "Suporte prioritário VIP",
      "Estatísticas avançadas",
      "Exportação em múltiplos formatos",
      "API de integração",
    ],
    highlighted: true,
  },
];

const Plan = () => {
  const [currentPlan, setCurrentPlan] = useState<string>("starter");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchCurrentPlan();
  }, []);

  const fetchCurrentPlan = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("plan")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setCurrentPlan(data.plan);
      }
    } catch (error: any) {
      console.error("Erro ao carregar plano:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar seu plano atual.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    if (planId === "starter") {
      // Plano grátis pode ser selecionado diretamente
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
          .from("profiles")
          .update({ plan: planId })
          .eq("user_id", user.id);

        if (error) throw error;

        setCurrentPlan(planId);
        toast({
          title: "Plano atualizado",
          description: "Você agora está no plano Starter.",
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Não foi possível atualizar seu plano.",
          variant: "destructive",
        });
      }
    } else {
      // Planos pagos - redirecionar para página de pagamento (em construção)
      toast({
        title: "Em construção",
        description: "A funcionalidade de upgrade está em desenvolvimento.",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
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
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div className="flex items-center gap-2">
                <Crown className="h-6 w-6 text-primary" />
                <span className="text-lg font-semibold">Planos</span>
              </div>
            </div>
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Escolha seu plano</h1>
          <p className="text-xl text-muted-foreground">
            Selecione o plano ideal para suas necessidades
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={`relative ${
                plan.highlighted
                  ? "border-primary shadow-lg scale-105"
                  : ""
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    Recomendado
                  </Badge>
                </div>
              )}
              
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {plan.name}
                  {currentPlan === plan.id && (
                    <Badge variant="secondary">Plano Atual</Badge>
                  )}
                </CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold">{plan.price}</span>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button
                  className="w-full"
                  variant={currentPlan === plan.id ? "secondary" : "default"}
                  disabled={currentPlan === plan.id}
                  onClick={() => handleSelectPlan(plan.id)}
                >
                  {currentPlan === plan.id ? "Plano Atual" : "Selecionar Plano"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Plan;
