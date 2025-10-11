'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { PricingShared } from '@/components/PricingShared';
import { logClientError } from '@/lib/client-error-logger';
import { PageHeader } from '@/components/layout';

export default function PlanPage() {
  const [currentPlan, setCurrentPlan] = useState<string>('starter');
  const [loading, setLoading] = useState(true);
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

  return (
    <>
      <PageHeader title="Planos" description="Escolha o plano ideal para suas necessidades" />

      {/* Main Content */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando planos...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="text-center">
            <p className="text-lg text-muted-foreground">
              Todos os planos incluem as funcionalidades principais. Escolha o que melhor atende seu ritmo.
            </p>
          </div>

          <PricingShared currentPlan={currentPlan} onPlanClick={handleSelectPlan} />
        </div>
      )}
    </>
  );
}
