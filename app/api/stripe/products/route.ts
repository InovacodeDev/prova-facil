/**
 * Get Stripe Products API Route
 *
 * This endpoint fetches all active products with prices from Stripe.
 * Implements Redis caching to reduce API calls and improve performance.
 * Can be called from both server and client components.
 */

import { getCachedStripeProducts, setCachedStripeProducts } from '@/lib/cache/stripe-products-cache';
import { getStripeProducts } from '@/lib/stripe/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Try to get products from cache first
    let products = await getCachedStripeProducts();

    if (!products) {
      // Cache miss - fetch from Stripe API
      console.log('[API] Fetching products from Stripe API');
      products = await getStripeProducts();

      // Store in cache for next time
      await setCachedStripeProducts(products);
    } else {
      console.log('[API] Serving products from cache');
    }

    // Sort products by questionsPerMonth (ascending)
    const sortedProducts = products.sort((a, b) => a.questionsPerMonth - b.questionsPerMonth);

    return NextResponse.json(
      {
        products: sortedProducts,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching Stripe products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
