/**
 * Subscription Cache Service
 *
 * Implements intelligent caching for Stripe subscription data using Redis.
 *
 * Key Features:
 * - Cache-first strategy: Check cache before hitting Stripe API
 * - Smart TTL: Longer cache for stable subscriptions, shorter near renewal
 * - Automatic cache invalidation on subscription changes (via webhooks)
 * - Graceful degradation: Falls back to direct Stripe calls if Redis unavailable
 *
 * Cache Strategy:
 * - More than 7 days until renewal: 24 hours TTL
 * - 3-7 days until renewal: 6 hours TTL
 * - 1-3 days until renewal: 1 hour TTL
 * - Less than 1 day until renewal: 15 minutes TTL
 * - Canceled/Trialing: 1 hour TTL
 *
 * @module lib/cache/subscription-cache
 */

import type Stripe from 'stripe';
import { getRedisClient } from './redis';

const CACHE_KEY_PREFIX = 'stripe:subscription:';

/**
 * Subscription data structure stored in cache
 */
export interface CachedSubscriptionData {
  subscriptionId: string | null;
  customerId: string;
  status: Stripe.Subscription.Status | 'none';
  plan: 'starter' | 'basic' | 'essentials' | 'plus' | 'advanced';
  planExpireAt: string | null; // ISO date string
  renewStatus: 'monthly' | 'yearly' | 'trial' | 'canceled' | 'none';
  productId: string | null;
  priceId: string | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: number | null; // Unix timestamp
  currentPeriodStart: number | null; // Unix timestamp
  scheduledNextPlan: string | null; // Next plan ID when downgrade is scheduled (from metadata.downgrade_scheduled_to)
  cachedAt: string; // ISO date string
}

/**
 * Generate cache key for a user
 */
function getCacheKey(userId: string): string {
  return `${CACHE_KEY_PREFIX}${userId}`;
}

/**
 * Calculate smart TTL based on subscription renewal date
 * Returns TTL in seconds
 */
function calculateSmartTTL(data: CachedSubscriptionData): number {
  // Default TTL values (in seconds)
  const ONE_HOUR = 60 * 60;
  const SIX_HOURS = 6 * ONE_HOUR;
  const ONE_DAY = 24 * ONE_HOUR;
  const FIFTEEN_MINUTES = 15 * 60;

  // For canceled or trial subscriptions, use shorter cache
  if (data.renewStatus === 'canceled' || data.renewStatus === 'trial') {
    return ONE_HOUR;
  }

  // For free plan (no subscription), cache for a day
  if (data.status === 'none' || !data.currentPeriodEnd) {
    return ONE_DAY;
  }

  // Calculate days until renewal
  const now = Date.now() / 1000; // Unix timestamp in seconds
  const secondsUntilRenewal = data.currentPeriodEnd - now;
  const daysUntilRenewal = secondsUntilRenewal / (60 * 60 * 24);

  // Smart TTL based on proximity to renewal
  if (daysUntilRenewal > 7) {
    return ONE_DAY; // More than 7 days: 24 hours cache
  } else if (daysUntilRenewal > 3) {
    return SIX_HOURS; // 3-7 days: 6 hours cache
  } else if (daysUntilRenewal > 1) {
    return ONE_HOUR; // 1-3 days: 1 hour cache
  } else {
    return FIFTEEN_MINUTES; // Less than 1 day: 15 minutes cache
  }
}

/**
 * Get cached subscription data for a user
 * Returns null if cache miss or Redis unavailable
 */
export async function getCachedSubscription(userId: string): Promise<CachedSubscriptionData | null> {
  const redis = getRedisClient();
  if (!redis) {
    return null; // Redis not available, skip cache
  }

  try {
    const cacheKey = getCacheKey(userId);
    const cached = await redis.get(cacheKey);

    if (!cached) {
      console.log(`[SubscriptionCache] Cache miss for user: ${userId}`);
      return null;
    }

    const data = JSON.parse(cached) as CachedSubscriptionData;
    console.log(`[SubscriptionCache] Cache hit for user: ${userId}`);
    return data;
  } catch (error) {
    console.error('[SubscriptionCache] Error reading from cache:', error);
    return null;
  }
}

/**
 * Set cached subscription data for a user with smart TTL
 */
export async function setCachedSubscription(userId: string, data: CachedSubscriptionData): Promise<void> {
  const redis = getRedisClient();
  if (!redis) {
    return; // Redis not available, skip cache
  }

  try {
    const cacheKey = getCacheKey(userId);
    const ttl = calculateSmartTTL(data);

    // Add cached timestamp
    const dataWithTimestamp: CachedSubscriptionData = {
      ...data,
      cachedAt: new Date().toISOString(),
    };

    await redis.setex(cacheKey, ttl, JSON.stringify(dataWithTimestamp));

    const ttlMinutes = Math.round(ttl / 60);
    console.log(`[SubscriptionCache] Cached subscription for user ${userId} (TTL: ${ttlMinutes} minutes)`);
  } catch (error) {
    console.error('[SubscriptionCache] Error writing to cache:', error);
  }
}

/**
 * Invalidate (delete) cached subscription data for a user
 * Called when subscription changes (via webhook or user action)
 */
export async function invalidateSubscriptionCache(userId: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) {
    return;
  }

  try {
    const cacheKey = getCacheKey(userId);
    await redis.del(cacheKey);
    console.log(`[SubscriptionCache] Cache invalidated for user: ${userId}`);
  } catch (error) {
    console.error('[SubscriptionCache] Error invalidating cache:', error);
  }
}

/**
 * Invalidate cache by Stripe customer ID
 * Useful in webhooks where we only have the customer ID
 */
export async function invalidateSubscriptionCacheByCustomerId(customerId: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) {
    return;
  }

  try {
    // Find all cache keys matching the pattern
    const pattern = `${CACHE_KEY_PREFIX}*`;
    const keys = await redis.keys(pattern);

    // Check each key to find the one with matching customer ID
    for (const key of keys) {
      const cached = await redis.get(key);
      if (cached) {
        const data = JSON.parse(cached) as CachedSubscriptionData;
        if (data.customerId === customerId) {
          await redis.del(key);
          console.log(`[SubscriptionCache] Cache invalidated for customer: ${customerId}`);
          return;
        }
      }
    }
  } catch (error) {
    console.error('[SubscriptionCache] Error invalidating cache by customer ID:', error);
  }
}

/**
 * Clear all subscription caches (admin/maintenance operation)
 */
export async function clearAllSubscriptionCaches(): Promise<number> {
  const redis = getRedisClient();
  if (!redis) {
    return 0;
  }

  try {
    const pattern = `${CACHE_KEY_PREFIX}*`;
    const keys = await redis.keys(pattern);

    if (keys.length === 0) {
      return 0;
    }

    await redis.del(...keys);
    console.log(`[SubscriptionCache] Cleared ${keys.length} cached subscriptions`);
    return keys.length;
  } catch (error) {
    console.error('[SubscriptionCache] Error clearing all caches:', error);
    return 0;
  }
}
