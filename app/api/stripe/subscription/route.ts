/**
 * Get User Subscription API Route
 *
 * Fetches the current user's subscription data from Stripe with Redis caching.
 * Requires authentication.
 */

import { getSubscriptionData } from '@/lib/stripe/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    const stripe_subscription_id = request.nextUrl.searchParams.get('stripe_subscription_id');
    const stripe_customer_id = request.nextUrl.searchParams.get('stripe_customer_id');

    const subscriptionData = await getSubscriptionData(userId, stripe_customer_id, stripe_subscription_id);

    return NextResponse.json(
      {
        subscription: subscriptionData,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('[API] Error fetching subscription:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch subscription',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
