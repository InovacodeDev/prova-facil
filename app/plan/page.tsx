'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check, Crown, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { UserMenu } from '@/components/UserMenu';
import { plans } from '@/components/Pricing';
import { logClientError } from '@/lib/client-error-logger';

export default function PlanPage() {
  const [currentPlan, setCurrentPlan] = useState<string>('starter');
  const [loading, setLoading] = useState(true);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    fetchCurrentPlan();
  }, []);

  const fetchCurrentPlan = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth');
        return;
      }

      const { data, error } = await supabase.from('profiles').select('plan').eq('user_id', user.id).single();

      if (error) throw error;

      if (data) {
        setCurrentPlan(data.plan);
      }
    } catch (error: any) {
      console.error('Erro ao carregar plano:', error);
      logClientError(error, { component: 'Plan', action: 'fetchUserPlan' });
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar seu plano atual.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    if (planId === 'starter') {
      // Plano grátis pode ser selecionado diretamente
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.from('profiles').update({ plan: planId }).eq('user_id', user.id);

        if (error) throw error;

        setCurrentPlan(planId);
        toast({
          title: 'Plano atualizado',
          description: 'Você agora está no plano Starter.',
        });
      } catch (error) {
        logClientError(error, { component: 'Plan', action: 'handleSelectPlan', planId });
        toast({
          title: 'Erro',
          description: 'Não foi possível atualizar seu plano.',
          variant: 'destructive',
        });
      }
    } else {
      // Planos pagos - redirecionar para página de pagamento (em construção)
      toast({
        title: 'Em construção',
        description: 'A funcionalidade de upgrade está em desenvolvimento.',
      });
    }
  };

  const formatPrice = (plan: (typeof plans)[0]) => {
    if (plan.monthlyPrice === 0) return 'Grátis';

    const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
  };

  const getPeriod = (plan: (typeof plans)[0]) => {
    if (plan.monthlyPrice === 0) return '';
    return billingPeriod === 'monthly' ? '/mês' : '/ano';
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
              <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
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
            Todos os planos incluem as funcionalidades principais. Escolha o que melhor atende seu ritmo.
          </p>

          {/* Billing Period Toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <Button
              variant={billingPeriod === 'monthly' ? 'default' : 'outline'}
              onClick={() => setBillingPeriod('monthly')}
              className="min-w-[120px]"
            >
              Mensal
            </Button>
            <Button
              variant={billingPeriod === 'annual' ? 'default' : 'outline'}
              onClick={() => setBillingPeriod('annual')}
              className="min-w-[120px] relative"
            >
              Anual
              <Badge className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] px-1.5">-25%</Badge>
            </Button>
          </div>
          {billingPeriod === 'annual' && (
            <p className="text-sm text-green-600 mt-2 font-medium">
              🎉 Economize ~75 dias (equivalente a 2,5 meses) ao escolher o plano anual!
            </p>
          )}
        </div>

        {/* Scroll horizontal container */}
        <div className="overflow-x-auto py-8 no-scrollbar">
          <div className="flex gap-6 min-w-max px-4 mx-auto" style={{ justifyContent: 'center' }}>
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative flex flex-col w-[320px] transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                  plan.highlighted ? 'border-primary border-2 shadow-lg' : ''
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">Recomendado</Badge>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center justify-between mb-2">
                    <span>{plan.name}</span>
                    {currentPlan === plan.id && (
                      <Badge variant="secondary" className="text-xs">
                        Atual
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs whitespace-nowrap">
                      {plan.aiLevel}
                    </Badge>
                  </div>
                  <CardDescription className="text-sm min-h-[40px]">{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-3xl font-bold">{formatPrice(plan)}</span>
                    {getPeriod(plan) && <span className="text-sm text-muted-foreground">{getPeriod(plan)}</span>}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-0">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full"
                    variant={currentPlan === plan.id ? 'secondary' : 'default'}
                    disabled={currentPlan === plan.id}
                    onClick={() => handleSelectPlan(plan.id)}
                  >
                    {currentPlan === plan.id ? 'Plano Atual' : 'Selecionar Plano'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Scroll hint for mobile */}
        <div className="text-center mt-4 text-sm text-muted-foreground md:hidden">
          ← Deslize para ver todos os planos →
        </div>
      </main>
    </div>
  );
}
