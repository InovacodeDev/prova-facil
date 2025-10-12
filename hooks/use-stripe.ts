/**
 * useStripe Hook
 *
 * Custom React hook for interacting with Stripe API from client components.
 * Provides easy-to-use methods for checkout, portal, and product fetching.
 */

'use client';

import { useState, useCallback } from 'react';
import type {
  CreateCheckoutResponse,
  CreatePortalResponse,
  ProductsResponse,
  StripeProductWithPrices,
} from '@/types/stripe';

interface UseStripeReturn {
  // State
  loading: boolean;
  error: string | null;
  products: StripeProductWithPrices[] | null;

  // Actions
  createCheckout: (priceId: string) => Promise<void>;
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const data: CreateCheckoutResponse = await response.json();

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
    openBillingPortal,
    fetchProducts,
    clearError,
  };
}
