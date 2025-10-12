/**
 * Stripe Configuration
 *
 * This file contains all Stripe-related configuration and constants.
 * Product IDs should match the ones created in your Stripe Dashboard.
 */

// Stripe API Keys (from environment variables)
export const stripeConfig = {
  secretKey: process.env.STRIPE_SECRET_KEY!,
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
} as const;

// Stripe Product IDs for each plan
// These must match the Product IDs in your Stripe Dashboard
export const STRIPE_PRODUCTS = {
  starter: process.env.STRIPE_PRODUCT_STARTER!, // Free plan (product exists but no price)
  basic: process.env.STRIPE_PRODUCT_BASIC!,
  essentials: process.env.STRIPE_PRODUCT_ESSENTIALS!,
  plus: process.env.STRIPE_PRODUCT_PLUS!,
  advanced: process.env.STRIPE_PRODUCT_ADVANCED!,
} as const;

// Plan mapping from Stripe Product ID to internal plan name
export const PRODUCT_ID_TO_PLAN: Record<string, string> = {
  [STRIPE_PRODUCTS.starter]: 'starter',
  [STRIPE_PRODUCTS.basic]: 'basic',
  [STRIPE_PRODUCTS.essentials]: 'essentials',
  [STRIPE_PRODUCTS.plus]: 'plus',
  [STRIPE_PRODUCTS.advanced]: 'advanced',
} as const;

// Reverse mapping: internal plan name to Stripe Product ID
export const PLAN_TO_PRODUCT_ID: Record<string, string> = {
  starter: STRIPE_PRODUCTS.starter,
  basic: STRIPE_PRODUCTS.basic,
  essentials: STRIPE_PRODUCTS.essentials,
  plus: STRIPE_PRODUCTS.plus,
  advanced: STRIPE_PRODUCTS.advanced,
} as const;

// Success/Cancel URLs for Checkout
export const getCheckoutUrls = (baseUrl: string) => ({
  success: `${baseUrl}/plan?success=true&session_id={CHECKOUT_SESSION_ID}`,
  cancel: `${baseUrl}/plan?canceled=true`,
});

// Validation function to ensure all required env vars are set
export function validateStripeConfig(): void {
  const requiredVars = [
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'STRIPE_PRODUCT_STARTER',
    'STRIPE_PRODUCT_BASIC',
    'STRIPE_PRODUCT_ESSENTIALS',
    'STRIPE_PRODUCT_PLUS',
    'STRIPE_PRODUCT_ADVANCED',
  ];

  const missing = requiredVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required Stripe environment variables: ${missing.join(', ')}\n` +
        'Please check your .env.local file and ensure all Stripe variables are set.'
    );
  }
}
