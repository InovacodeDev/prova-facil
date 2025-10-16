/**
 * Subscription Period API Route
 *
 * Returns the current subscription's period end date and plan details.
 * Used for displaying downgrade modal information.
 */

import { getSubscriptionData } from '@/lib/stripe/server';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, stripe_customer_id, stripe_subscription_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // If no subscription, return starter plan with null period
    if (!profile.stripe_subscription_id) {
      return NextResponse.json(
        {
          currentPlan: 'starter',
          currentPeriodEnd: null,
          hasActiveSubscription: false,
        },
        { status: 200 }
      );
    }

    // Get subscription data (from cache or Stripe)
    const subscriptionData = await getSubscriptionData(
      profile.id,
      profile.stripe_customer_id,
      profile.stripe_subscription_id
    );

    return NextResponse.json(
      {
        currentPlan: subscriptionData.plan,
        currentPeriodEnd: subscriptionData.planExpireAt,
        hasActiveSubscription: true,
        renewStatus: subscriptionData.renewStatus,
        cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching subscription period:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch subscription period',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
