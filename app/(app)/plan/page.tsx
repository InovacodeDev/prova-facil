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

  // Helper function to notify other components about subscription updates
  const notifySubscriptionUpdate = () => {
    console.log('[Plan] Notifying subscription update to other components...');
    // Dispatch custom event for real-time UI updates (e.g., Sidebar)
    window.dispatchEvent(new CustomEvent('subscription-updated'));
  };

  const handleStripeReturn = async () => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');

    // Handle successful payment with session_id
    if (params.get('success') === 'true' || sessionId) {
      // If we have a session_id, sync the subscription immediately
      if (sessionId) {
        console.log('[Plan] Session ID detected, syncing subscription...', sessionId);

        try {
          const response = await fetch('/api/stripe/sync-subscription', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sessionId }),
          });

          const data = await response.json();

          if (response.ok && data.success) {
            console.log('[Plan] Subscription synced successfully:', data);

            toast({
              title: 'Pagamento confirmado!',
              description: 'Seu plano foi atualizado com sucesso.',
            });

            // Invalidate all Stripe data to force refetch
            console.log('[Plan] Invalidating Stripe cache...');
            invalidateStripeData();

            // Force refetch immediately since we already have the subscription
            console.log('[Plan] Refetching plan data...');
            refetchPlan();
            refetchProducts();

            // Notify other components (e.g., Sidebar)
            notifySubscriptionUpdate();
          } else {
            console.warn('[Plan] Subscription sync failed, will wait for webhook:', data);

            toast({
              title: 'Pagamento confirmado!',
              description: 'Seu plano será atualizado em alguns instantes.',
            });

            // Still invalidate and refetch, webhook will update
            invalidateStripeData();
            setTimeout(() => {
              refetchPlan();
              refetchProducts();
              notifySubscriptionUpdate();
            }, 2000);
          }
        } catch (error) {
          console.error('[Plan] Error syncing subscription:', error);

          toast({
            title: 'Pagamento confirmado!',
            description: 'Seu plano será atualizado em alguns instantes.',
          });

          // Fallback to webhook sync
          invalidateStripeData();
          setTimeout(() => {
            refetchPlan();
            refetchProducts();
            notifySubscriptionUpdate();
          }, 2000);
        }

        // Remove session_id from URL
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('session_id');
        newUrl.searchParams.delete('success');
        window.history.replaceState({}, '', newUrl.pathname);
      } else if (params.get('success') === 'true') {
        // Legacy success parameter (no session_id)
        toast({
          title: 'Pagamento confirmado!',
          description: 'Seu plano foi atualizado com sucesso.',
        });

        console.log('[Plan] Payment success - invalidating Stripe cache...');
        invalidateStripeData();

        setTimeout(() => {
          console.log('[Plan] Refetching plan data...');
          refetchPlan();
          refetchProducts();
          notifySubscriptionUpdate();
        }, 2000);

        window.history.replaceState({}, '', '/plan');
      }

      return;
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
    console.log('Selected plan:', planId, priceId, billingPeriod, product);
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

      // Case 1: User on FREE, going to PAID - Update subscription (will redirect to checkout to collect payment)
      if (isCurrentlyOnFreePlan && !isChangingToFreePlan) {
        const result = await updateSubscription(selectedPriceId, true); // immediate = true for upgrade

        // If requiresCheckout is true, the hook already redirected to checkout
        // Otherwise, show success message
        if (!result.requiresCheckout) {
          toast({
            title: 'Plano atualizado!',
            description: result.message,
          });
          setModalOpen(false);
          invalidateStripeData();

          setTimeout(() => {
            refetchPlan();
            refetchProducts();
            notifySubscriptionUpdate();
          }, 500);

          setCheckoutLoading(false);
        }
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

        // Invalidate cache and force refetch
        console.log('[Plan] Subscription canceled - invalidating cache and refetching...');
        invalidateStripeData();

        // Force refetch to show updated status
        setTimeout(() => {
          refetchPlan();
          refetchProducts();
          notifySubscriptionUpdate();
        }, 500);

        setCheckoutLoading(false);
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

        // Invalidate cache and force refetch
        console.log('[Plan] Subscription updated - invalidating cache and refetching...');
        invalidateStripeData();

        // Force refetch to show updated plan
        setTimeout(() => {
          refetchPlan();
          refetchProducts();
          notifySubscriptionUpdate();
        }, 500);

        setCheckoutLoading(false);
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
