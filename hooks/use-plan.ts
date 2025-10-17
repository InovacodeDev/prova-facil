/**
 * usePlan Hook
 *
 * Complete hook for fetching user plan information with real-time updates.
 * Fetches subscription data from Stripe API and maps to internal plan ID.
 *
 * Features:
 * - Fetches subscription from API with React Query caching
 * - Maps Stripe product ID to internal plan ID
 * - Real-time updates via Supabase subscriptions
 * - Scheduled plan changes (upgrades/downgrades)
 * - Auto-refresh on subscription updates
 *
 * Cache Strategy:
 * - React Query with 1 minute staleTime for fresh data
 * - Real-time invalidation on profile changes
 * - Manual invalidation via custom events
 *
 * @example
 * ```tsx
 * function PlanBadge() {
 *   const { plan, isLoading } = usePlan();
 *
 *   if (isLoading) return <Skeleton />;
 *
 *   return <Badge>{plan.name}</Badge>;
 * }
 * ```
 */

'use client';

import type { PlanId } from '@/lib/plans/config';
import { createClient } from '@/lib/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { useProfile } from './use-profile';

export interface PlanData {
  /** Current plan ID (starter, basic, essentials, plus, advanced) */
  id: PlanId;
  /** Plan name for display */
  name: string;
  /** Plan status from Stripe */
  status: string;
  /** Whether the subscription will cancel at period end */
  cancelAtPeriodEnd: boolean;
  /** Current period end timestamp (seconds) */
  currentPeriodEnd: number | null;
  /** Current period start timestamp (seconds) */
  currentPeriodStart: number | null;
  /** Expiration date for the plan (ISO string) */
  expiresAt: string | null;
  /** Whether this is a free/starter plan */
  isFree: boolean;
  /** Whether the plan is active */
  isActive: boolean;
  /** Whether the plan is past due */
  isPastDue: boolean;
  /** Whether the plan is canceled */
  isCanceled: boolean;
  /** Stripe product ID */
  productId: string | null;
  /** Stripe price ID */
  priceId: string | null;
  /** Scheduled next plan (for downgrades/upgrades) */
  scheduledNextPlan: PlanId | null;
}

export interface PlanConfig {
  /** Plan ID */
  id: string;
  /** Monthly question limit */
  questions_month: number;
  /** Allowed document types */
  doc_type: string[];
  /** Maximum document size in MB */
  docs_size: number;
  /** Maximum number of question types */
  max_question_types: number;
  /** Support types available */
  support: string[];
}

/**
 * Maps plan ID to display name
 */
const PLAN_NAMES: Record<PlanId, string> = {
  starter: 'Starter',
  basic: 'Basic',
  essentials: 'Essentials',
  plus: 'Plus',
  advanced: 'Advanced',
};

/**
 * Fetches plan configuration from database
 */
async function fetchPlanConfig(planId: string): Promise<PlanConfig> {
  const response = await fetch(`/api/plans/${planId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch plan config');
  }

  const data = await response.json();
  return data.plan;
}

/**
 * Fetches user plan data from subscription API
 */
async function fetchUserPlan(
  userId: string,
  stripeSubscriptionId: string,
  stripeCustomerId: string
): Promise<PlanData | null> {
  const supabase = createClient();

  // Get subscription data from API (uses cache)
  const subscriptionResponse = await fetch(
    `/api/stripe/subscription?userId=${userId}&stripe_subscription_id=${
      stripeSubscriptionId || ''
    }&stripe_customer_id=${stripeCustomerId || ''}`
  );

  if (!subscriptionResponse.ok) {
    return null;
  }

  const { subscription } = await subscriptionResponse.json();
  const stripeProductId = subscription.productId;
  const scheduledNextProductId = subscription.scheduledNextPlan; // Already the plan ID from backend

  if (!stripeProductId) {
    return null;
  }

  // Get plan configuration based on stripe_product_id
  const { data: planData } = await supabase
    .from('plans')
    .select('id')
    .eq('stripe_product_id', stripeProductId)
    .maybeSingle();

  if (!planData) {
    return null;
  }

  const planId = planData.id as PlanId;

  return {
    id: planId,
    name: PLAN_NAMES[planId] || planId,
    status: subscription.status,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    currentPeriodEnd: subscription.currentPeriodEnd,
    currentPeriodStart: subscription.currentPeriodStart,
    expiresAt: subscription.planExpireAt,
    isFree: planId === 'starter' || subscription.status === 'none',
    isActive: subscription.status === 'active',
    isPastDue: subscription.status === 'past_due',
    isCanceled: subscription.status === 'canceled' || subscription.cancelAtPeriodEnd,
    productId: subscription.productId,
    priceId: subscription.priceId,
    scheduledNextPlan: scheduledNextProductId as PlanId | null,
  };
}

/**
 * Hook para buscar os dados do plano do usuário com suporte a real-time updates
 *
 * Features:
 * - Fetches from Stripe API via /api/stripe/subscription
 * - Maps stripe_product_id to internal plan ID
 * - Real-time updates on profile changes
 * - Listens to custom subscription-updated events
 * - React Query caching with 1 minute staleTime
 *
 * @returns Plan data com estados derivados e função de refetch
 */
export function usePlan() {
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  const supabase = createClient();

  const {
    data: plan,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['user-plan', profile?.id],
    queryFn: () =>
      fetchUserPlan(profile!.user_id, profile!.stripe_subscription_id || '', profile!.stripe_customer_id || ''),
    enabled: !!profile?.id,
    staleTime: 60 * 1000, // 1 minute (fresher data for plan changes)
    gcTime: 5 * 60 * 1000, // 5 minutes in memory
    refetchOnMount: 'always', // Always refetch on mount for fresh plan data
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });

  // Setup real-time subscription for profile changes
  useEffect(() => {
    if (!profile?.id) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupRealtimeSubscription = async () => {
      try {
        console.log('[usePlan] Setting up real-time subscription for profile:', profile.id);

        channel = supabase
          .channel(`profile-plan-changes-${profile.id}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'profiles',
              filter: `id=eq.${profile.id}`,
            },
            (payload) => {
              console.log('[usePlan] Profile updated, invalidating plan cache...', payload);
              queryClient.invalidateQueries({ queryKey: ['user-plan', profile.id] });
            }
          )
          .subscribe((status) => {
            console.log('[usePlan] Realtime subscription status:', status);
          });
      } catch (error) {
        console.error('[usePlan] Error setting up realtime subscription:', error);
      }
    };

    setupRealtimeSubscription();

    // Listen for custom subscription update events
    const handleSubscriptionUpdate = () => {
      console.log('[usePlan] Subscription updated event received, invalidating cache...');
      queryClient.invalidateQueries({ queryKey: ['user-plan', profile.id] });
    };

    window.addEventListener('subscription-updated', handleSubscriptionUpdate);

    return () => {
      if (channel) {
        console.log('[usePlan] Cleaning up realtime subscription');
        supabase.removeChannel(channel);
      }
      window.removeEventListener('subscription-updated', handleSubscriptionUpdate);
    };
  }, [profile?.id, queryClient, supabase]);

  return {
    plan,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook para buscar a configuração detalhada do plano (limits, features, etc)
 * Útil para páginas que precisam de informações sobre limites e permissões
 *
 * @example
 * ```tsx
 * function CreateQuestionPage() {
 *   const { plan } = usePlan();
 *   const { config, isLoading } = usePlanConfig(plan?.id);
 *
 *   const maxQuestions = config?.questions_month ?? 30;
 *   const allowedTypes = config?.max_question_types ?? 1;
 * }
 * ```
 */
export function usePlanConfig(planId?: string) {
  const {
    data: config,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['plan-config', planId],
    queryFn: () => fetchPlanConfig(planId!),
    enabled: !!planId, // Only fetch if we have a planId
    staleTime: 4 * 60 * 60 * 1000, // 4 hours (config doesn't change often)
    gcTime: 6 * 60 * 60 * 1000, // 6 hours
  });

  return {
    config,
    isLoading,
    error,
  };
}

/**
 * Hook para verificar se o usuário tem um plano específico
 *
 * @example
 * ```tsx
 * function PremiumFeature() {
 *   const hasAccess = useHasPlan(['plus', 'advanced']);
 *
 *   if (!hasAccess) return <UpgradePrompt />;
 *
 *   return <PremiumContent />;
 * }
 * ```
 */
export function useHasPlan(requiredPlans: PlanId | PlanId[]): boolean {
  const { plan } = usePlan();

  const plans = Array.isArray(requiredPlans) ? requiredPlans : [requiredPlans];

  if (!plan) return false;

  return plans.includes(plan.id);
}

/**
 * Hook para verificar se o usuário pode acessar uma feature
 * baseado no tier do plano
 *
 * Plan Tiers (ascending):
 * starter < basic < essentials < plus < advanced
 *
 * @example
 * ```tsx
 * function AdvancedFeature() {
 *   const canAccess = useCanAccessFeature('essentials');
 *
 *   if (!canAccess) return <UpgradePrompt />;
 *
 *   return <FeatureContent />;
 * }
 * ```
 */
export function useCanAccessFeature(minimumPlan: PlanId): boolean {
  const { plan } = usePlan();

  if (!plan) return false;

  const planTiers: Record<PlanId, number> = {
    starter: 0,
    basic: 1,
    essentials: 2,
    plus: 3,
    advanced: 4,
  };

  const userTier = planTiers[plan.id] ?? 0;
  const requiredTier = planTiers[minimumPlan] ?? 0;

  return userTier >= requiredTier;
}

/**
 * Hook para obter informações sobre o período atual do plano
 *
 * @example
 * ```tsx
 * function BillingInfo() {
 *   const period = usePlanPeriod();
 *
 *   return (
 *     <div>
 *       <p>Renewal: {period.daysUntilRenewal} days</p>
 *       <p>Progress: {period.periodProgress}%</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function usePlanPeriod() {
  const { plan } = usePlan();

  return useMemo(() => {
    if (!plan?.currentPeriodStart || !plan?.currentPeriodEnd) {
      return {
        daysUntilRenewal: null,
        daysInPeriod: null,
        periodProgress: null,
        startDate: null,
        endDate: null,
      };
    }

    const now = Date.now() / 1000; // Convert to seconds
    const start = plan.currentPeriodStart;
    const end = plan.currentPeriodEnd;

    const totalSeconds = end - start;
    const elapsedSeconds = now - start;
    const remainingSeconds = end - now;

    const daysUntilRenewal = Math.ceil(remainingSeconds / (24 * 60 * 60));
    const daysInPeriod = Math.ceil(totalSeconds / (24 * 60 * 60));
    const periodProgress = Math.round((elapsedSeconds / totalSeconds) * 100);

    return {
      daysUntilRenewal: daysUntilRenewal > 0 ? daysUntilRenewal : 0,
      daysInPeriod,
      periodProgress: Math.min(100, Math.max(0, periodProgress)),
      startDate: new Date(start * 1000),
      endDate: new Date(end * 1000),
    };
  }, [plan]);
}
