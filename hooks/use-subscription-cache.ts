/**
 * Hook: useSubscriptionCache
 *
 * Gerencia cache da subscription ativa do Stripe.
 * Cache persiste no localStorage e reseta às 6h AM do dia seguinte.
 *
 * Benefícios:
 * - Persiste entre reloads da página
 * - Cache automático até 6h AM do próximo dia
 * - Reduz chamadas à API do Stripe
 * - Acesso rápido a informações da subscription
 */

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { logClientError } from '@/lib/client-error-logger';
import { getCache, setCache, removeCache, CACHE_KEYS } from '@/lib/cache-manager';
import Stripe from 'stripe';

export type SubscriptionType = Stripe.Subscription;

interface UseSubscriptionCacheReturn {
  subscription: SubscriptionType | null;
  loading: boolean;
  error: string | null;
  refreshSubscription: () => Promise<void>;
  clearCache: () => void;

  // Computed properties para facilitar uso
  currentPeriodEndDate: Date | null;
  daysUntilRenewal: number | null;
  isActive: boolean;
  isCanceled: boolean;
  hasPendingChange: boolean;
}

/**
 * Hook para gerenciar cache da subscription ativa
 */
export function useSubscriptionCache(): UseSubscriptionCacheReturn {
  const [subscription, setSubscription] = useState<SubscriptionType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  /**
   * Busca informações da subscription ativa
   * Primeiro tenta o cache do localStorage, depois faz chamada à API
   */
  const fetchSubscription = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Verificar cache no localStorage
      const cached = getCache<SubscriptionType>(CACHE_KEYS.SUBSCRIPTION);
      if (cached) {
        setSubscription(cached);
        setLoading(false);
        return;
      }

      // 2. Cache miss - buscar dados frescos
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('Usuário não autenticado');
      }

      // 3. Buscar dados do profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, plan')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile) {
        throw new Error('Perfil não encontrado');
      }

      // Se o plano é starter (gratuito), não há subscription
      if (profile.plan === 'starter') {
        setSubscription(null);
        setLoading(false);
        return;
      }

      // 4. Buscar subscription ativa do Stripe via API
      const response = await fetch('/api/stripe/subscription', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao buscar subscription');
      }

      const { subscription: subscriptionData } = (await response.json()) as { subscription: SubscriptionType };

      if (!subscriptionData) {
        setSubscription(null);
        setLoading(false);
        return;
      }

      // 5. Montar objeto de subscription com dados completos
      const subscriptionInfo = subscriptionData;

      // 6. Salvar no cache (expira às 6h AM do próximo dia)
      setCache(CACHE_KEYS.SUBSCRIPTION, subscriptionInfo, 'subscription');
      setSubscription(subscriptionInfo);
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao buscar subscription';
      setError(errorMessage);
      logClientError(err, {
        component: 'useSubscriptionCache',
        action: 'fetchSubscription',
      });
      console.error('Erro ao buscar subscription:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  /**
   * Força refresh da subscription, invalidando o cache
   */
  const refreshSubscription = useCallback(async () => {
    removeCache(CACHE_KEYS.SUBSCRIPTION);
    await fetchSubscription();
  }, [fetchSubscription]);

  /**
   * Limpa o cache (útil após logout ou mudança de plano)
   */
  const clearCache = useCallback(() => {
    setSubscription(null);
    setError(null);
    removeCache(CACHE_KEYS.SUBSCRIPTION);
  }, []);

  // Buscar subscription ao montar (cache ou API)
  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Computed properties
  // Stripe.Subscription.current_period_end é um Unix timestamp em segundos
  const currentPeriodEndDate =
    subscription && 'current_period_end' in subscription && subscription.current_period_end
      ? new Date(Number(subscription.current_period_end) * 1000)
      : null;

  const daysUntilRenewal = currentPeriodEndDate
    ? Math.ceil((currentPeriodEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const isActive = subscription?.status === 'active';
  const isCanceled = subscription?.status === 'canceled';
  const hasPendingChange =
    subscription && 'cancel_at_period_end' in subscription ? Boolean(subscription.cancel_at_period_end) : false;

  return {
    subscription,
    loading,
    error,
    refreshSubscription,
    clearCache,
    currentPeriodEndDate,
    daysUntilRenewal,
    isActive,
    isCanceled,
    hasPendingChange,
  };
}
