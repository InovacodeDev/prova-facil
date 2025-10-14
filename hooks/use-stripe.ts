/**
 * useStripe Hook
 *
 * Custom React hook for interacting with Stripe API from client components.
 * Provides easy-to-use methods for checkout, portal, and product fetching.
 */

'use client';

import type { CreatePortalResponse, ProductsResponse, StripeProductWithPrices } from '@/types/stripe';
import { useCallback, useState } from 'react';

interface UseStripeReturn {
  // State
  loading: boolean;
  error: string | null;
  products: StripeProductWithPrices[] | null;

  // Actions
  createCheckout: (priceId: string) => Promise<void>;
  updateSubscription: (priceId: string, immediate: boolean) => Promise<{ success: boolean; message: string }>;
  openBillingPortal: () => Promise<void>;
  fetchProducts: () => Promise<void>;
  clearError: () => void;
}

export function useStripe(): UseStripeReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<StripeProductWithPrices[] | null>(null);

  /**
   * Clears any existing error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Creates a checkout session and redirects the user
   *
   * @param priceId - Stripe Price ID (monthly or yearly)
   */
  const createCheckout = useCallback(async (priceId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      });

      const data = await response.json();

      // Handle case where user already has active subscription
      if (response.status === 409 && data.shouldRedirectToPortal) {
        throw new Error('Você já possui uma assinatura ativa. Use o gerenciamento de planos para alterá-la.');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(message);
      console.error('Checkout error:', err);
      throw err; // Re-throw so caller can handle
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Updates an existing subscription to a new price/plan
   *
   * @param priceId - New Stripe Price ID
   * @param immediate - true for immediate upgrade (with proration), false for scheduled downgrade (at period end)
   * @returns Object with success status and message
   */
  const updateSubscription = useCallback(async (priceId: string, immediate: boolean) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/stripe/update-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId, immediate }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to update subscription');
      }

      return {
        success: true,
        message: data.message || 'Plano atualizado com sucesso',
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(message);
      console.error('Update subscription error:', err);
      throw err; // Re-throw so caller can handle
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Opens the Stripe Billing Portal for subscription management
   */
  const openBillingPortal = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/stripe/create-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create billing portal session');
      }

      const data: CreatePortalResponse = await response.json();

      // Redirect to Billing Portal
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No portal URL returned');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(message);
      console.error('Billing portal error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetches all products with prices from Stripe
   */
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/stripe/products', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch products');
      }

      const data: ProductsResponse = await response.json();
      setProducts(data.products);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(message);
      console.error('Fetch products error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    products,
    createCheckout,
    updateSubscription,
    openBillingPortal,
    fetchProducts,
    clearError,
  };
}
