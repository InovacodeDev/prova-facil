/**
 * useProducts Hook
 *
 * Fetches and caches Stripe products with prices.
 * Uses React Query for automatic caching and revalidation.
 *
 * Cache Strategy:
 * - staleTime: 4 hours (data considered fresh)
 * - cacheTime: 6 hours (data kept in memory)
 * - Automatically refetches on window focus (if stale)
 * - Can be manually invalidated on plan changes
 *
 * @example
 * ```tsx
 * function PricingPage() {
 *   const { data: products, isLoading, error, refetch } = useProducts();
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *
 *   return products?.map(product => <PriceCard key={product.id} {...product} />);
 * }
 * ```
 */

'use client';

import type { StripeProductWithPrices } from '@/types/stripe';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface ProductsResponse {
  products: StripeProductWithPrices[];
}

const FOUR_HOURS_IN_MS = 4 * 60 * 60 * 1000;
const SIX_HOURS_IN_MS = 6 * 60 * 60 * 1000;

/**
 * Fetches products from the Stripe API
 */
async function fetchProducts(): Promise<StripeProductWithPrices[]> {
  const response = await fetch('/api/stripe/products', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch products: ${response.statusText}`);
  }

  const data: ProductsResponse = await response.json();
  return data.products;
}

/**
 * Hook para buscar produtos do Stripe com cache de 4 horas
 *
 * @returns Query result com produtos, loading state e error handling
 */
export function useProducts() {
  return useQuery({
    queryKey: ['stripe', 'products'],
    queryFn: fetchProducts,
    staleTime: FOUR_HOURS_IN_MS, // Dados considerados "fresh" por 4 horas
    gcTime: SIX_HOURS_IN_MS, // Mantém em cache por 6 horas (antes era cacheTime)
    refetchOnWindowFocus: true, // Revalida ao voltar para a aba (se stale)
    refetchOnMount: false, // Não refetch se já tem dados fresh
    retry: 2, // Tenta 2 vezes em caso de erro
  });
}

/**
 * Hook para invalidar o cache de produtos
 * Útil após mudanças de plano ou atualizações de produtos
 *
 * @example
 * ```tsx
 * function Component() {
 *   const invalidateProducts = useInvalidateProducts();
 *
 *   const handlePlanChange = async () => {
 *     await updatePlan();
 *     invalidateProducts(); // Força refetch dos produtos
 *   };
 * }
 * ```
 */
export function useInvalidateProducts() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({
      queryKey: ['stripe', 'products'],
    });
  };
}

/**
 * Hook para prefetch de produtos
 * Útil para carregar produtos antes de navegar para a página de pricing
 *
 * @example
 * ```tsx
 * function Navigation() {
 *   const prefetchProducts = usePrefetchProducts();
 *
 *   return (
 *     <Link
 *       href="/pricing"
 *       onMouseEnter={prefetchProducts} // Preload ao hover
 *     >
 *       Pricing
 *     </Link>
 *   );
 * }
 * ```
 */
export function usePrefetchProducts() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.prefetchQuery({
      queryKey: ['stripe', 'products'],
      queryFn: fetchProducts,
      staleTime: FOUR_HOURS_IN_MS,
    });
  };
}
