'use client';

import { PageHeader } from '@/components/layout';
import { PlanConfirmationModal } from '@/components/PlanConfirmationModal';
import { PricingShared } from '@/components/PricingShared';
import { useInvalidateAllStripeData, usePlan, useProducts } from '@/hooks/stripe';
import { useStripe } from '@/hooks/use-stripe';
import { useToast } from '@/hooks/use-toast';
import { logClientError } from '@/lib/client-error-logger';
import { isDowngrade, isFreePlan } from '@/lib/stripe/plan-helpers';
import { createClient } from '@/lib/supabase/client';
import type { StripeProductWithPrices } from '@/types/stripe';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PlanPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<StripeProductWithPrices | null>(null);
  const [selectedPriceId, setSelectedPriceId] = useState<string>('');
  const [selectedBillingPeriod, setSelectedBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [modalVariant, setModalVariant] = useState<'upgrade' | 'downgrade'>('upgrade');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  const { createCheckout, updateSubscription } = useStripe();

  // Use hooks for data fetching with automatic caching (4h)
  const { data: products, isLoading: productsLoading, refetch: refetchProducts } = useProducts();
  const { plan, isLoading: planLoading, refetch: refetchPlan } = usePlan();
  const invalidateStripeData = useInvalidateAllStripeData();

  const currentPlan = plan?.id || 'starter';
  const loading = planLoading;
  const currentPeriodEnd = plan?.currentPeriodEnd ? new Date(plan.currentPeriodEnd * 1000).toISOString() : null;

  useEffect(() => {
    handleStripeReturn();
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/auth');
    }
  };

  const handleStripeReturn = () => {
    const params = new URLSearchParams(window.location.search);

    if (params.get('success') === 'true') {
      toast({
        title: 'Pagamento confirmado!',
        description: 'Seu plano foi atualizado com sucesso.',
      });
      // Invalidate all Stripe data to force refetch
      invalidateStripeData();
      window.history.replaceState({}, '', '/plan');
    }

    if (params.get('canceled') === 'true') {
      toast({
        title: 'Pagamento cancelado',
        description: 'Você pode tentar novamente quando quiser.',
        variant: 'destructive',
      });
      window.history.replaceState({}, '', '/plan');
    }
  };

  const handleSelectPlan = async (planId: string, priceId: string, billingPeriod: 'monthly' | 'annual') => {
    // Find the selected product
    const product = products?.find((p) => p.internalPlanId === planId);
    if (!product) return;

    // Store selection
    setSelectedPlan(product);
    setSelectedPriceId(priceId);
    setSelectedBillingPeriod(billingPeriod);

    // Determine if this is an upgrade or downgrade
    if (isDowngrade(currentPlan, planId)) {
      setModalVariant('downgrade');
    } else {
      setModalVariant('upgrade');
    }

    // Open confirmation modal
    setModalOpen(true);
  };

  const handleConfirmPlan = async () => {
    if (!selectedPlan) return;

    setCheckoutLoading(true);

    try {
      const isCurrentlyOnFreePlan = isFreePlan(currentPlan);
      const isChangingToFreePlan = isFreePlan(selectedPlan.internalPlanId);
      const isUpgrade = modalVariant === 'upgrade';

      // Case 1: User on FREE, going to PAID - Use checkout (create first subscription)
      if (isCurrentlyOnFreePlan && !isChangingToFreePlan) {
        await createCheckout(selectedPriceId);
        // Checkout redirects, no further action needed
        return;
      }

      // Case 2: User on PAID, going to FREE - Cancel subscription
      if (!isCurrentlyOnFreePlan && isChangingToFreePlan) {
        const response = await fetch('/api/stripe/cancel-subscription', {
          method: 'POST',
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || error.error || 'Failed to cancel subscription');
        }

        const data = await response.json();

        toast({
          title: 'Assinatura cancelada',
          description: `Sua assinatura será cancelada ao final do período. Você voltará ao plano Starter.`,
        });

        setModalOpen(false);
        invalidateStripeData();
        return;
      }

      // Case 3: User on PAID, changing to another PAID - Update subscription
      if (!isCurrentlyOnFreePlan && !isChangingToFreePlan) {
        const result = await updateSubscription(selectedPriceId, isUpgrade);

        toast({
          title: isUpgrade ? 'Plano atualizado!' : 'Mudança agendada',
          description: result.message,
        });

        setModalOpen(false);
        invalidateStripeData();
        return;
      }

      // Should not reach here
      throw new Error('Invalid plan change scenario');
    } catch (error: any) {
      console.error('Error confirming plan:', error);
      logClientError(error, { component: 'Plan', action: 'handleConfirmPlan', planId: selectedPlan.internalPlanId });
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível processar sua solicitação.',
        variant: 'destructive',
      });
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <>
      <PageHeader title="Planos" description="Escolha o plano ideal para suas necessidades" />

      {/* Main Content */}
      {loading || productsLoading ? (
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

      {/* Confirmation Modal */}
      <PlanConfirmationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        plan={selectedPlan}
        billingPeriod={selectedBillingPeriod}
        onConfirm={handleConfirmPlan}
        loading={checkoutLoading}
        variant={modalVariant}
        currentPlan={currentPlan}
        currentPeriodEnd={currentPeriodEnd}
      />
    </>
  );
}
