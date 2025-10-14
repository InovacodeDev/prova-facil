/**
 * Update Subscription API Route
 *
 * Updates an existing subscription to a new price/plan.
 * This endpoint handles:
 * - Immediate upgrades (with prorating)
 * - Scheduled downgrades (at period end)
 * - Prevents multiple subscriptions per customer
 */

import { invalidateSubscriptionCacheByCustomerId } from '@/lib/cache/subscription-cache';
import { stripe } from '@/lib/stripe/server';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface UpdateSubscriptionRequest {
  priceId: string;
  immediate?: boolean; // true = upgrade (immediate with proration), false = downgrade (at period end)
}

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
    const body: UpdateSubscriptionRequest = await request.json();
    const { priceId, immediate = false } = body;

    if (!priceId || typeof priceId !== 'string') {
      return NextResponse.json({ error: 'Invalid priceId' }, { status: 400 });
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
      return NextResponse.json(
        {
          error: 'No active subscription found',
          message: 'Você precisa ter uma assinatura ativa para alterá-la.',
        },
        { status: 400 }
      );
    }

    // Get current subscription details
    const currentSubscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);

    if (currentSubscription.status !== 'active' && currentSubscription.status !== 'trialing') {
      return NextResponse.json(
        {
          error: 'Subscription not active',
          message: 'Sua assinatura não está ativa no momento.',
        },
        { status: 400 }
      );
    }

    // Check if trying to change to the same price
    const currentPrice = currentSubscription.items.data[0].price.id;
    if (currentPrice === priceId) {
      return NextResponse.json(
        {
          error: 'Same price',
          message: 'Este já é o seu plano atual.',
        },
        { status: 400 }
      );
    }

    // Get subscription item ID
    const subscriptionItemId = currentSubscription.items.data[0].id;

    // Determine proration behavior based on immediate flag
    const prorationBehavior = immediate ? 'always_invoice' : 'none';

    // Update subscription
    const updatedSubscription = await stripe.subscriptions.update(profile.stripe_subscription_id, {
      items: [
        {
          id: subscriptionItemId,
          price: priceId,
        },
      ],
      proration_behavior: prorationBehavior,
      // If not immediate, ensure cancel_at_period_end is false (in case it was previously set)
      ...(immediate ? {} : { cancel_at_period_end: false }),
    });

    // Invalidate cache so next request reflects the change
    if (profile.stripe_customer_id) {
      await invalidateSubscriptionCacheByCustomerId(profile.stripe_customer_id);
    }

    // Prepare response based on timing
    let responseMessage: string;
    let effectiveAt: string | null = null;

    if (immediate) {
      responseMessage = 'Plano alterado imediatamente. O valor será ajustado proporcionalmente.';
      effectiveAt = new Date().toISOString();
    } else {
      const periodEnd = (updatedSubscription as any).current_period_end as number;
      effectiveAt = new Date(periodEnd * 1000).toISOString();
      responseMessage = `Plano será alterado em ${new Date(effectiveAt).toLocaleDateString('pt-BR')}`;
    }

    console.log(
      `[API] Subscription ${updatedSubscription.id} updated to price ${priceId}. ` +
        `Immediate: ${immediate}, Effective at: ${effectiveAt}`
    );

    return NextResponse.json(
      {
        success: true,
        immediate,
        effectiveAt,
        message: responseMessage,
        subscription: {
          id: updatedSubscription.id,
          status: updatedSubscription.status,
          currentPeriodEnd: new Date((updatedSubscription as any).current_period_end * 1000).toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating subscription:', error);

    // Handle specific Stripe errors
    if (error instanceof Error) {
      if (error.message.includes('No such subscription')) {
        return NextResponse.json(
          {
            error: 'Subscription not found',
            message: 'A assinatura não foi encontrada. Entre em contato com o suporte.',
          },
          { status: 404 }
        );
      }

      if (error.message.includes('No such price')) {
        return NextResponse.json(
          {
            error: 'Invalid price',
            message: 'O plano selecionado não é válido.',
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to update subscription',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
