/**
 * Hook: useStripeProducts
 *
 * Gerencia cache de produtos do Stripe com duração de 1 dia.
 * Armazena no localStorage e reseta automaticamente no primeiro acesso de cada dia.
 *
 * Benefícios:
 * - Reduz chamadas desnecessárias à API do Stripe
 * - Melhora performance de carregamento
 * - Cache inteligente que reseta diariamente
 */

import { useState, useEffect, useCallback } from 'react';
import type { StripeProduct } from '@/lib/stripe/types';

interface CachedData {
  products: StripeProduct[];
  cachedAt: string; // Data em formato ISO
}

const CACHE_KEY = 'stripe-products-cache';

/**
 * Verifica se o cache é do dia atual
 */
function isCacheValid(cachedAt: string): boolean {
  const cached = new Date(cachedAt);
  const now = new Date();

  // Verifica se é o mesmo dia (ano, mês, dia)
  return (
    cached.getFullYear() === now.getFullYear() &&
    cached.getMonth() === now.getMonth() &&
    cached.getDate() === now.getDate()
  );
}

/**
 * Carrega cache do localStorage
 */
function loadCache(): CachedData | null {
  if (typeof window === 'undefined') return null;

  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const data: CachedData = JSON.parse(cached);

    // Valida se o cache é do dia atual
    if (!isCacheValid(data.cachedAt)) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro ao carregar cache de produtos:', error);
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
}

/**
 * Salva cache no localStorage
 */
function saveCache(products: StripeProduct[]): void {
  if (typeof window === 'undefined') return;

  try {
    const data: CachedData = {
      products,
      cachedAt: new Date().toISOString(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Erro ao salvar cache de produtos:', error);
  }
}

/**
 * Hook para gerenciar produtos do Stripe com cache diário
 */
export function useStripeProducts() {
  const [products, setProducts] = useState<StripeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async (forceRefresh = false) => {
    try {
      // Tenta carregar do cache primeiro (se não forçar refresh)
      if (!forceRefresh) {
        const cached = loadCache();
        if (cached) {
          setProducts(cached.products);
          setLoading(false);
          return;
        }
      }

      // Se não houver cache válido, busca da API
      setLoading(true);
      setError(null);

      const response = await fetch('/api/stripe/products', {
        cache: forceRefresh ? 'no-store' : 'default',
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar produtos do Stripe');
      }

      const data = await response.json();
      const fetchedProducts = data.products || [];

      // Salva no cache e atualiza estado
      saveCache(fetchedProducts);
      setProducts(fetchedProducts);
    } catch (err) {
      console.error('Erro ao buscar produtos:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  // Carrega produtos na montagem do componente
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  /**
   * Força refresh do cache
   */
  const refreshProducts = useCallback(() => {
    return fetchProducts(true);
  }, [fetchProducts]);

  /**
   * Limpa o cache manualmente
   */
  const clearCache = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CACHE_KEY);
    }
  }, []);

  return {
    products,
    loading,
    error,
    refreshProducts,
    clearCache,
  };
}

// Re-export type for convenience
export type { StripeProduct } from '@/lib/stripe/types';
