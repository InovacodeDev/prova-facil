/**
 * useSubscription Hook
 *
 * Fetches and caches the current user's Stripe subscription data.
 * Uses React Query for automatic caching and revalidation.
 *
 * Cache Strategy:
 * - staleTime: 4 hours (data considered fresh)
 * - cacheTime: 6 hours (data kept in memory)
 * - Invalidated automatically on plan changes
 * - Requires authentication
 *
 * @example
 * ```tsx
 * function SubscriptionStatus() {
 *   const { data: subscription, isLoading, error } = useSubscription();
 *
 *   if (isLoading) return <div>Loading subscription...</div>;
 *   if (error) return <div>Error loading subscription</div>;
 *
 *   return (
 *     <div>
 *       <p>Plan: {subscription.plan}</p>
 *       <p>Status: {subscription.status}</p>
 *     </div>
 *   );
 * }
 * ```
 */

'use client';

import type { CachedSubscriptionData } from '@/lib/cache/subscription-cache';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useProfile } from './use-profile';

interface SubscriptionResponse {
  subscription: CachedSubscriptionData;
}

const FOUR_HOURS_IN_MS = 4 * 60 * 60 * 1000;
const SIX_HOURS_IN_MS = 6 * 60 * 60 * 1000;

/**
 * Fetches subscription data from the API
 */
async function fetchSubscription(): Promise<CachedSubscriptionData> {
  const { profile } = useProfile();

  const response = await fetch(
    `/api/stripe/subscription?userId=${profile.user_id}&stripe_subscription_id=${profile.stripe_subscription_id}&stripe_customer_id=${profile.stripe_customer_id}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Inclui cookies de autenticação
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch subscription: ${response.statusText}`);
  }

  const data: SubscriptionResponse = await response.json();
  return data.subscription;
}

/**
 * Hook para buscar dados da subscription do usuário com cache de 4 horas
 *
 * @returns Query result com subscription data, loading state e error handling
 */
export function useSubscription() {
  return useQuery({
    queryKey: ['stripe', 'subscription'],
    queryFn: fetchSubscription,
    staleTime: FOUR_HOURS_IN_MS, // Dados considerados "fresh" por 4 horas
    gcTime: SIX_HOURS_IN_MS, // Mantém em cache por 6 horas
    refetchOnWindowFocus: true, // Revalida ao voltar para a aba (se stale)
    refetchOnMount: 'always', // CHANGED: Always refetch on mount to ensure fresh data after navigation
    retry: 1, // Tenta 1 vez em caso de erro (auth error não deve retry muito)
  });
}

/**
 * Hook para invalidar o cache de subscription
 * CRITICAL: Deve ser chamado após mudanças de plano, upgrades, downgrades, cancelamentos
 *
 * @example
 * ```tsx
 * function UpgradeButton() {
 *   const invalidateSubscription = useInvalidateSubscription();
 *
 *   const handleUpgrade = async () => {
 *     await upgradePlan();
 *     invalidateSubscription(); // Força refetch da subscription
 *   };
 * }
 * ```
 */
export function useInvalidateSubscription() {
  const queryClient = useQueryClient();

  return () => {
    console.log('[useInvalidateSubscription] Invalidating subscription cache...');
    queryClient.invalidateQueries({
      queryKey: ['stripe', 'subscription'],
      refetchType: 'active', // Force refetch active queries
    });
  };
}

/**
 * Hook para invalidar TODOS os dados relacionados ao Stripe
 * Útil após mudanças significativas (upgrade, downgrade, cancelamento)
 *
 * @example
 * ```tsx
 * function PlanChangeHandler() {
 *   const invalidateStripeData = useInvalidateAllStripeData();
 *
 *   const handlePlanChange = async () => {
 *     await changePlan();
 *     invalidateStripeData(); // Invalida products, subscription e plan
 *   };
 * }
 * ```
 */
export function useInvalidateAllStripeData() {
  const queryClient = useQueryClient();

  return () => {
    console.log('[useInvalidateAllStripeData] Invalidating ALL Stripe cache...');
    // Invalida todas as queries do Stripe de uma vez
    queryClient.invalidateQueries({
      queryKey: ['stripe'],
      refetchType: 'active', // Force refetch active queries immediately
    });
  };
}

/**
 * Hook para atualizar os dados de subscription no cache sem refetch
 * Útil para otimistic updates
 *
 * @example
 * ```tsx
 * function CancelSubscriptionButton() {
 *   const updateSubscription = useUpdateSubscriptionCache();
 *
 *   const handleCancel = async () => {
 *     // Optimistic update
 *     updateSubscription(prev => ({
 *       ...prev,
 *       cancelAtPeriodEnd: true,
 *     }));
 *
 *     await cancelSubscription();
 *   };
 * }
 * ```
 */
export function useUpdateSubscriptionCache() {
  const queryClient = useQueryClient();

  return (updater: (prev: CachedSubscriptionData) => CachedSubscriptionData) => {
    queryClient.setQueryData<CachedSubscriptionData>(['stripe', 'subscription'], (old) => {
      if (!old) return old;
      return updater(old);
    });
  };
}
