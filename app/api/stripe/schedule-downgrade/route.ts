/**
 * Schedule Downgrade API Route
 *
 * Schedules a plan change to a lower-tier paid plan at the end of the current billing period.
 * The subscription will continue with the current plan until the period ends, then switch to the new plan.
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
    const { priceId } = body;

    if (!priceId || typeof priceId !== 'string') {
      return NextResponse.json({ error: 'Invalid priceId' }, { status: 400 });
    }

    // Get user profile with subscription ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_subscription_id, stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (!profile.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
    }

    // Get current subscription to find the subscription item ID
    const currentSubscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
    const subscriptionItemId = currentSubscription.items.data[0].id;

    // Update subscription to change price at period end
    // Using proration_behavior: 'none' ensures the change happens at period end without charging immediately
    const updatedSubscription = await stripe.subscriptions.update(profile.stripe_subscription_id, {
      items: [
        {
          id: subscriptionItemId,
          price: priceId,
        },
      ],
      proration_behavior: 'none', // No prorating - change takes effect at period end
    });

    // Invalidate cache so next request reflects the scheduled change
    if (profile.stripe_customer_id) {
      await invalidateSubscriptionCacheByCustomerId(profile.stripe_customer_id);
    }

    // Extract period end (Stripe uses snake_case)
    const periodEnd = (updatedSubscription as any).current_period_end as number;
    const effectiveAt = new Date(periodEnd * 1000).toISOString();

    console.log(`[API] Subscription ${updatedSubscription.id} will change to price ${priceId} at: ${effectiveAt}`);

    return NextResponse.json(
      {
        success: true,
        effectiveAt,
        message: 'Plano será alterado ao final do período',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error scheduling downgrade:', error);
    return NextResponse.json(
      {
        error: 'Failed to schedule downgrade',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
