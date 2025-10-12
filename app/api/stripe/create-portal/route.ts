/**
 * Create Billing Portal Session API Route
 *
 * This endpoint creates a Stripe Billing Portal Session for subscription management.
 * Users can update payment methods, view invoices, and manage their subscription.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createBillingPortalSession } from '@/lib/stripe/server';

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

    // Get user profile with Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (!profile.stripe_customer_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
    }

    // Get origin for return URL
    const origin = request.headers.get('origin') || 'http://localhost:8800';
    const returnUrl = `${origin}/plan`;

    // Create billing portal session
    const session = await createBillingPortalSession(profile.stripe_customer_id, returnUrl);

    return NextResponse.json(
      {
        url: session.url,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error creating billing portal session:', error);
    return NextResponse.json({ error: 'Failed to create billing portal session' }, { status: 500 });
  }
}
