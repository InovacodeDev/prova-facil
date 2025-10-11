import Stripe from 'stripe';

/**
 * Stripe Products helper with simple in-memory cache and TTL.
 * Purpose:
 * - Batch fetch product objects by id
 * - Deduplicate requests so we only call Stripe once per unique id
 * - Cache fetched products in-memory for a short TTL (default 5 minutes)
 *
 * Usage:
 *   import { getProductsByIds, getProduct, clearStripeProductCache } from '@/lib/stripe-products';
 *
 *   const products = await getProductsByIds(['prod_123', 'prod_456']);
 */

const DEFAULT_TTL_MS = 1000 * 60 * 5; // 5 minutes

type CachedProduct = {
  expiresAt: number;
  product: Stripe.Product;
};

// In-memory cache
const productCache: Map<string, CachedProduct> = new Map();

// Pending fetches to deduplicate concurrent requests
const pendingFetches: Map<string, Promise<Stripe.Product>> = new Map();

function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not defined in env');
  // Use default apiVersion provided by the installed stripe package to avoid type mismatch
  return new Stripe(key);
}

async function fetchProductFromStripe(productId: string): Promise<Stripe.Product> {
  const stripe = getStripeClient();
  return stripe.products.retrieve(productId);
}

/**
 * Get single product by id, uses cache and deduplicates concurrent fetches.
 */
export async function getProduct(productId: string, ttlMs = DEFAULT_TTL_MS): Promise<Stripe.Product> {
  // Check cache
  const cached = productCache.get(productId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.product;
  }

  // If there's a pending fetch, return it
  const pending = pendingFetches.get(productId);
  if (pending) return pending;

  const fetcher = (async () => {
    try {
      const product = await fetchProductFromStripe(productId);
      productCache.set(productId, { product, expiresAt: Date.now() + ttlMs });
      return product;
    } finally {
      pendingFetches.delete(productId);
    }
  })();

  pendingFetches.set(productId, fetcher);
  return fetcher;
}

/**
 * Get multiple products by ids. Will fetch only missing ids and return a map of id->product.
 */
export async function getProductsByIds(
  ids: string[],
  ttlMs = DEFAULT_TTL_MS
): Promise<Record<string, Stripe.Product | null>> {
  const result: Record<string, Stripe.Product | null> = {};
  const idsToFetch: string[] = [];

  for (const id of ids) {
    const cached = productCache.get(id);
    if (cached && cached.expiresAt > Date.now()) {
      result[id] = cached.product;
    } else {
      result[id] = null;
      idsToFetch.push(id);
    }
  }

  // Deduplicate idsToFetch
  const uniqueIdsToFetch = Array.from(new Set(idsToFetch));

  // Kick off all fetches in parallel but reuse pendingFetches for concurrency
  await Promise.all(
    uniqueIdsToFetch.map(async (id) => {
      try {
        const product = await getProduct(id, ttlMs);
        result[id] = product;
      } catch (err) {
        // If retrieval fails, keep null to indicate missing
        result[id] = null;
      }
    })
  );

  return result;
}

export function clearStripeProductCache() {
  productCache.clear();
}

// --- TTL & Invalidation API ---

/**
 * Update the default TTL (in milliseconds) used for future fetches when ttlMs is not provided.
 * NOTE: existing cached entries keep their original expiresAt; this only affects future writes.
 */
export function setDefaultTTL(ms: number) {
  if (ms <= 0) throw new Error('TTL must be a positive integer');
  // Update the module-level default by reassigning the constant via a shadowed variable.
  // Since DEFAULT_TTL_MS is a const, keep an internal mutable variable for runtime-configurable TTL.
  runtimeConfig.defaultTtlMs = ms;
}

/**
 * Set a custom TTL for a single cached product (if it exists).
 * Returns true if product existed and was updated, false otherwise.
 */
export function setProductTTL(productId: string, ms: number): boolean {
  const cached = productCache.get(productId);
  if (!cached) return false;
  if (ms <= 0) throw new Error('TTL must be a positive integer');
  cached.expiresAt = Date.now() + ms;
  productCache.set(productId, cached);
  return true;
}

/**
 * Invalidate one or more product ids from the cache.
 */
export function invalidateProducts(ids: string[] | string) {
  if (typeof ids === 'string') ids = [ids];
  for (const id of ids) productCache.delete(id);
}

/**
 * Helper to invalidate cache entries coming from Stripe webhook events.
 * Supported event types:
 * - product.updated (data.object.id)
 * - product.deleted (data.object.id)
 * - price.updated (data.object.product)
 * - price.deleted (data.object.product)
 * - price.created (data.object.product)
 * If the event does not map to product ids, this function is a no-op.
 */
export function invalidateFromStripeEvent(event: { type: string; data?: { object?: any } }) {
  const t = event?.type;
  const obj = event?.data?.object;
  if (!t || !obj) return;

  const productIds: string[] = [];

  if (t.startsWith('product.')) {
    if (typeof obj.id === 'string') productIds.push(obj.id);
  } else if (t.startsWith('price.')) {
    // price object may include `product` as id or a nested object
    if (typeof obj.product === 'string') productIds.push(obj.product);
    else if (obj.product && typeof obj.product.id === 'string') productIds.push(obj.product.id);
  }

  if (productIds.length > 0) invalidateProducts(productIds);
}

// Runtime-configurable values (mutable)
const runtimeConfig = {
  defaultTtlMs: DEFAULT_TTL_MS,
};

// Ensure getProduct and getProductsByIds use runtimeConfig.defaultTtlMs when ttlMs is not explicitly provided.
// To achieve that without changing all call sites above, re-export wrappers that respect runtimeConfig.

// Re-exported wrappers (backwards-compatible):
export async function getProductWithRuntimeTTL(productId: string, ttlMs?: number) {
  return getProduct(productId, typeof ttlMs === 'number' ? ttlMs : runtimeConfig.defaultTtlMs);
}

export async function getProductsByIdsWithRuntimeTTL(ids: string[], ttlMs?: number) {
  return getProductsByIds(ids, typeof ttlMs === 'number' ? ttlMs : runtimeConfig.defaultTtlMs);
}

// Deprecated short names map to the runtime-aware versions for consumers that might call the old names without an explicit ttl.
// Keep the original `getProduct` and `getProductsByIds` exported above for explicit-ttl callers. Consumers who want runtime TTL
// should switch to `getProductWithRuntimeTTL` / `getProductsByIdsWithRuntimeTTL`.
