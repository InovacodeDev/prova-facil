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
 * CRITICAL: This function must receive profile data as parameter (cannot use hooks inside async function)
 */
async function fetchSubscription(
  userId: string,
  stripeSubscriptionId: string | null,
  stripeCustomerId: string | null
): Promise<CachedSubscriptionData> {
  const response = await fetch(
    `/api/stripe/subscription?userId=${userId}&stripe_subscription_id=${
      stripeSubscriptionId || ''
    }&stripe_customer_id=${stripeCustomerId || ''}`,
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
 * IMPORTANT: Requires profile data to be loaded first. Query is automatically disabled
 * until profile is available, preventing null errors.
 *
 * @returns Query result com subscription data, loading state e error handling
 */
export function useSubscription() {
  const { profile, isLoading: isProfileLoading } = useProfile();

  return useQuery({
    queryKey: ['stripe', 'subscription', profile?.user_id],
    queryFn: () => {
      if (!profile) {
        throw new Error('Profile not loaded - subscription query should be disabled');
      }
      return fetchSubscription(profile.user_id, profile.stripe_subscription_id, profile.stripe_customer_id);
    },
    // CRITICAL: Only enable query when profile is loaded and has user_id
    enabled: !isProfileLoading && !!profile?.user_id,
    staleTime: FOUR_HOURS_IN_MS, // Dados considerados "fresh" por 4 horas
    gcTime: SIX_HOURS_IN_MS, // Mantém em cache por 6 horas
    refetchOnWindowFocus: true, // Revalida ao voltar para a aba (se stale)
    refetchOnMount: 'always', // Always refetch on mount to ensure fresh data after navigation
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
