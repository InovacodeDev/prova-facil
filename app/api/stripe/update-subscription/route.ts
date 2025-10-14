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

    // SPECIAL CASE: Upgrading from FREE (Starter) to PAID
    // User needs to provide payment method, so redirect to checkout
    const currentPriceDetails = await stripe.prices.retrieve(currentPrice);
    const isCurrentlyFree = currentPriceDetails.unit_amount === 0;
    const newPriceDetails = await stripe.prices.retrieve(priceId);
    const isNewPricePaid = (newPriceDetails.unit_amount ?? 0) > 0;

    if (isCurrentlyFree && isNewPricePaid) {
      // Cancel the FREE subscription immediately (will create new PAID subscription via checkout)
      await stripe.subscriptions.cancel(profile.stripe_subscription_id, {
        prorate: false, // No refund needed for FREE plan
      });

      console.log(
        `[API] Canceled FREE subscription ${profile.stripe_subscription_id} before upgrade. ` +
          `Will create new PAID subscription via checkout.`
      );

      // Create a checkout session for the PAID plan
      const checkoutSession = await stripe.checkout.sessions.create({
        customer: profile.stripe_customer_id!,
        mode: 'subscription',
        payment_method_collection: 'always', // Force payment method collection
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        subscription_data: {
          metadata: {
            user_id: user.id,
            upgraded_from_free: 'true',
          },
        },
        success_url: `${request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL}/plan?success=true`,
        cancel_url: `${request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL}/plan?canceled=true`,
        allow_promotion_codes: true,
        billing_address_collection: 'auto',
      });

      console.log(`[API] Created checkout session ${checkoutSession.id} for user ${user.id}`);

      // Return checkout URL so frontend can redirect
      return NextResponse.json(
        {
          requiresCheckout: true,
          checkoutUrl: checkoutSession.url,
          message: 'Redirecionando para adicionar método de pagamento...',
        },
        { status: 200 }
      );
    }

    // Get subscription item ID
    const subscriptionItemId = currentSubscription.items.data[0].id;

    // Determine proration behavior based on immediate flag
    const prorationBehavior = immediate ? 'always_invoice' : 'none';

    console.log(
      `[API] Updating subscription ${profile.stripe_subscription_id} ` +
        `to price ${priceId}, proration: ${prorationBehavior}, immediate: ${immediate}`
    );

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

    console.log(`[API] Subscription updated successfully. Status: ${updatedSubscription.status}`);

    // Update plan_id in database ONLY if immediate (upgrade)
    // For downgrades (immediate=false), plan_id will be updated by webhook when period ends
    if (immediate) {
      const newProductId = updatedSubscription.items.data[0]?.price?.product;
      if (newProductId) {
        const productIdStr = typeof newProductId === 'string' ? newProductId : newProductId.id;

        // Update plan_id in database
        const { data: planData } = await supabase
          .from('plans')
          .select('id')
          .eq('stripe_product_id', productIdStr)
          .single();

        if (planData?.id) {
          console.log(`[API] Updating profile plan_id to: ${planData.id} (immediate upgrade)`);

          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              plan_id: planData.id,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id);

          if (updateError) {
            console.error('[API] Error updating plan_id:', updateError);
            // Don't throw - subscription was updated successfully
          } else {
            console.log(`[API] Profile plan_id updated to: ${planData.id}`);
          }
        }
      }
    } else {
      console.log(`[API] Downgrade scheduled - plan_id will be updated by webhook at period end`);
    }

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
      // For downgrades, use current subscription's period end
      // The updatedSubscription still shows the old price until period ends
      const subObj = updatedSubscription as Record<string, any>;
      let periodEnd = subObj.current_period_end as number | undefined;
      
      // If not found in updated, try from current subscription
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
          const value = subObj[field];
          if (value && typeof value === 'number') {
            console.log(`[API] Found period end in field: ${field} = ${value}`);
            periodEnd = value;
            break;
          }
        }
        
        if (!periodEnd) {
          // Last resort: use 30 days from now
          console.warn('[API] Using fallback: 30 days from now');
          periodEnd = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
        }
      }

      // Convert Unix timestamp (seconds) to milliseconds and create ISO string
      const periodEndDate = new Date(periodEnd * 1000);
      effectiveAt = periodEndDate.toISOString();
      responseMessage = `Plano será alterado em ${periodEndDate.toLocaleDateString('pt-BR')}`;
      
      console.log(`[API] Downgrade scheduled for: ${periodEndDate.toISOString()}`);
    }

    console.log(
      `[API] Subscription ${updatedSubscription.id} updated to price ${priceId}. ` +
        `Immediate: ${immediate}, Effective at: ${effectiveAt}`
    );

    // Get current period end safely for response
    const subObjForResponse = updatedSubscription as Record<string, any>;
    let currentPeriodEnd = subObjForResponse.current_period_end as number | undefined;
    
    // Fallback to currentSubscription if needed
    if (!currentPeriodEnd) {
      const currentSubObj = currentSubscription as Record<string, any>;
      currentPeriodEnd = currentSubObj.current_period_end as number | undefined;
    }
    
    const currentPeriodEndISO =
      currentPeriodEnd && typeof currentPeriodEnd === 'number' ? new Date(currentPeriodEnd * 1000).toISOString() : null;

    return NextResponse.json(
      {
        success: true,
        immediate,
        effectiveAt,
        message: responseMessage,
        subscription: {
          id: updatedSubscription.id,
          status: updatedSubscription.status,
          currentPeriodEnd: currentPeriodEndISO,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] Error updating subscription:', error);

    // Log detailed error information
    if (error instanceof Error) {
      console.error('[API] Error name:', error.name);
      console.error('[API] Error message:', error.message);
      console.error('[API] Error stack:', error.stack);
    }

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

      if (error.message.includes('period end')) {
        return NextResponse.json(
          {
            error: 'Invalid subscription data',
            message: 'Não foi possível obter os dados da assinatura. Tente novamente.',
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to update subscription',
        message: 'Não foi possível atualizar a assinatura. Tente novamente.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
