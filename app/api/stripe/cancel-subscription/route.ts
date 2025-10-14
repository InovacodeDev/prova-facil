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
import Stripe from 'stripe';

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

    // Extract period end with robust fallback
    const updatedSubObj = updatedSubscription as Record<string, any>;
    let periodEnd = updatedSubObj.current_period_end as number | undefined;

    // Fallback to currentSubscription if needed
    if (!periodEnd || typeof periodEnd !== 'number') {
      console.warn('[API] current_period_end not found in updatedSubscription, using currentSubscription');
      const currentSubObj = currentSubscription as Record<string, any>;
      periodEnd = currentSubObj.current_period_end as number | undefined;
    }

    if (!periodEnd || typeof periodEnd !== 'number') {
      console.error('[API] Invalid current_period_end:', periodEnd);
      console.error('[API] updatedSubscription keys:', Object.keys(updatedSubscription));
      console.error('[API] currentSubscription keys:', Object.keys(currentSubscription));

      // Try to find any period-related field
      const possibleFields = ['current_period_end', 'currentPeriodEnd', 'period_end'];
      for (const field of possibleFields) {
        const value = updatedSubObj[field];
        if (value && typeof value === 'number') {
          console.log(`[API] Found period end in field: ${field} = ${value}`);
          periodEnd = value;
          break;
        }
      }

      if (!periodEnd) {
        // Last resort: use 30 days from now
        console.warn('[API] Using fallback: 30 days from now');
        periodEnd = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
      }
    }

    const effectiveAt = new Date(periodEnd * 1000).toISOString();
    const effectiveDate = new Date(periodEnd * 1000);

    console.log(`[API] Subscription ${updatedSubscription.id} will downgrade to Starter at: ${effectiveAt}`);

    return NextResponse.json(
      {
        success: true,
        effectiveAt,
        message: `Seu plano será alterado para Starter (gratuito) em ${effectiveDate.toLocaleDateString('pt-BR')}`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] Error downgrading to Starter:', error);
    
    // Log detailed error information
    if (error instanceof Error) {
      console.error('[API] Error name:', error.name);
      console.error('[API] Error message:', error.message);
      console.error('[API] Error stack:', error.stack);
    }
    
    return NextResponse.json(
      {
        error: 'Failed to downgrade subscription',
        message: 'Não foi possível cancelar a assinatura. Tente novamente.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
