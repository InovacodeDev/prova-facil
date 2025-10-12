/**
 * Stripe Client-Side Integration
 *
 * This module provides client-side Stripe functionality using @stripe/stripe-js
 * ONLY use this in Client Components (with 'use client' directive)
 */

import { loadStripe, Stripe } from '@stripe/stripe-js';

// Get publishable key from environment
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!;

if (!stripePublishableKey) {
  console.warn(
    'Stripe publishable key not found. Make sure NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set in your environment variables.'
  );
}

// Singleton instance
let stripePromise: Promise<Stripe | null>;

/**
 * Gets the Stripe.js instance (singleton pattern)
 *
 * @returns Promise resolving to Stripe instance or null
 */
export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    stripePromise = loadStripe(stripePublishableKey);
  }
  return stripePromise;
}

/**
 * Redirects to Stripe Checkout using the session ID
 * The redirect is handled by navigating to the Stripe Checkout URL
 *
 * @param checkoutUrl - The complete Checkout Session URL from Stripe
 */
export async function redirectToCheckout(checkoutUrl: string): Promise<void> {
  if (typeof window !== 'undefined') {
    window.location.href = checkoutUrl;
  }
}
