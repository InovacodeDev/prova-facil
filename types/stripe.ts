/**
 * Stripe-related TypeScript Types
 *
 * This file contains all custom types for Stripe integration.
 * Note: Plan data (plan, plan_expire_at, renew_status) is no longer stored in database.
 * It is fetched from Stripe API with Redis caching.
 */

import type { CachedSubscriptionData } from '@/lib/cache/subscription-cache';
import type Stripe from 'stripe';

/**
 * Internal plan identifiers matching our database enum
 */
export type PlanId = 'starter' | 'basic' | 'essentials' | 'plus' | 'advanced';

/**
 * Billing interval for subscriptions
 */
export type BillingInterval = 'month' | 'year';

/**
 * Subscription status - now directly from Stripe
 * Kept for backwards compatibility
 */
export type RenewStatus = 'monthly' | 'yearly' | 'trial' | 'canceled' | 'none';

/**
 * Product with prices fetched from Stripe
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
  features: string[];
  aiLevel: string;
  questionsPerMonth: number;
  internalPlanId: PlanId;
  highlighted?: boolean;
}

/**
 * Checkout session creation parameters
 */
export interface CreateCheckoutParams {
  priceId: string;
  customerId?: string;
  successUrl: string;
  cancelUrl: string;
  trialDays?: number;
}

/**
 * Webhook event data
 */
export interface StripeWebhookEvent {
  type: string;
  data: {
    object: Stripe.Subscription | Stripe.Customer | any;
  };
}

/**
 * User profile with Stripe data (from database)
 * NOTE: Plan fields removed - fetch via getSubscriptionData() instead
 */
export interface ProfileWithStripe {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * User profile WITH plan data (fetched from Stripe)
 * Use this when you need plan information
 */
export interface ProfileWithPlan extends ProfileWithStripe {
  planData: CachedSubscriptionData;
}

/**
 * Subscription details for UI display
 */
export interface SubscriptionDetails {
  id: string;
  status: Stripe.Subscription.Status;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  planName: string;
  interval: BillingInterval;
  amount: number;
  currency: string;
}

/**
 * API Response Types
 */
export interface CreateCheckoutResponse {
  sessionId: string;
  url: string | null;
}

export interface CreatePortalResponse {
  url: string;
}

export interface ProductsResponse {
  products: StripeProductWithPrices[];
}

export interface ApiError {
  error: string;
  details?: any;
}

/**
 * Schedule Downgrade Request
 */
export interface ScheduleDowngradeRequest {
  priceId: string;
}

/**
 * Schedule Downgrade Response
 */
export interface ScheduleDowngradeResponse {
  success: boolean;
  effectiveAt: string;
  message: string;
}

/**
 * Cancel Subscription Response
 */
export interface CancelSubscriptionResponse {
  success: boolean;
  cancelAt: string;
  message: string;
}

/**
 * Subscription Period Response
 */
export interface SubscriptionPeriodResponse {
  currentPlan: string;
  currentPeriodEnd: string | null;
  hasActiveSubscription: boolean;
  renewStatus?: string;
  cancelAtPeriodEnd?: boolean;
}
