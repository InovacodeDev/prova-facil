/**
 * Cancel Subscription API Route
 *
 * "Cancels" the user's paid subscription by downgrading to the free Starter plan
 * at the end of the current billing period.
 * This ensures every user always has an active subscription (paid or free).
 */

import { invalidateSubscriptionCacheByCustomerId } from '@/lib/cache/subscription-cache';
import { STRIPE_PRODUCTS } from '@/lib/stripe/config';
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

    // Get current subscription details
    const currentSubscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
    const currentPrice = currentSubscription.items.data[0].price.id;

    // Get Starter (free) plan price
    const starterProductId = STRIPE_PRODUCTS.starter;
    if (!starterProductId) {
      return NextResponse.json({ error: 'Starter product not configured' }, { status: 500 });
    }

    // Find or create free price for Starter plan
    const prices = await stripe.prices.list({
      product: starterProductId,
      active: true,
      limit: 100,
    });

    let starterPrice = prices.data.find((price) => price.unit_amount === 0 && price.recurring);

    if (!starterPrice) {
      starterPrice = await stripe.prices.create({
        product: starterProductId,
        unit_amount: 0,
        currency: 'brl',
        recurring: { interval: 'month' },
        nickname: 'Starter - Free',
        metadata: { plan: 'starter' },
      });
      console.log(`[API] Created free price for Starter: ${starterPrice.id}`);
    }

    // Check if already on Starter plan
    if (currentPrice === starterPrice.id) {
      return NextResponse.json(
        {
          error: 'Already on Starter plan',
          message: 'Você já está no plano gratuito Starter',
        },
        { status: 400 }
      );
    }

    // Update subscription to Starter plan at period end (downgrade)
    const subscriptionItemId = currentSubscription.items.data[0].id;

    const updatedSubscription = await stripe.subscriptions.update(profile.stripe_subscription_id, {
      items: [
        {
          id: subscriptionItemId,
          price: starterPrice.id,
        },
      ],
      proration_behavior: 'none', // No proration - change at period end
      cancel_at_period_end: false, // Ensure it doesn't cancel, just downgrade
    });

    // Invalidate cache so next request reflects the scheduled change
    if (profile.stripe_customer_id) {
      await invalidateSubscriptionCacheByCustomerId(profile.stripe_customer_id);
    }

    // Extract period end
    const periodEnd = (updatedSubscription as any).current_period_end as number;
    const effectiveAt = new Date(periodEnd * 1000).toISOString();

    console.log(`[API] Subscription ${updatedSubscription.id} will downgrade to Starter at: ${effectiveAt}`);

    return NextResponse.json(
      {
        success: true,
        effectiveAt,
        message: `Seu plano será alterado para Starter (gratuito) em ${new Date(effectiveAt).toLocaleDateString(
          'pt-BR'
        )}`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error downgrading to Starter:', error);
    return NextResponse.json(
      {
        error: 'Failed to downgrade subscription',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
