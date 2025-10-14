/**
 * Stripe Products Cache
 *
 * Implements Redis caching for Stripe products to reduce API calls
 * and improve page load performance.
 *
 * Cache Strategy:
 * - TTL: 1 hour (products don't change frequently)
 * - Key: stripe:products:all
 */

import type { StripeProductWithPrices } from '@/types/stripe';
import { getRedisClient } from './redis';

const CACHE_KEY = 'stripe:products:all';
const CACHE_TTL = 3600; // 1 hour in seconds

/**
 * Gets cached Stripe products from Redis
 *
 * @returns Cached products array or null if cache miss
 */
export async function getCachedStripeProducts(): Promise<StripeProductWithPrices[] | null> {
  try {
    const redis = getRedisClient();
    if (!redis) {
      console.log('[Cache] Redis not available, skipping cache');
      return null;
    }

    const cached = await redis.get(CACHE_KEY);

    if (!cached) {
      console.log('[Cache] Stripe products cache miss');
      return null;
    }

    const products = JSON.parse(cached) as StripeProductWithPrices[];
    console.log(`[Cache] Stripe products cache hit (${products.length} products)`);
    return products;
  } catch (error) {
    console.error('[Cache] Error reading Stripe products from cache:', error);
    return null;
  }
}

/**
 * Stores Stripe products in Redis cache
 *
 * @param products - Array of products to cache
 */
export async function setCachedStripeProducts(products: StripeProductWithPrices[]): Promise<void> {
  try {
    const redis = getRedisClient();
    if (!redis) {
      console.log('[Cache] Redis not available, skipping cache');
      return;
    }

    await redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(products));
    console.log(`[Cache] Cached ${products.length} Stripe products (TTL: ${CACHE_TTL}s)`);
  } catch (error) {
    console.error('[Cache] Error caching Stripe products:', error);
    // Don't throw - caching failure shouldn't break the app
  }
}

/**
 * Manually invalidates the Stripe products cache
 *
 * Use this when products are updated in the Stripe Dashboard
 */
export async function invalidateStripeProductsCache(): Promise<void> {
  try {
    const redis = getRedisClient();
    if (!redis) {
      console.log('[Cache] Redis not available, skipping invalidation');
      return;
    }

    await redis.del(CACHE_KEY);
    console.log('[Cache] Stripe products cache invalidated');
  } catch (error) {
    console.error('[Cache] Error invalidating Stripe products cache:', error);
  }
}
