/**
 * Stripe Webhook Handler
 *
 * This API route handles Stripe webhook events to keep our database in sync
 * with subscription status changes.
 *
 * Architecture:
 * - Only updates stripe_customer_id and stripe_subscription_id in database
 * - Invalidates Redis cache on subscription changes
 * - Plan information is fetched on-demand from Stripe API with caching
 *
 * Events handled:
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - customer.subscription.trial_will_end
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe/server';
import { stripeConfig } from '@/lib/stripe/config';
import { createClient } from '@/lib/supabase/server';
import { invalidateSubscriptionCacheByCustomerId } from '@/lib/cache/subscription-cache';

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
 * Updates user profile with Stripe IDs and invalidates cache
 *
 * This function NO LONGER stores plan data in the database.
 * Plan information is fetched from Stripe API with Redis caching.
 */
async function updateProfileSubscription(customerId: string, subscription: Stripe.Subscription) {
  const supabase = await createClient();

  console.log(`[Webhook] Updating profile for customer: ${customerId}, subscription: ${subscription.id}`);

  // Update only Stripe IDs in database
  const { error } = await supabase
    .from('profiles')
    .update({
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId);

  if (error) {
    console.error('[Webhook] Error updating profile:', error);
    throw new Error('Failed to update profile');
  }

  // Invalidate Redis cache so next request fetches fresh data from Stripe
  await invalidateSubscriptionCacheByCustomerId(customerId);
  console.log(`[Webhook] Cache invalidated for customer: ${customerId}`);
}

/**
 * Handles subscription deletion/cancellation
 */
async function handleSubscriptionDeleted(customerId: string) {
  const supabase = await createClient();

  console.log(`[Webhook] Handling subscription deletion for customer: ${customerId}`);

  // Set subscription ID to null (user reverts to free plan)
  const { error } = await supabase
    .from('profiles')
    .update({
      stripe_subscription_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId);

  if (error) {
    console.error('[Webhook] Error handling subscription deletion:', error);
    throw new Error('Failed to handle subscription deletion');
  }

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
