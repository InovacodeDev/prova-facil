/**
 * Stripe Subscription Sync Listener
 *
 * Purpose: Listen to PostgreSQL NOTIFY events and automatically sync
 * Stripe subscriptions when profile changes are detected.
 *
 * This service:
 * 1. Connects to PostgreSQL and listens for 'sync_stripe_subscription' events
 * 2. When triggered, calls the sync-customer-subscription API endpoint
 * 3. Ensures stripe_subscription_id is always up-to-date with Stripe
 *
 * How it works:
 * - Database trigger fires on profile INSERT/UPDATE with stripe_customer_id
 * - Trigger sends pg_notify('sync_stripe_subscription', { profile_id, customer_id })
 * - This listener receives the notification
 * - Makes HTTP request to /api/stripe/sync-customer-subscription
 * - Endpoint fetches latest subscription from Stripe and updates profile
 *
 * Benefits:
 * - Automatic sync without manual intervention
 * - Always reflects the most recent active subscription
 * - Works for webhooks, manual updates, and edge cases
 * - Reduces inconsistencies between Stripe and database
 *
 * @author Prova Fácil Team
 * @date 2025-10-14
 */

import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const SYNC_API_ENDPOINT = `${APP_URL}/api/stripe/sync-customer-subscription`;

// Validation
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[Subscription Sync Listener] Missing required environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role for Realtime
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface SyncPayload {
  profile_id: string;
  customer_id: string;
}

/**
 * Call the sync API endpoint
 */
async function syncCustomerSubscription(payload: SyncPayload): Promise<void> {
  try {
    console.log('[Subscription Sync] Calling sync API for customer:', payload.customer_id);

    const response = await fetch(SYNC_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerId: payload.customer_id,
        profileId: payload.profile_id,
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      console.log('[Subscription Sync] ✅ Success:', data.message);
      console.log('[Subscription Sync] Subscription ID:', data.subscriptionId);
      console.log('[Subscription Sync] Plan ID:', data.planId);
    } else {
      console.error('[Subscription Sync] ❌ Failed:', data.error);
      console.error('[Subscription Sync] Details:', data.details);
    }
  } catch (error) {
    console.error('[Subscription Sync] ❌ Error calling sync API:', error);
    if (error instanceof Error) {
      console.error('[Subscription Sync] Error details:', error.message);
    }
  }
}

/**
 * Start listening to database notifications
 */
export async function startSubscriptionSyncListener(): Promise<void> {
  console.log('[Subscription Sync Listener] Starting...');
  console.log('[Subscription Sync Listener] Supabase URL:', SUPABASE_URL);
  console.log('[Subscription Sync Listener] API Endpoint:', SYNC_API_ENDPOINT);

  try {
    // Subscribe to the channel for sync notifications
    const channel = supabase.channel('sync_stripe_subscription');

    // Listen to PostgreSQL notifications
    channel.on(
      'postgres_changes' as any,
      {
        event: '*',
        schema: 'public',
        table: 'profiles',
      },
      async (payload: any) => {
        console.log('[Subscription Sync Listener] Received database change:', payload);

        // Check if this change requires a sync
        const newRecord = payload.new;
        const oldRecord = payload.old;

        if (newRecord?.stripe_customer_id) {
          // Check if relevant fields changed
          const shouldSync =
            payload.eventType === 'INSERT' ||
            (payload.eventType === 'UPDATE' &&
              (oldRecord?.stripe_customer_id !== newRecord?.stripe_customer_id ||
                oldRecord?.stripe_subscription_id !== newRecord?.stripe_subscription_id ||
                oldRecord?.plan_id !== newRecord?.plan_id));

          if (shouldSync) {
            console.log('[Subscription Sync Listener] Triggering sync for profile:', newRecord.id);

            await syncCustomerSubscription({
              profile_id: newRecord.id,
              customer_id: newRecord.stripe_customer_id,
            });
          } else {
            console.log('[Subscription Sync Listener] Change does not require sync');
          }
        }
      }
    );

    // Subscribe to the channel
    await channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[Subscription Sync Listener] ✅ Successfully subscribed to database changes');
        console.log('[Subscription Sync Listener] Listening for profile updates...');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('[Subscription Sync Listener] ❌ Channel error');
      } else if (status === 'TIMED_OUT') {
        console.error('[Subscription Sync Listener] ❌ Connection timed out');
      } else {
        console.log('[Subscription Sync Listener] Status:', status);
      }
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      console.log('[Subscription Sync Listener] Shutting down gracefully...');
      await channel.unsubscribe();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('[Subscription Sync Listener] Shutting down gracefully...');
      await channel.unsubscribe();
      process.exit(0);
    });
  } catch (error) {
    console.error('[Subscription Sync Listener] ❌ Fatal error:', error);
    if (error instanceof Error) {
      console.error('[Subscription Sync Listener] Error details:', error.message);
      console.error('[Subscription Sync Listener] Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Start the listener if this file is run directly
if (require.main === module) {
  console.log('='.repeat(60));
  console.log('Starting Stripe Subscription Sync Listener');
  console.log('='.repeat(60));

  startSubscriptionSyncListener().catch((error) => {
    console.error('[Subscription Sync Listener] Failed to start:', error);
    process.exit(1);
  });
}

export default startSubscriptionSyncListener;
