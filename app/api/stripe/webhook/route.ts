/**
 * Stripe Webhook Handler
 *
 * This API route handles Stripe webhook events to keep our database in sync
 * with subscription status changes.
 *
 * Architecture:
 * - Updates only stripe_customer_id and stripe_subscription_id in database
 * - Invalidates Redis cache on subscription changes
 * - All plan data is fetched from Stripe API and cached in Redis
 *
 * Events handled:
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - customer.subscription.trial_will_end
 */

import { invalidateSubscriptionCacheByCustomerId } from '@/lib/cache/subscription-cache';
import { stripeConfig } from '@/lib/stripe/config';
import { stripe } from '@/lib/stripe/server';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

/**
 * Verifies the Stripe webhook signature
 */
function verifyWebhookSignature(payload: string, signature: string): Stripe.Event | null {
  try {
    return stripe.webhooks.constructEvent(payload, signature, stripeConfig.webhookSecret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return null;
  }
}

/**
 * Gets the plan_id from Stripe subscription's product ID
 *
 * Queries the plans table to find the matching plan_id for the given
 * Stripe product ID. Returns 'starter' as fallback if not found.
 */
async function getPlanIdFromStripeProduct(subscription: Stripe.Subscription): Promise<string> {
  const supabase = await createClient();

  // Extract product ID from subscription
  const item = subscription.items.data[0];
  if (!item?.price?.product) {
    console.warn('[Webhook] No product found in subscription, using starter plan');
    return 'starter';
  }

  const productId = typeof item.price.product === 'string' ? item.price.product : item.price.product.id;

  console.log(`[Webhook] Looking up plan for Stripe product: ${productId}`);

  // Query plans table to find matching plan_id
  const { data, error } = await supabase.from('plans').select('id').eq('stripe_product_id', productId).single();

  if (error || !data) {
    console.warn(`[Webhook] Plan not found for product ${productId}, using starter plan. Error:`, error);
    return 'starter';
  }

  console.log(`[Webhook] Found plan: ${data.id} for product: ${productId}`);
  return data.id;
}

/**
 * Updates user profile with Stripe IDs and invalidates cache
 *
 * This function updates ONLY the Stripe reference IDs in the database.
 * All subscription/plan data is fetched from Stripe API and cached in Redis.
 *
 * Database stores:
 * - stripe_customer_id: For linking with Stripe
 * - stripe_subscription_id: Active subscription reference
 *
 * Redis cache stores:
 * - Full subscription data: plan, status, renewStatus, prices, dates, etc.
 *
 * IMPORTANT: This function ensures only ONE active subscription per customer.
 * If a new subscription is created, old subscriptions are canceled.
 */
async function updateProfileSubscription(customerId: string, subscription: Stripe.Subscription) {
  const supabase = await createClient();

  console.log(`[Webhook] Updating profile for customer: ${customerId}, subscription: ${subscription.id}`);

  // Get the plan_id from the subscription's product
  const planId = await getPlanIdFromStripeProduct(subscription);

  // Get current profile to check for existing subscription
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_subscription_id')
    .eq('stripe_customer_id', customerId)
    .single();

  // If there's a different active subscription, cancel it to prevent multiple subscriptions
  if (
    profile?.stripe_subscription_id &&
    profile.stripe_subscription_id !== subscription.id &&
    subscription.status === 'active'
  ) {
    try {
      console.log(`[Webhook] Found old subscription ${profile.stripe_subscription_id}, canceling it...`);

      // Cancel the old subscription immediately (not at period end)
      await stripe.subscriptions.cancel(profile.stripe_subscription_id);

      console.log(`[Webhook] Old subscription ${profile.stripe_subscription_id} canceled`);
    } catch (error) {
      console.error(`[Webhook] Error canceling old subscription:`, error);
      // Continue anyway - the new subscription will be set
    }
  }

  // Update database with Stripe IDs AND plan_id (for fast access)
  const { error } = await supabase
    .from('profiles')
    .update({
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      plan_id: planId, // NEW: Set plan_id for direct access
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId);

  if (error) {
    console.error('[Webhook] Error updating profile:', error);
    throw new Error('Failed to update profile');
  }

  console.log(`[Webhook] Profile updated with subscription ID: ${subscription.id} and plan: ${planId}`);

  // Invalidate Redis cache so next request fetches fresh data from Stripe
  await invalidateSubscriptionCacheByCustomerId(customerId);
  console.log(`[Webhook] Cache invalidated for customer: ${customerId}`);
}

/**
 * Handles subscription deletion/cancellation
 *
 * Sets subscription ID to null and plan_id to 'starter' (user reverts to free plan).
 */
async function handleSubscriptionDeleted(customerId: string) {
  const supabase = await createClient();

  console.log(`[Webhook] Handling subscription deletion for customer: ${customerId}`);

  // Set subscription ID to null and reset to starter plan
  const { error } = await supabase
    .from('profiles')
    .update({
      stripe_subscription_id: null,
      plan_id: 'starter', // Reset to starter plan
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId);

  if (error) {
    console.error('[Webhook] Error handling subscription deletion:', error);
    throw new Error('Failed to handle subscription deletion');
  }

  console.log(`[Webhook] Subscription removed and plan reset to starter for customer: ${customerId}`);

  // Invalidate cache so next request reflects free plan
  await invalidateSubscriptionCacheByCustomerId(customerId);
  console.log(`[Webhook] Cache invalidated for deleted subscription: ${customerId}`);
}

/**
 * Main webhook handler
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body and signature
    const payload = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('Missing stripe-signature header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify webhook signature
    const event = verifyWebhookSignature(payload, signature);

    if (!event) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log(`Webhook received: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await updateProfileSubscription(subscription.customer as string, subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription.customer as string);
        break;
      }

      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`Trial ending soon for customer: ${subscription.customer}`);
        // TODO: Send email notification to user
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

// Disable body parsing for webhook verification
export const config = {
  api: {
    bodyParser: false,
  },
};
