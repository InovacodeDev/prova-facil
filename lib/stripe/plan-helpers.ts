/**
 * Plan Helper Functions
 *
 * Provides utility functions to work with plan data fetched from Stripe.
 * All functions use the cache-first strategy via getSubscriptionData().
 *
 * Usage:
 * ```typescript
 * const planData = await getUserPlanData(userId, customerId, subscriptionId);
 * const canAccess = await userHasPlanFeature(userId, customerId, subscriptionId, 'pdf_upload');
 * ```
 *
 * @module lib/stripe/plan-helpers
 */

import { getSubscriptionData } from './server';
import type { CachedSubscriptionData } from '@/lib/cache/subscription-cache';

/**
 * Plan configuration from database plans table
 */
export interface PlanConfig {
  id: 'starter' | 'basic' | 'essentials' | 'plus' | 'advanced';
  model: string;
  questions_month: number;
  doc_type: string[];
  docs_size: number;
  max_question_types: number;
  support: ('email' | 'whatsapp' | 'vip')[];
}

/**
 * Complete user plan data combining Stripe subscription and plan configuration
 */
export interface UserPlanData extends CachedSubscriptionData {
  config: PlanConfig | null;
}

/**
 * Get complete plan data for a user (subscription + configuration)
 * Uses cache-first strategy via Redis
 *
 * @param userId - User ID (for cache key)
 * @param stripeCustomerId - Stripe Customer ID
 * @param stripeSubscriptionId - Stripe Subscription ID (null for free plan)
 * @returns Complete plan data with configuration
 */
export async function getUserPlanData(
  userId: string,
  stripeCustomerId: string | null,
  stripeSubscriptionId: string | null
): Promise<UserPlanData> {
  // Get subscription data (cached)
  const subscriptionData = await getSubscriptionData(userId, stripeCustomerId, stripeSubscriptionId);

  // Note: Plan configuration should be fetched from database plans table
  // For now, returning null for config - implement database query as needed
  return {
    ...subscriptionData,
    config: null, // TODO: Fetch from database plans table
  };
}

/**
 * Check if user's current plan allows a specific feature
 *
 * @param userId - User ID
 * @param stripeCustomerId - Stripe Customer ID
 * @param stripeSubscriptionId - Stripe Subscription ID
 * @param feature - Feature to check (e.g., 'pdf_upload', 'vip_support')
 * @returns Boolean indicating if feature is available
 */
export async function userHasPlanFeature(
  userId: string,
  stripeCustomerId: string | null,
  stripeSubscriptionId: string | null,
  feature: string
): Promise<boolean> {
  const planData = await getUserPlanData(userId, stripeCustomerId, stripeSubscriptionId);

  // Feature checking logic based on plan
  // This should be expanded based on your specific feature requirements
  const featureMap: Record<string, string[]> = {
    pdf_upload: ['essentials', 'plus', 'advanced'],
    vip_support: ['plus', 'advanced'],
    advanced_ai: ['advanced'],
    // Add more features as needed
  };

  const allowedPlans = featureMap[feature] || [];
  return allowedPlans.includes(planData.plan);
}

/**
 * Check if user has an active (paid) subscription
 *
 * @param userId - User ID
 * @param stripeCustomerId - Stripe Customer ID
 * @param stripeSubscriptionId - Stripe Subscription ID
 * @returns Boolean indicating if user has active subscription
 */
export async function userHasActiveSubscription(
  userId: string,
  stripeCustomerId: string | null,
  stripeSubscriptionId: string | null
): Promise<boolean> {
  const planData = await getUserPlanData(userId, stripeCustomerId, stripeSubscriptionId);

  return (planData.status === 'active' || planData.status === 'trialing') && planData.plan !== 'starter';
}

/**
 * Check if user's subscription is expiring soon (within 7 days)
 *
 * @param userId - User ID
 * @param stripeCustomerId - Stripe Customer ID
 * @param stripeSubscriptionId - Stripe Subscription ID
 * @returns Boolean indicating if subscription expires soon
 */
export async function isSubscriptionExpiringSoon(
  userId: string,
  stripeCustomerId: string | null,
  stripeSubscriptionId: string | null
): Promise<boolean> {
  const planData = await getUserPlanData(userId, stripeCustomerId, stripeSubscriptionId);

  if (!planData.currentPeriodEnd) {
    return false;
  }

  const now = Date.now() / 1000; // Unix timestamp in seconds
  const daysUntilExpiry = (planData.currentPeriodEnd - now) / (60 * 60 * 24);

  return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
}

/**
 * Get user-friendly plan status label
 *
 * @param userId - User ID
 * @param stripeCustomerId - Stripe Customer ID
 * @param stripeSubscriptionId - Stripe Subscription ID
 * @returns Localized status string
 */
export async function getPlanStatusLabel(
  userId: string,
  stripeCustomerId: string | null,
  stripeSubscriptionId: string | null
): Promise<string> {
  const planData = await getUserPlanData(userId, stripeCustomerId, stripeSubscriptionId);

  const statusLabels: Record<typeof planData.status, string> = {
    active: 'Ativo',
    trialing: 'Em período de teste',
    past_due: 'Pagamento pendente',
    canceled: 'Cancelado',
    unpaid: 'Não pago',
    incomplete: 'Incompleto',
    incomplete_expired: 'Expirado',
    paused: 'Pausado',
    none: 'Plano gratuito',
  };

  return statusLabels[planData.status] || 'Desconhecido';
}

/**
 * Get plan display name (localized)
 */
export function getPlanDisplayName(plan: string): string {
  const displayNames: Record<string, string> = {
    starter: 'Starter',
    basic: 'Básico',
    essentials: 'Essencial',
    plus: 'Plus',
    advanced: 'Avançado',
  };

  return displayNames[plan] || plan;
}

/**
 * Format plan expiration date for display
 *
 * @param planExpireAt - ISO date string
 * @returns Formatted date string (Brazilian format)
 */
export function formatPlanExpiry(planExpireAt: string | null): string {
  if (!planExpireAt) {
    return 'Sem expiração';
  }

  const date = new Date(planExpireAt);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
