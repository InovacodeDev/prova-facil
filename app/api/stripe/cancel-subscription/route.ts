/**
 * Cancel Subscription API Route
 *
 * Cancels the user's subscription at the end of the current billing period.
 * Used when downgrading to the free Starter plan.
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

    // Get user profile with subscription ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_subscription_id, stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (!profile.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
    }

    // Cancel subscription at period end
    const subscription = await stripe.subscriptions.update(profile.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    // Invalidate cache so next request reflects the cancellation
    if (profile.stripe_customer_id) {
      await invalidateSubscriptionCacheByCustomerId(profile.stripe_customer_id);
    }

    // Extract period end (Stripe uses snake_case)
    const periodEnd = (subscription as any).current_period_end as number;
    const cancelAt = new Date(periodEnd * 1000).toISOString();

    console.log(`[API] Subscription ${subscription.id} will be canceled at period end: ${cancelAt}`);

    return NextResponse.json(
      {
        success: true,
        cancelAt,
        message: 'Assinatura será cancelada ao final do período',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
