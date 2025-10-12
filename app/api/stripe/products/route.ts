/**
 * Get Stripe Products API Route
 *
 * This endpoint fetches all active products with prices from Stripe.
 * Can be called from both server and client components.
 */

import { NextResponse } from 'next/server';
import { getStripeProducts } from '@/lib/stripe/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const products = await getStripeProducts();

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
