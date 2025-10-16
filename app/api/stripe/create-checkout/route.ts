/**
 * Create Checkout Session API Route
 *
 * This endpoint creates a Stripe Checkout Session for subscription purchase.
 * It requires authentication and returns a checkout URL for client-side redirect.
 */

import { getCheckoutUrls } from '@/lib/stripe/config';
import { createCheckoutSession, createOrGetCustomer } from '@/lib/stripe/server';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
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

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name, stripe_customer_id, stripe_subscription_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Create or get Stripe customer
    let customerId = profile.stripe_customer_id;

    if (!customerId) {
      const customer = await createOrGetCustomer(profile.email, profile.full_name, profile.id);
      customerId = customer.id;

      // Save customer ID to profile
      await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', profile.id);
    }

    // Get base URL for redirect URLs
    const origin = request.headers.get('origin') || 'http://localhost:8800';
    const { success, cancel } = getCheckoutUrls(origin);

    // Check if user already has an active subscription
    if (profile.stripe_subscription_id) {
      try {
        const { stripe } = await import('@/lib/stripe/server');
        const existingSubscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);

        // If subscription is active or trialing, we should update it instead of creating a new one
        if (existingSubscription.status === 'active' || existingSubscription.status === 'trialing') {
          return NextResponse.json(
            {
              error: 'Active subscription exists',
              message: 'Você já possui uma assinatura ativa. Use o portal de gerenciamento para alterar seu plano.',
              shouldRedirectToPortal: true,
            },
            { status: 409 }
          );
        }
      } catch (error) {
        // If subscription doesn't exist or is invalid, continue with checkout
        console.warn('Existing subscription check failed, continuing with checkout:', error);
      }
    }

    // Create checkout session
    const session = await createCheckoutSession(customerId, priceId, success, cancel);

    return NextResponse.json(
      {
        sessionId: session.id,
        url: session.url,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
