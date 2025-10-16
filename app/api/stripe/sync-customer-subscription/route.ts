/**
 * Stripe Customer Subscription Sync API Endpoint
 *
 * Purpose: Automatically sync the most recent active subscription for a customer
 *
 * This endpoint:
 * 1. Receives a stripe_customer_id
 * 2. Fetches all subscriptions from Stripe for that customer
 * 3. Finds the most recent active subscription
 * 4. Updates the profile with the correct stripe_subscription_id
 * 5. Updates the plan_id based on the subscription's product
 *
 * Triggered by:
 * - Database triggers when profile changes
 * - Manual sync operations
 * - Webhook processing fallbacks
 *
 * @author Prova Fácil Team
 * @date 2025-10-14
 */

import { invalidateSubscriptionCacheByCustomerId } from '@/lib/cache/subscription-cache';
import { stripe } from '@/lib/stripe/server';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/stripe/sync-customer-subscription
 *
 * Body: { customerId: string, profileId?: string }
 *
 * Returns: { success: boolean, subscriptionId: string | null, planId: string }
 */
export async function POST(request: NextRequest) {
  console.log('[Sync Customer Subscription] Request received');

  try {
    // Parse request body
    const body = await request.json();
    const { customerId, profileId } = body;

    if (!customerId || typeof customerId !== 'string') {
      console.error('[Sync Customer Subscription] Missing or invalid customerId:', customerId);
      return NextResponse.json(
        {
          success: false,
          error: 'customerId is required and must be a string',
        },
        { status: 400 }
      );
    }

    console.log('[Sync Customer Subscription] Syncing for customer:', customerId);

    // Fetch all subscriptions for this customer
    console.log('[Sync Customer Subscription] Fetching subscriptions from Stripe...');
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all', // Get all statuses to find the most recent active one
      limit: 100, // Get up to 100 subscriptions
      expand: ['data.items.data.price.product'],
    });

    console.log('[Sync Customer Subscription] Found', subscriptions.data.length, 'subscriptions');

    // Find the most recent ACTIVE subscription
    // Priority: active > trialing > past_due
    const activeStatuses = ['active', 'trialing', 'past_due'];
    const activeSubscriptions = subscriptions.data.filter((sub) => activeStatuses.includes(sub.status));

    console.log('[Sync Customer Subscription] Found', activeSubscriptions.length, 'active subscriptions');

    // Get the most recent one (Stripe returns them sorted by created date, newest first)
    const mostRecentSubscription = activeSubscriptions[0] || null;

    let subscriptionId: string | null = null;
    let planId: string = 'starter'; // Default to starter

    if (mostRecentSubscription) {
      subscriptionId = mostRecentSubscription.id;
      console.log('[Sync Customer Subscription] Most recent active subscription:', subscriptionId);

      // Get the product ID from the subscription
      const priceItem = mostRecentSubscription.items.data[0];
      if (!priceItem) {
        console.warn('[Sync Customer Subscription] No price items found in subscription');
      } else {
        const price = priceItem.price;
        const productId = typeof price.product === 'string' ? price.product : price.product?.id;

        console.log('[Sync Customer Subscription] Product ID:', productId);

        if (productId) {
          // Map product_id to plan_id using the database
          const supabase = await createClient();

          const { data: plan, error: planError } = await supabase
            .from('plans')
            .select('id')
            .eq('stripe_product_id', productId)
            .maybeSingle();

          if (planError) {
            console.error('[Sync Customer Subscription] Error fetching plan:', planError);
          } else if (plan) {
            planId = plan.id;
            console.log('[Sync Customer Subscription] Mapped to plan_id:', planId);
          } else {
            console.warn('[Sync Customer Subscription] No plan found for product:', productId);
          }
        }
      }
    } else {
      console.log('[Sync Customer Subscription] No active subscription found, defaulting to starter');
    }

    // Update the profile in the database
    const supabase = await createClient();

    // If profileId is provided, use it directly. Otherwise, find by customer_id
    let updateQuery;
    if (profileId) {
      console.log('[Sync Customer Subscription] Updating profile by ID:', profileId);
      updateQuery = supabase
        .from('profiles')
        .update({
          stripe_subscription_id: subscriptionId,
          plan_id: planId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profileId);
    } else {
      console.log('[Sync Customer Subscription] Updating profile by customer_id:', customerId);
      updateQuery = supabase
        .from('profiles')
        .update({
          stripe_subscription_id: subscriptionId,
          plan_id: planId,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_customer_id', customerId);
    }

    const { data: updatedProfile, error: updateError } = await updateQuery.select();

    if (updateError) {
      console.error('[Sync Customer Subscription] Error updating profile:', updateError);
      throw new Error(`Failed to update profile: ${updateError.message}`);
    }

    if (!updatedProfile || updatedProfile.length === 0) {
      console.warn('[Sync Customer Subscription] No profile found to update');
      return NextResponse.json(
        {
          success: false,
          error: 'No profile found with the given customer_id or profile_id',
        },
        { status: 404 }
      );
    }

    console.log('[Sync Customer Subscription] Profile updated successfully');
    console.log('[Sync Customer Subscription] New subscription_id:', subscriptionId);
    console.log('[Sync Customer Subscription] New plan_id:', planId);

    // Invalidate cache (using the subscription cache invalidation system)
    try {
      await invalidateSubscriptionCacheByCustomerId(customerId);
      console.log('[Sync Customer Subscription] Cache invalidated for customer:', customerId);
    } catch (cacheError) {
      console.error('[Sync Customer Subscription] Error invalidating cache:', cacheError);
      // Continue anyway - cache will eventually expire
    }

    return NextResponse.json({
      success: true,
      subscriptionId,
      planId,
      message: subscriptionId
        ? `Subscription synced successfully: ${subscriptionId}`
        : 'No active subscription found, set to starter plan',
    });
  } catch (error) {
    console.error('[Sync Customer Subscription] Unexpected error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error('[Sync Customer Subscription] Error details:', {
      message: errorMessage,
      stack: errorStack,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to sync customer subscription',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
