/**
 * Stripe Plan Helper Functions
 *
 * Utilities for comparing plans, determining upgrades/downgrades,
 * and formatting subscription data.
 */

import type Stripe from 'stripe';
import { PRODUCT_ID_TO_PLAN } from './config';

/**
 * Plan hierarchy for comparison
 * Higher number = higher tier plan
 */
const PLAN_HIERARCHY = {
  starter: 0,
  basic: 1,
  essentials: 2,
  plus: 3,
  advanced: 4,
} as const;

type PlanId = keyof typeof PLAN_HIERARCHY;

/**
 * Plan information extracted from Stripe Subscription
 */
export interface ExtractedPlanData {
  plan: 'starter' | 'basic' | 'essentials' | 'plus' | 'advanced';
  planExpireAt: Date | null;
  productId: string | null;
  priceId: string | null;
  renewStatus: 'monthly' | 'yearly' | 'trial' | 'canceled' | 'none';
}

/**
 * Extracts plan information from a Stripe Subscription
 *
 * This is the canonical function to convert Stripe subscription data
 * into our internal plan representation.
 *
 * @param subscription - Stripe Subscription object
 * @returns Extracted plan data
 */
export function extractPlanFromSubscription(subscription: Stripe.Subscription | null): ExtractedPlanData {
  // Handle null subscription (free plan)
  if (!subscription) {
    return {
      plan: 'starter',
      planExpireAt: null,
      productId: null,
      priceId: null,
      renewStatus: 'none',
    };
  }

  // Extract subscription item (first item in the subscription)
  const subscriptionItem = subscription.items.data[0];
  if (!subscriptionItem) {
    return {
      plan: 'starter',
      planExpireAt: null,
      productId: null,
      priceId: null,
      renewStatus: 'none',
    };
  }

  // Extract product ID
  const productId =
    typeof subscriptionItem.price.product === 'string'
      ? subscriptionItem.price.product
      : subscriptionItem.price.product.id;

  // Map product ID to internal plan name
  const planName = (PRODUCT_ID_TO_PLAN[productId] || 'starter') as
    | 'starter'
    | 'basic'
    | 'essentials'
    | 'plus'
    | 'advanced';

  // Extract period end (convert Unix timestamp to Date)
  const periodEnd = (subscription as any).current_period_end as number;
  const planExpireAt = periodEnd ? new Date(periodEnd * 1000) : null;

  // Determine renew status
  let renewStatus: 'monthly' | 'yearly' | 'trial' | 'canceled' | 'none' = 'none';
  if (subscription.cancel_at_period_end) {
    renewStatus = 'canceled';
  } else if (subscription.status === 'trialing') {
    renewStatus = 'trial';
  } else if (subscriptionItem.price.recurring?.interval === 'month') {
    renewStatus = 'monthly';
  } else if (subscriptionItem.price.recurring?.interval === 'year') {
    renewStatus = 'yearly';
  }

  return {
    plan: planName,
    planExpireAt,
    productId,
    priceId: subscriptionItem.price.id,
    renewStatus,
  };
}

/**
 * Determines if changing from current plan to target plan is a downgrade
 *
 * @param currentPlan - Current plan ID
 * @param targetPlan - Target plan ID
 * @returns True if target plan is lower tier than current plan
 */
export function isDowngrade(currentPlan: string, targetPlan: string): boolean {
  const currentTier = PLAN_HIERARCHY[currentPlan as PlanId] ?? 0;
  const targetTier = PLAN_HIERARCHY[targetPlan as PlanId] ?? 0;
  return targetTier < currentTier;
}

/**
 * Determines if changing from current plan to target plan is an upgrade
 *
 * @param currentPlan - Current plan ID
 * @param targetPlan - Target plan ID
 * @returns True if target plan is higher tier than current plan
 */
export function isUpgrade(currentPlan: string, targetPlan: string): boolean {
  const currentTier = PLAN_HIERARCHY[currentPlan as PlanId] ?? 0;
  const targetTier = PLAN_HIERARCHY[targetPlan as PlanId] ?? 0;
  return targetTier > currentTier;
}

/**
 * Formats an ISO date string to Brazilian format (DD/MM/YYYY)
 *
 * @param dateString - ISO date string or timestamp
 * @returns Formatted date string
 */
export function formatPeriodEnd(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
}

/**
 * Formats a price from Stripe (in cents) to Brazilian currency
 *
 * @param cents - Price in cents
 * @returns Formatted price string (e.g., "R$ 49,90")
 */
export function formatPrice(cents: number): string {
  const reais = cents / 100;
  return reais.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/**
 * Gets the display name for a billing interval
 *
 * @param interval - Billing interval ('month' or 'year')
 * @returns Display name in Portuguese
 */
export function getBillingIntervalDisplay(interval: 'month' | 'year'): string {
  return interval === 'month' ? 'mensal' : 'anual';
}

/**
 * Determines if a plan is free (Starter)
 *
 * @param planId - Plan identifier
 * @returns True if plan is the free Starter plan
 */
export function isFreePlan(planId: string): boolean {
  return planId === 'starter';
}
