/**
 * Plan Helper Functions
 * Utilities to get plan configuration based on Stripe subscription
 */

import { stripe } from '@/lib/stripe/server';
import { createClient } from '@/lib/supabase/server';

export interface PlanConfiguration {
  id: string;
  stripe_product_id: string;
  model: string;
  questions_month: number;
  doc_type: string[];
  docs_size: number;
  max_question_types: number;
  support: string[];
  allowed_questions?: string[]; // Array of allowed question types for this plan
}

/**
 * Get plan configuration for a user based on their active Stripe subscription
 *
 * @param userId - User's UUID
 * @returns Plan configuration or null if not found
 */
export async function getPlanByUserId(userId: string): Promise<PlanConfiguration | null> {
  try {
    const supabase = await createClient();

    // Get user's profile with subscription ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_subscription_id, stripe_customer_id')
      .eq('id', userId)
      .maybeSingle();

    if (profileError || !profile || !profile.stripe_subscription_id) {
      console.error('[getPlanByUserId] Profile not found or no subscription', { userId, error: profileError });
      return null;
    }

    // Get subscription from Stripe to find product_id
    const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);

    if (!subscription || subscription.status !== 'active') {
      console.error('[getPlanByUserId] Subscription not active', { userId, status: subscription?.status });
      return null;
    }

    // Get product ID from first subscription item
    const productId = subscription.items.data[0]?.price?.product;

    if (!productId || typeof productId !== 'string') {
      console.error('[getPlanByUserId] Product ID not found in subscription', {
        userId,
        subscriptionId: subscription.id,
      });
      return null;
    }

    // Get plan configuration from database
    const { data: planData, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('stripe_product_id', productId)
      .maybeSingle();

    if (planError || !planData) {
      console.error('[getPlanByUserId] Plan not found for product', { productId, error: planError });
      return null;
    }

    return planData as PlanConfiguration;
  } catch (error) {
    console.error('[getPlanByUserId] Error fetching plan:', error);
    return null;
  }
}

/**
 * Get plan ID for a user (lighter version, only returns plan ID)
 *
 * @param userId - User's UUID
 * @returns Plan ID (e.g., 'starter', 'pro') or null
 */
export async function getPlanIdByUserId(userId: string): Promise<string | null> {
  const plan = await getPlanByUserId(userId);
  return plan?.id || null;
}

/**
 * Get plan configuration by Stripe product ID
 *
 * @param stripeProductId - Stripe product ID (e.g., 'prod_XXX')
 * @returns Plan configuration or null if not found
 */
export async function getPlanByStripeProductId(stripeProductId: string): Promise<PlanConfiguration | null> {
  try {
    const supabase = await createClient();

    const { data: planData, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('stripe_product_id', stripeProductId)
      .maybeSingle();

    if (planError || !planData) {
      console.error('[getPlanByStripeProductId] Plan not found', { stripeProductId, error: planError });
      return null;
    }

    return planData as PlanConfiguration;
  } catch (error) {
    console.error('[getPlanByStripeProductId] Error fetching plan:', error);
    return null;
  }
}
