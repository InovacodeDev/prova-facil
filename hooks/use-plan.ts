/**
 * usePlan Hook
 *
 * Simplified hook that extracts just the plan information from subscription data.
 * Uses useSubscription internally but provides a cleaner API for components
 * that only need plan details.
 *
 * Cache Strategy:
 * - Inherits from useSubscription (4 hours staleTime)
 * - Automatically invalidated when subscription changes
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
import { useMemo } from 'react';
import { useSubscription } from './use-subscription';

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
 * Hook para buscar apenas os dados do plano do usuário
 * Mais simples que useSubscription, focado apenas no plano
 *
 * @returns Plan data com estados derivados
 */
export function usePlan() {
  const { data: subscription, isLoading, error, refetch } = useSubscription();

  // Derive plan data from subscription
  const plan = useMemo<PlanData | null>(() => {
    if (!subscription) return null;

    const planId = subscription.plan as PlanId;

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
    };
  }, [subscription]);

  return {
    plan,
    isLoading,
    error,
    refetch,
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
