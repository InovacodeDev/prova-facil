/**
 * Get Plan ID by Stripe Product ID
 *
 * Returns the internal plan ID (starter, basic, etc.) based on the Stripe product ID
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ error: 'Missing productId parameter' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get plan ID based on stripe_product_id
    const { data: planData, error } = await supabase
      .from('plans')
      .select('id')
      .eq('stripe_product_id', productId)
      .single();

    if (error || !planData) {
      console.error('[API] Plan not found for product ID:', productId, error);
      // Return starter as fallback
      return NextResponse.json({ planId: 'starter' }, { status: 200 });
    }

    return NextResponse.json({ planId: planData.id }, { status: 200 });
  } catch (error) {
    console.error('[API] Error fetching plan ID:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch plan ID',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
