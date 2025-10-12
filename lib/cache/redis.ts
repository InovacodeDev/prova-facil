/**
 * Redis Cache Client
 *
 * Provides a singleton Redis connection for caching Stripe subscription data.
 * Uses ioredis with automatic reconnection and error handling.
 *
 * Configuration via environment variables:
 * - REDIS_URL: Full Redis connection URL (redis://user:password@host:port/db)
 * - REDIS_HOST: Redis host (fallback if REDIS_URL not set)
 * - REDIS_PORT: Redis port (fallback, default: 6379)
 * - REDIS_PASSWORD: Redis password (fallback)
 *
 * @module lib/cache/redis
 */

import Redis from 'ioredis';

let redisClient: Redis | null = null;
let isConnected = false;

/**
 * Get or create Redis client instance (Singleton pattern)
 */
export function getRedisClient(): Redis | null {
  // If Redis is not configured, return null (cache disabled)
  if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
    console.warn('[Redis] No Redis configuration found. Caching is disabled.');
    return null;
  }

  // Return existing instance if available
  if (redisClient && isConnected) {
    return redisClient;
  }

  try {
    // Create new Redis client
    if (process.env.REDIS_URL) {
      redisClient = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: false,
      });
    } else {
      redisClient = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD,
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: false,
      });
    }

    // Connection event handlers
    redisClient.on('connect', () => {
      console.log('[Redis] Connected successfully');
      isConnected = true;
    });

    redisClient.on('ready', () => {
      console.log('[Redis] Ready to accept commands');
    });

    redisClient.on('error', (error) => {
      console.error('[Redis] Connection error:', error.message);
      isConnected = false;
    });

    redisClient.on('close', () => {
      console.log('[Redis] Connection closed');
      isConnected = false;
    });

    redisClient.on('reconnecting', () => {
      console.log('[Redis] Reconnecting...');
    });

    return redisClient;
  } catch (error) {
    console.error('[Redis] Failed to create client:', error);
    return null;
  }
}

/**
 * Close Redis connection (useful for graceful shutdown)
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    isConnected = false;
    console.log('[Redis] Connection closed gracefully');
  }
}

/**
 * Check if Redis is available and connected
 */
export function isRedisAvailable(): boolean {
  return redisClient !== null && isConnected;
}

/**
 * Ping Redis to check connection health
 */
export async function pingRedis(): Promise<boolean> {
  try {
    const client = getRedisClient();
    if (!client) return false;

    const result = await client.ping();
    return result === 'PONG';
  } catch (error) {
    console.error('[Redis] Ping failed:', error);
    return false;
  }
}
