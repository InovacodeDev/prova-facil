'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar, X as XIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { AppLayout } from '@/components/layout';
import { PageHeader } from '@/components/PageHeader';
import { plans } from '@/components/Pricing';
import { logClientError } from '@/lib/client-error-logger';
import { useSubscriptionCache } from '@/hooks/use-subscription-cache';
import { ComponentLoader } from '@/components/ui/component-loader';

// Lazy load de componentes pesados que não são exibidos imediatamente
const CheckoutModal = lazy(() => import('@/components/CheckoutModal').then((mod) => ({ default: mod.CheckoutModal })));
const ImmediateUpgradeDialog = lazy(() =>
  import('@/components/ImmediateUpgradeDialog').then((mod) => ({ default: mod.ImmediateUpgradeDialog }))
);
const DowngradeConfirmDialog = lazy(() =>
  import('@/components/DowngradeConfirmDialog').then((mod) => ({ default: mod.DowngradeConfirmDialog }))
);
const PaymentVerification = lazy(() =>
  import('@/components/PaymentVerification').then((mod) => ({ default: mod.PaymentVerification }))
);
const Pricing = lazy(() => import('@/components/Pricing').then((mod) => ({ default: mod.Pricing })));

export default function PlanPage() {
  const [currentPlan, setCurrentPlan] = useState<string>('starter');
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);
  const [pendingPlanChangeAt, setPendingPlanChangeAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [downgradeDialogOpen, setDowngradeDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<(typeof plans)[0] | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const supabase = createClient();

  // Hook de cache da subscription
  const {
    subscription: cachedSubscription,
    loading: subscriptionLoading,
    refreshSubscription,
    currentPeriodEndDate,
    daysUntilRenewal,
    hasPendingChange,
  } = useSubscriptionCache();

  useEffect(() => {
    // Verificar se há session_id na URL (retorno do Stripe)
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      handleCheckoutReturn(sessionId);
      return;
    }

    fetchCurrentPlan();

    // Verificar se há query params de sucesso ou cancelamento
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    const openModal = searchParams.get('openModal');
    const planId = searchParams.get('planId');

    if (success === 'true') {
      toast({
        title: 'Pagamento processado!',
        description: 'Seu plano foi atualizado com sucesso. Bem-vindo!',
      });
      // Limpar URL
      router.replace('/plan');
    } else if (canceled === 'true') {
      toast({
        title: 'Checkout cancelado',
        description: 'Você pode tentar novamente quando quiser.',
        variant: 'destructive',
      });
      // Limpar URL
      router.replace('/plan');
    } else if (openModal === 'true' && planId) {
      // Abrir modal automaticamente para plano específico
      const plan = plans.find((p) => p.id === planId);
      if (plan && plan.id !== 'starter') {
        setSelectedPlan(plan);
        setCheckoutModalOpen(true);
        // Limpar URL
        router.replace('/plan');
      }
    }
  }, [searchParams]);

  const handleCheckoutReturn = async (sessionId: string) => {
    setVerifyingPayment(true);
    setPaymentStatus('verifying');

    try {
      // Chamar endpoint para verificar sessão e atualizar perfil
      const response = await fetch('/api/stripe/verify-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao verificar pagamento');
      }

      if (result.success && result.status === 'complete' && result.paymentStatus === 'paid') {
        // Atualizar estado local
        setCurrentPlan(result.plan);
        setPaymentStatus('success');

        // Aguardar um pouco para mostrar o estado de sucesso
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Mostrar toast de sucesso
        const planName = plans.find((p) => p.id === result.plan)?.name || result.plan;
        toast({
          title: 'Pagamento confirmado! 🎉',
          description: `Bem-vindo ao plano ${planName}! Seu acesso foi liberado.`,
        });

        // Recarregar dados do perfil
        await fetchCurrentPlan();

        // Limpar URL
        router.replace('/plan');
      } else {
        // Pagamento não foi concluído
        setPaymentStatus('error');

        await new Promise((resolve) => setTimeout(resolve, 2000));

        toast({
          title: 'Pagamento pendente',
          description: result.message || 'Aguardando confirmação do pagamento.',
          variant: 'destructive',
        });

        // Limpar URL mas não recarregar
        router.replace('/plan');
      }
    } catch (error: any) {
      console.error('Erro ao processar retorno do checkout:', error);
      logClientError(error, { component: 'Plan', action: 'handleCheckoutReturn', sessionId });

      setPaymentStatus('error');

      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast({
        title: 'Erro ao verificar pagamento',
        description:
          error.message || 'Não foi possível confirmar seu pagamento. Por favor, entre em contato com o suporte.',
        variant: 'destructive',
      });

      // Limpar URL
      router.replace('/plan');
    } finally {
      setVerifyingPayment(false);
      setLoading(false);
    }
  };

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
      // Plano grátis pode ser selecionado diretamente (downgrade)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // Se já tem um plano pago, isso é um downgrade
        if (currentPlan !== 'starter') {
          const plan = plans.find((p) => p.id === planId);
          if (plan) {
            setSelectedPlan(plan);
            setDowngradeDialogOpen(true);
          }
          return;
        }

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
      // Planos pagos
      const plan = plans.find((p) => p.id === planId);
      if (!plan) return;

      // Se já tem um plano ativo, verificar se é upgrade ou downgrade
      if (currentPlan !== 'starter') {
        const planHierarchy: Record<string, number> = {
          starter: 0,
          basic: 1,
          essentials: 2,
          plus: 3,
          advanced: 4,
        };

        const currentLevel = planHierarchy[currentPlan];
        const targetLevel = planHierarchy[planId];

        if (targetLevel > currentLevel) {
          // É um upgrade
          setSelectedPlan(plan);
          setUpgradeDialogOpen(true);
        } else if (targetLevel < currentLevel) {
          // É um downgrade
          setSelectedPlan(plan);
          setDowngradeDialogOpen(true);
        } else {
          // É o mesmo plano
          toast({
            title: 'Plano atual',
            description: 'Você já está neste plano.',
          });
        }
      } else {
        // Primeiro plano pago - abrir modal de checkout
        setSelectedPlan(plan);
        setCheckoutModalOpen(true);
      }
    }
  };

  const handleCloseCheckoutModal = () => {
    setCheckoutModalOpen(false);
    setSelectedPlan(null);
  };

  const handleConfirmUpgrade = async () => {
    if (!selectedPlan) return;

    try {
      const response = await fetch('/api/stripe/change-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPlanId: selectedPlan.id,
          billingPeriod,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao processar upgrade');
      }

      setUpgradeDialogOpen(false);
      setSelectedPlan(null);

      // Upgrade é sempre imediato
      setCurrentPlan(selectedPlan.id);

      // Invalidar cache da subscription
      await refreshSubscription();

      toast({
        title: 'Upgrade realizado!',
        description:
          result.message ||
          `Seu plano foi atualizado para ${selectedPlan.name}. O valor foi cobrado proporcionalmente.`,
      });

      await fetchCurrentPlan();
    } catch (error: any) {
      logClientError(error, { component: 'Plan', action: 'handleConfirmUpgrade', planId: selectedPlan.id });
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível realizar o upgrade.',
        variant: 'destructive',
      });
    }
  };

  const handleConfirmDowngrade = async () => {
    if (!selectedPlan) return;

    try {
      const response = await fetch('/api/stripe/change-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPlanId: selectedPlan.id,
          billingPeriod,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao processar downgrade');
      }

      setDowngradeDialogOpen(false);
      setSelectedPlan(null);

      setPendingPlan(selectedPlan.id);
      setPendingPlanChangeAt(new Date(result.changeAt));

      // Invalidar cache da subscription
      await refreshSubscription();

      toast({
        title: 'Downgrade agendado!',
        description: `Seu plano será alterado para ${selectedPlan.name} em ${new Date(
          result.changeAt
        ).toLocaleDateString('pt-BR')}.`,
      });

      await fetchCurrentPlan();
    } catch (error: any) {
      logClientError(error, { component: 'Plan', action: 'handleConfirmDowngrade', planId: selectedPlan.id });
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível agendar o downgrade.',
        variant: 'destructive',
      });
    }
  };

  const handleCancelPlanChange = async () => {
    try {
      const response = await fetch('/api/stripe/cancel-plan-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao cancelar mudança de plano');
      }

      setPendingPlan(null);
      setPendingPlanChangeAt(null);

      // Invalidar cache da subscription
      await refreshSubscription();

      toast({
        title: 'Mudança cancelada',
        description: 'A mudança de plano agendada foi cancelada.',
      });

      await fetchCurrentPlan();
    } catch (error: any) {
      logClientError(error, { component: 'Plan', action: 'handleCancelPlanChange' });
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível cancelar a mudança de plano.',
        variant: 'destructive',
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
    <AppLayout>
      {/* Payment Verification Overlay */}
      {verifyingPayment && (
        <Suspense fallback={<ComponentLoader fullScreen message="Verificando pagamento..." />}>
          <PaymentVerification status={paymentStatus} />
        </Suspense>
      )}

      <PageHeader title="Planos e Preços" description="Escolha o plano ideal para suas necessidades" />

      {/* Pending Plan Change Banner */}
      {pendingPlan && pendingPlanChangeAt && (
        <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-amber-900">Mudança de plano agendada</p>
              <p className="text-xs text-amber-700">
                Seu plano será alterado para <strong>{plans.find((p) => p.id === pendingPlan)?.name}</strong> em{' '}
                <strong>{pendingPlanChangeAt.toLocaleDateString('pt-BR')}</strong>
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancelPlanChange}
            className="text-amber-900 hover:text-amber-950 hover:bg-amber-100"
          >
            <XIcon className="h-4 w-4 mr-2" />
            Cancelar mudança
          </Button>
        </div>
      )}

      <Suspense fallback={<ComponentLoader message="Carregando planos..." />}>
        <Pricing className="py-10" currentPlanId={currentPlan} handleSelectPlan={handleSelectPlan} />
      </Suspense>

      {/* Checkout Modal */}
      {checkoutModalOpen && (
        <Suspense fallback={null}>
          <CheckoutModal
            isOpen={checkoutModalOpen}
            onClose={handleCloseCheckoutModal}
            plan={selectedPlan}
            billingPeriod={billingPeriod}
          />
        </Suspense>
      )}

      {/* Upgrade Confirmation Dialog */}
      {upgradeDialogOpen && (
        <Suspense fallback={null}>
          <ImmediateUpgradeDialog
            isOpen={upgradeDialogOpen}
            onClose={() => {
              setUpgradeDialogOpen(false);
              setSelectedPlan(null);
            }}
            onConfirm={handleConfirmUpgrade}
            currentPlan={currentPlan}
            newPlan={selectedPlan?.id || ''}
            billingPeriod={billingPeriod}
            nextRenewalDate={currentPeriodEndDate || undefined}
          />
        </Suspense>
      )}

      {/* Downgrade Confirmation Dialog */}
      {downgradeDialogOpen && (
        <Suspense fallback={null}>
          <DowngradeConfirmDialog
            isOpen={downgradeDialogOpen}
            onClose={() => {
              setDowngradeDialogOpen(false);
              setSelectedPlan(null);
            }}
            onConfirm={handleConfirmDowngrade}
            currentPlan={currentPlan}
            newPlan={selectedPlan?.id || ''}
            currentPeriodEnd={currentPeriodEndDate}
          />
        </Suspense>
      )}
    </AppLayout>
  );
}
