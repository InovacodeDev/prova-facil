/**
 * Clear Stripe cache endpoint
 * POST /api/stripe/clear-cache
 */

import { invalidateStripeProductsCache } from '@/lib/cache/stripe-products-cache';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    await invalidateStripeProductsCache();

    return NextResponse.json({
      success: true,
      message: 'Stripe products cache cleared successfully',
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    return NextResponse.json({ error: 'Failed to clear cache' }, { status: 500 });
  }
}
