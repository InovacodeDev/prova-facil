/**
 * Sync Subscription API Route
 *
 * This endpoint syncs the subscription_id to the user's profile after successful checkout.
 * This ensures the platform is immediately aware of the new subscription without waiting
 * for the webhook to process.
 *
 * Flow:
 * 1. User completes checkout
 * 2. Stripe redirects to success URL with session_id
 * 3. Frontend calls this endpoint with session_id
 * 4. We retrieve the session and extract subscription_id
 * 5. Update profile with the subscription_id
 * 6. Webhook will also update later for redundancy
 */

import { invalidateSubscriptionCacheByCustomerId } from '@/lib/cache/subscription-cache';
import { stripe } from '@/lib/stripe/server';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ error: 'Invalid sessionId' }, { status: 400 });
    }

    console.log(`[API] Syncing subscription for session: ${sessionId}`);

    // Retrieve checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check if session has a subscription
    const subscriptionId = session.subscription as string | null;

    if (!subscriptionId) {
      console.warn(`[API] Session ${sessionId} has no subscription yet`);
      return NextResponse.json(
        {
          success: false,
          message: 'Subscription not created yet. Will be synced by webhook.',
        },
        { status: 200 }
      );
    }

    console.log(`[API] Found subscription ${subscriptionId} for session ${sessionId}`);

    // Get subscription details to extract product/plan info
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const productId = subscription.items.data[0]?.price?.product as string;

    if (!productId) {
      console.error('[API] No product found in subscription');
      return NextResponse.json({ error: 'Invalid subscription data' }, { status: 500 });
    }

    // Get plan_id from product
    const { data: planData } = await supabase.from('plans').select('id').eq('stripe_product_id', productId).single();

    const planId = planData?.id || 'starter';

    console.log(`[API] Mapped product ${productId} to plan: ${planId}`);

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Update profile with subscription_id and plan_id
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        stripe_subscription_id: subscriptionId,
        plan_id: planId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);

    if (updateError) {
      console.error('[API] Error updating profile:', updateError);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    console.log(`[API] Profile updated with subscription ${subscriptionId} and plan ${planId}`);

    // Invalidate cache to force fresh data
    if (profile.stripe_customer_id) {
      await invalidateSubscriptionCacheByCustomerId(profile.stripe_customer_id);
      console.log(`[API] Cache invalidated for customer: ${profile.stripe_customer_id}`);
    }

    return NextResponse.json(
      {
        success: true,
        subscriptionId,
        planId,
        message: 'Subscription synced successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] Error syncing subscription:', error);

    // Log detailed error information
    if (error instanceof Error) {
      console.error('[API] Error name:', error.name);
      console.error('[API] Error message:', error.message);
      console.error('[API] Error stack:', error.stack);
    }

    return NextResponse.json(
      {
        error: 'Failed to sync subscription',
        message: 'Ocorreu um erro ao sincronizar a assinatura. O webhook atualizará em breve.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
