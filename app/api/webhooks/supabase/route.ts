/**
 * Supabase Database Webhook Handler
 *
 * Purpose: Receive database webhooks from Supabase and trigger appropriate actions
 *
 * This endpoint handles:
 * 1. Profile updates → Sync Stripe subscription
 * 2. Subscription changes → Update profile and cache
 *
 * Supabase Webhook Configuration:
 * - Go to Supabase Dashboard → Database → Webhooks
 * - Create webhook for "profiles" table
 * - Events: INSERT, UPDATE
 * - URL: https://your-app.com/api/webhooks/supabase
 * - HTTP Headers: Authorization: Bearer YOUR_WEBHOOK_SECRET
 *
 * @author Prova Fácil Team
 * @date 2025-10-14
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Webhook secret for security
const WEBHOOK_SECRET = process.env.SUPABASE_WEBHOOK_SECRET;

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  record: any;
  old_record?: any;
}

/**
 * POST /api/webhooks/supabase
 *
 * Receives database change events from Supabase webhooks
 */
export async function POST(request: NextRequest) {
  console.log('[Supabase Webhook] Request received');

  try {
    // Verify webhook secret if configured
    if (WEBHOOK_SECRET) {
      const authHeader = request.headers.get('authorization');
      const expectedAuth = `Bearer ${WEBHOOK_SECRET}`;

      if (authHeader !== expectedAuth) {
        console.error('[Supabase Webhook] Unauthorized request');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Parse webhook payload
    const payload: WebhookPayload = await request.json();

    console.log('[Supabase Webhook] Event type:', payload.type);
    console.log('[Supabase Webhook] Table:', payload.table);

    // Handle profiles table updates
    if (payload.table === 'profiles') {
      return handleProfileWebhook(payload);
    }

    // Unknown table
    console.log('[Supabase Webhook] No handler for table:', payload.table);
    return NextResponse.json({
      success: true,
      message: 'Webhook received but no action taken',
    });
  } catch (error) {
    console.error('[Supabase Webhook] Error processing webhook:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process webhook',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * Handle profile table webhooks
 */
async function handleProfileWebhook(payload: WebhookPayload): Promise<NextResponse> {
  const record = payload.record;
  const oldRecord = payload.old_record;

  console.log('[Profile Webhook] Processing profile change');
  console.log('[Profile Webhook] Profile ID:', record?.id);
  console.log('[Profile Webhook] Customer ID:', record?.stripe_customer_id);

  // Only process if profile has a stripe_customer_id
  if (!record?.stripe_customer_id) {
    console.log('[Profile Webhook] No stripe_customer_id, skipping sync');
    return NextResponse.json({
      success: true,
      message: 'No Stripe customer ID, sync not needed',
    });
  }

  // Check if this is a change that requires sync
  const shouldSync =
    payload.type === 'INSERT' ||
    (payload.type === 'UPDATE' &&
      (oldRecord?.stripe_customer_id !== record?.stripe_customer_id ||
        oldRecord?.stripe_subscription_id !== record?.stripe_subscription_id ||
        oldRecord?.plan_id !== record?.plan_id));

  if (!shouldSync) {
    console.log('[Profile Webhook] Change does not require sync');
    return NextResponse.json({
      success: true,
      message: 'Change does not require subscription sync',
    });
  }

  console.log('[Profile Webhook] Triggering subscription sync...');

  // Call the sync-customer-subscription endpoint
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const syncUrl = `${baseUrl}/api/stripe/sync-customer-subscription`;

    const syncResponse = await fetch(syncUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerId: record.stripe_customer_id,
        profileId: record.id,
      }),
    });

    const syncData = await syncResponse.json();

    if (syncResponse.ok && syncData.success) {
      console.log('[Profile Webhook] ✅ Subscription synced successfully');
      return NextResponse.json({
        success: true,
        message: 'Subscription synced successfully',
        data: syncData,
      });
    } else {
      console.error('[Profile Webhook] ❌ Sync failed:', syncData.error);
      return NextResponse.json(
        {
          success: false,
          error: 'Sync failed',
          details: syncData.error,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Profile Webhook] ❌ Error calling sync endpoint:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to sync subscription',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
