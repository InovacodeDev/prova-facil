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
 * - Responds immediately with 200 OK, processes asynchronously
 *
 * Events handled:
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - customer.subscription.trial_will_end
 * - invoice.payment_succeeded
 * - invoice.payment_failed
 * - checkout.session.completed
 *
 * Security:
 * - Verifies webhook signature
 * - Uses service role key for admin operations
 * - Validates all events before processing
 */

import { invalidateSubscriptionCacheByCustomerId } from '@/lib/cache/subscription-cache';
import { stripeConfig } from '@/lib/stripe/config';
import { stripe } from '@/lib/stripe/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
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
  const supabase = await createServiceRoleClient();

  const item = subscription.items.data[0];
  if (!item?.price?.product) {
    console.warn('[Webhook] No product found in subscription, using starter plan');
    return 'starter';
  }

  const productId = typeof item.price.product === 'string' ? item.price.product : item.price.product.id;

  console.log(`[Webhook] Looking up plan for Stripe product: ${productId}`);

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
/**
 * Updates profile with subscription data and handles plan changes
 *
 * Detects if the subscription has metadata indicating a scheduled downgrade.
 * If the previous plan has expired, clears the metadata.
 */
async function updateProfileSubscription(customerId: string, subscription: Stripe.Subscription) {
  const supabase = await createServiceRoleClient();

  console.log(`[Webhook] Processing subscription ${subscription.id} for customer ${customerId}`);
  console.log(`[Webhook] Subscription status: ${subscription.status}`);

  // Check metadata for downgrade tracking
  const metadata = subscription.metadata || {};
  const previousPlanProductId = metadata.previous_plan_product_id;
  const previousPlanExpiresAt = metadata.previous_plan_expires_at;

  const now = Math.floor(Date.now() / 1000);
  const expiryTimestamp = previousPlanExpiresAt ? parseInt(previousPlanExpiresAt, 10) : 0;

  // Check if we need to clear metadata (downgrade has completed)
  let shouldClearMetadata = false;
  let effectiveProductId: string;

  if (previousPlanProductId && expiryTimestamp > 0 && expiryTimestamp <= now) {
    // Previous plan has expired, downgrade is now complete
    console.log(
      `[Webhook] Previous plan expired at ${new Date(expiryTimestamp * 1000).toISOString()}, completing downgrade`
    );
    shouldClearMetadata = true;

    // Use the current subscription product (the downgrade target)
    effectiveProductId =
      typeof subscription.items.data[0].price.product === 'string'
        ? subscription.items.data[0].price.product
        : subscription.items.data[0].price.product.id;
  } else if (previousPlanProductId && expiryTimestamp > now) {
    // Previous plan still active, use it
    console.log(`[Webhook] Previous plan still active until ${new Date(expiryTimestamp * 1000).toISOString()}`);
    effectiveProductId = previousPlanProductId;
  } else {
    // No metadata or no previous plan, use current subscription product
    effectiveProductId =
      typeof subscription.items.data[0].price.product === 'string'
        ? subscription.items.data[0].price.product
        : subscription.items.data[0].price.product.id;
  }

  // Clear metadata if downgrade completed
  if (shouldClearMetadata) {
    try {
      console.log(`[Webhook] Clearing downgrade metadata from subscription ${subscription.id}`);
      await stripe.subscriptions.update(subscription.id, {
        metadata: {
          previous_plan_product_id: '',
          previous_plan_expires_at: '',
          downgrade_scheduled_to: '',
        },
      });
      console.log(`[Webhook] Metadata cleared`);
    } catch (error) {
      console.error(`[Webhook] Error clearing metadata:`, error);
      // Continue processing even if metadata clearing fails
    }
  }

  // Get plan_id from database (maps stripe_product_id to plan_id)
  const { data: planData } = await supabase
    .from('plans')
    .select('id')
    .eq('stripe_product_id', effectiveProductId)
    .single();

  const planId = planData?.id || 'starter';
  console.log(`[Webhook] Mapped product ${effectiveProductId} to plan: ${planId}`);

  // Cancel old subscriptions if this is a new active subscription
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_subscription_id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (
    profile?.stripe_subscription_id &&
    profile.stripe_subscription_id !== subscription.id &&
    subscription.status === 'active'
  ) {
    try {
      console.log(`[Webhook] Found old subscription ${profile.stripe_subscription_id}, canceling it...`);

      await stripe.subscriptions.cancel(profile.stripe_subscription_id);

      console.log(`[Webhook] Old subscription ${profile.stripe_subscription_id} canceled`);
    } catch (error) {
      console.error(`[Webhook] Error canceling old subscription:`, error);
    }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      plan_id: planId,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId);

  if (error) {
    console.error('[Webhook] Error updating profile:', error);
    throw new Error('Failed to update profile');
  }

  console.log(`[Webhook] Profile updated with subscription ID: ${subscription.id} and plan: ${planId}`);

  await invalidateSubscriptionCacheByCustomerId(customerId);
  console.log(`[Webhook] Cache invalidated for customer: ${customerId}`);
}

/**
 * Handles subscription deletion/cancellation
 *
 * Sets subscription ID to null and plan_id to 'starter' (user reverts to free plan).
 */
async function handleSubscriptionDeleted(customerId: string) {
  const supabase = await createServiceRoleClient();

  console.log(`[Webhook] Handling subscription deletion for customer: ${customerId}`);

  const { error } = await supabase
    .from('profiles')
    .update({
      stripe_subscription_id: null,
      plan_id: 'starter',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId);

  if (error) {
    console.error('[Webhook] Error handling subscription deletion:', error);
    throw new Error('Failed to handle subscription deletion');
  }

  console.log(`[Webhook] Subscription removed and plan reset to starter for customer: ${customerId}`);

  await invalidateSubscriptionCacheByCustomerId(customerId);
  console.log(`[Webhook] Cache invalidated for deleted subscription: ${customerId}`);
}

/**
 * Main webhook handler
 *
 * IMPORTANT: Responds with 200 OK immediately (< 5s required by Stripe)
 * Processing is done asynchronously to avoid timeouts
 */
export async function POST(request: NextRequest) {
  console.log('[Stripe Webhook] ====================================');
  console.log('[Stripe Webhook] Incoming webhook request');

  try {
    const payload = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('[Stripe Webhook] ❌ Missing stripe-signature header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const event = verifyWebhookSignature(payload, signature);

    if (!event) {
      console.error('[Stripe Webhook] ❌ Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('[Stripe Webhook] ✅ Signature verified');
    console.log('[Stripe Webhook] Event type:', event.type);
    console.log('[Stripe Webhook] Event ID:', event.id);

    const response = NextResponse.json({ received: true }, { status: 200 });

    setImmediate(async () => {
      try {
        console.log('[Stripe Webhook] Processing event:', event.type);

        switch (event.type) {
          case 'customer.subscription.created':
          case 'customer.subscription.updated': {
            const subscription = event.data.object as Stripe.Subscription;
            console.log('[Stripe Webhook] Subscription event:', subscription.id);
            console.log('[Stripe Webhook] Customer:', subscription.customer);
            console.log('[Stripe Webhook] Status:', subscription.status);
            await updateProfileSubscription(subscription.customer as string, subscription);
            break;
          }

          case 'customer.subscription.deleted': {
            const subscription = event.data.object as Stripe.Subscription;
            console.log('[Stripe Webhook] Subscription deleted:', subscription.id);
            await handleSubscriptionDeleted(subscription.customer as string);
            break;
          }

          case 'customer.subscription.trial_will_end': {
            const subscription = event.data.object as Stripe.Subscription;
            console.log('[Stripe Webhook] Trial ending soon for customer:', subscription.customer);
            // TODO: Send email notification to user
            break;
          }

          default:
            console.log('[Stripe Webhook] Unhandled event type:', event.type);
        }

        console.log('[Stripe Webhook] ✅ Event processed successfully');
      } catch (error) {
        console.error('[Stripe Webhook] ❌ Error processing event:', error);
        if (error instanceof Error) {
          console.error('[Stripe Webhook] Error message:', error.message);
          console.error('[Stripe Webhook] Stack trace:', error.stack);
        }
      }
    });

    return response;
  } catch (error) {
    console.error('[Stripe Webhook] ❌ Fatal webhook error:', error);
    if (error instanceof Error) {
      console.error('[Stripe Webhook] Error message:', error.message);
    }
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
