/**
 * Stripe Server-Side Client
 *
 * This module provides server-side Stripe functionality including:
 * - Customer management
 * - Subscription management with Redis caching
 * - Product and Price fetching
 * - Checkout Session creation
 *
 * This should ONLY be used on the server (API routes, Server Components, Server Actions)
 */

import {
  getCachedSubscription,
  setCachedSubscription,
  type CachedSubscriptionData,
} from '@/lib/cache/subscription-cache';
import type { PlanId } from '@/lib/plans/config';
import Stripe from 'stripe';
import { PRODUCT_ID_TO_PLAN, STRIPE_PRODUCTS, stripeConfig, validateStripeConfig } from './config';

// Validate configuration on module load (only on server)
if (typeof window === 'undefined') {
  try {
    validateStripeConfig();
  } catch (error) {
    console.error('Stripe configuration error:', error);
  }
}

// Initialize Stripe with latest API version
export const stripe = new Stripe(stripeConfig.secretKey, {
  apiVersion: '2025-09-30.clover',
  typescript: true,
});

/**
 * Stripe Product with its associated Prices
 */
export interface StripeProductWithPrices {
  id: string;
  name: string;
  description: string | null;
  metadata: Stripe.Metadata;
  active: boolean;
  prices: {
    monthly: Stripe.Price | null;
    yearly: Stripe.Price | null;
  };
  features: string[]; // Extracted from metadata.features (JSON stringified array)
  aiLevel: string; // Extracted from metadata.aiLevel
  questionsPerMonth: number; // Extracted from metadata.questionsPerMonth
  internalPlanId: PlanId; // Maps to our internal plan enum (starter, basic, etc.)
}

/**
 * Fetches all active products with their prices from Stripe
 * ONLY returns products configured in .env (STRIPE_PRODUCT_STARTER, BASIC, ESSENTIALS, PLUS, ADVANCED)
 *
 * @returns Array of products with monthly and yearly prices
 */
export async function getStripeProducts(): Promise<StripeProductWithPrices[]> {
  try {
    // Get list of configured product IDs from .env
    const configuredProductIds = Object.values(STRIPE_PRODUCTS);

    console.log(`[Stripe] Configured product IDs: ${configuredProductIds.join(', ')}`);

    // Fetch all active products
    const products = await stripe.products.list({
      active: true,
      expand: ['data.default_price'],
    });

    // Fetch all active prices
    const prices = await stripe.prices.list({
      active: true,
      expand: ['data.product'],
    });

    // Group prices by product
    const pricesByProduct = prices.data.reduce((acc, price) => {
      const productId = typeof price.product === 'string' ? price.product : price.product.id;
      if (!acc[productId]) {
        acc[productId] = [];
      }
      acc[productId].push(price);
      return acc;
    }, {} as Record<string, Stripe.Price[]>);

    // Map products to our custom structure
    const productsWithPrices: StripeProductWithPrices[] = products.data
      // FILTER: Only include products configured in .env
      .filter((product) => configuredProductIds.includes(product.id))
      .map((product) => {
        const productPrices = pricesByProduct[product.id] || [];

        // Find monthly and yearly prices
        const monthlyPrice = productPrices.find((p) => p.recurring?.interval === 'month' && p.active);
        const yearlyPrice = productPrices.find((p) => p.recurring?.interval === 'year' && p.active);

        // Extract metadata
        const features = product.metadata.features ? JSON.parse(product.metadata.features) : [];
        const aiLevel = product.metadata.aiLevel || 'IA Básica';
        const questionsPerMonth = parseInt(product.metadata.questionsPerMonth || '0', 10);

        // Map to internal plan ID
        const internalPlanId = (PRODUCT_ID_TO_PLAN[product.id] || 'starter') as PlanId;

        return {
          id: product.id,
          name: product.name,
          description: product.description,
          metadata: product.metadata,
          active: product.active,
          prices: {
            monthly: monthlyPrice || null,
            yearly: yearlyPrice || null,
          },
          features,
          aiLevel,
          questionsPerMonth,
          internalPlanId,
        };
      })
      .filter((p) => p.active); // Only return active products

    console.log(`[Stripe] Returning ${productsWithPrices.length} configured products`);

    return productsWithPrices;
  } catch (error) {
    console.error('Error fetching Stripe products:', error);
    throw new Error('Failed to fetch Stripe products');
  }
}

/**
 * Gets a specific product with prices by internal plan ID
 *
 * @param planId - Internal plan ID (starter, basic, etc.)
 * @returns Product with prices or null if not found
 */
export async function getProductByPlanId(planId: string): Promise<StripeProductWithPrices | null> {
  const products = await getStripeProducts();
  return products.find((p) => p.internalPlanId === planId) || null;
}

/**
 * Creates or retrieves a Stripe Customer for a user
 *
 * @param email - User's email
 * @param name - User's full name
 * @param userId - Internal user ID for metadata
 * @returns Stripe Customer object
 */
export async function createOrGetCustomer(
  email: string,
  name: string | null,
  userId: string
): Promise<Stripe.Customer> {
  // Check if customer already exists
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0];
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
    metadata: {
      userId,
    },
  });

  return customer;
}

/**
 * Creates a Stripe Checkout Session for subscription
 *
 * @param customerId - Stripe Customer ID
 * @param priceId - Stripe Price ID (monthly or yearly)
 * @param successUrl - URL to redirect on success
 * @param cancelUrl - URL to redirect on cancel
 * @returns Checkout Session object
 */
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<Stripe.Checkout.Session> {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    billing_address_collection: 'required',
    subscription_data: {
      metadata: {
        customerId,
      },
    },
  });

  return session;
}

/**
 * Retrieves a subscription by ID
 *
 * @param subscriptionId - Stripe Subscription ID
 * @returns Subscription object
 */
export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['default_payment_method', 'items.data.price.product'],
  });
}

/**
 * Cancels a subscription at period end
 *
 * @param subscriptionId - Stripe Subscription ID
 * @returns Updated subscription
 */
export async function cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

/**
 * Reactivates a canceled subscription
 *
 * @param subscriptionId - Stripe Subscription ID
 * @returns Updated subscription
 */
export async function reactivateSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

/**
 * Creates a Billing Portal Session for subscription management
 *
 * @param customerId - Stripe Customer ID
 * @param returnUrl - URL to return to after portal session
 * @returns Portal Session object
 */
export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  return await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

/**
 * Fetches subscription data with intelligent Redis caching
 *
 * This is the PRIMARY function to get subscription information.
 * It implements a cache-first strategy:
 * 1. Check Redis cache (fastest)
 * 2. If cache miss, fetch from Stripe API
 * 3. Store in cache with smart TTL
 * 4. Return subscription data
 *
 * Architecture:
 * - Database stores: stripe_customer_id, stripe_subscription_id (references only)
 * - Redis cache stores: full subscription data (plan, status, dates, etc.)
 * - Stripe API is the source of truth
 *
 * @param userId - User ID (for cache key)
 * @param stripeCustomerId - Stripe Customer ID
 * @param stripeSubscriptionId - Stripe Subscription ID (null for free plan)
 * @returns Subscription data with plan information
 */
export async function getSubscriptionData(
  userId: string,
  stripeCustomerId: string | null,
  stripeSubscriptionId: string | null
): Promise<CachedSubscriptionData> {
  // Check cache first
  const cached = await getCachedSubscription(userId);
  if (cached) {
    console.log(`[Stripe] Using cached subscription data for user: ${userId}`);
    return cached;
  }

  console.log(`[Stripe] Cache miss, fetching from Stripe API for user: ${userId}`);

  // If no customer ID or subscription ID, return free plan data
  if (!stripeCustomerId || !stripeSubscriptionId) {
    const freeData: CachedSubscriptionData = {
      subscriptionId: null,
      customerId: stripeCustomerId || '',
      status: 'none',
      plan: 'starter',
      planExpireAt: null,
      renewStatus: 'none',
      productId: null,
      priceId: null,
      cancelAtPeriodEnd: false,
      currentPeriodEnd: null,
      currentPeriodStart: null,
      cachedAt: new Date().toISOString(),
    };

    // Cache free plan data (will use 24h TTL)
    await setCachedSubscription(userId, freeData);
    return freeData;
  }

  try {
    // Fetch subscription from Stripe
    const subscription = await getSubscription(stripeSubscriptionId);

    // Check metadata for scheduled downgrade
    // If user has a previous plan that hasn't expired yet, use that instead
    const metadata = subscription.metadata || {};
    const previousPlanProductId = metadata.previous_plan_product_id;
    const previousPlanExpiresAt = metadata.previous_plan_expires_at;
    const scheduledDowngradeTo = metadata.downgrade_scheduled_to;

    const now = Math.floor(Date.now() / 1000);
    const expiryTimestamp = previousPlanExpiresAt ? parseInt(previousPlanExpiresAt, 10) : 0;

    let effectiveProductId: string;
    let isPreviousPlanActive = false;

    // Determine which product to use
    if (previousPlanProductId && expiryTimestamp > now) {
      // Previous plan is still active, use it
      effectiveProductId = previousPlanProductId;
      isPreviousPlanActive = true;

      console.log(
        `[Stripe] Using previous plan ${previousPlanProductId} until ${new Date(expiryTimestamp * 1000).toISOString()}`
      );
    } else {
      // Previous plan expired or doesn't exist, use current subscription plan
      const currentProductId =
        typeof subscription.items.data[0].price.product === 'string'
          ? subscription.items.data[0].price.product
          : subscription.items.data[0].price.product.id;

      effectiveProductId = currentProductId;

      if (previousPlanProductId) {
        console.log(`[Stripe] Previous plan ${previousPlanProductId} expired, now using ${currentProductId}`);
      }
    }

    // Map product ID to internal plan ID
    const effectivePlan = (PRODUCT_ID_TO_PLAN[effectiveProductId] || 'starter') as PlanId;

    // Extract period info (Stripe uses snake_case but TS types might differ)
    const periodEnd = (subscription as any).current_period_end as number;
    const periodStart = (subscription as any).current_period_start as number;

    // Build subscription data
    const data: CachedSubscriptionData = {
      subscriptionId: subscription.id,
      customerId: stripeCustomerId,
      status: subscription.status,
      plan: effectivePlan, // Use effective plan (previous or current)
      planExpireAt: isPreviousPlanActive ? new Date(expiryTimestamp * 1000).toISOString() : null,
      renewStatus: isPreviousPlanActive
        ? 'canceled'
        : subscription.items.data[0].price.recurring?.interval === 'year'
        ? 'yearly'
        : 'monthly',
      productId: effectiveProductId,
      priceId: subscription.items.data[0].price.id,
      cancelAtPeriodEnd: isPreviousPlanActive || subscription.cancel_at_period_end, // Show as "ending" if previous plan active
      currentPeriodEnd: periodEnd,
      currentPeriodStart: periodStart,
      cachedAt: new Date().toISOString(),
    };

    // Cache the data with smart TTL
    await setCachedSubscription(userId, data);

    return data;
  } catch (error) {
    console.error('[Stripe] Error fetching subscription:', error);

    // On error, return free plan data (don't cache it - let next request retry)
    return {
      subscriptionId: null,
      customerId: stripeCustomerId,
      status: 'none',
      plan: 'starter',
      planExpireAt: null,
      renewStatus: 'none',
      productId: null,
      priceId: null,
      cancelAtPeriodEnd: false,
      currentPeriodEnd: null,
      currentPeriodStart: null,
      cachedAt: new Date().toISOString(),
    };
  }
}
