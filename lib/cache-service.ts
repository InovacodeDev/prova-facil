/**
 * Centralized Cache Service
 *
 * Provides a unified caching layer for application data with:
 * - TTL (Time To Live) based expiration
 * - Automatic invalidation
 * - Type-safe cache keys
 * - Memory and localStorage support
 */

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number; // milliseconds
}

type CacheKey =
    | `profile:${string}` // profile:user_id
    | `plan:${string}` // plan:plan_id
    | `questions:${string}` // questions:user_id
    | `usage:${string}:${string}` // usage:user_id:cycle
    | `assessments:${string}`; // assessments:user_id

class CacheService {
    private memoryCache: Map<string, CacheEntry<any>> = new Map();
    private readonly DEFAULT_TTL = 60 * 60 * 1000; // 1 hour

    /**
     * Get data from cache
     */
    get<T>(key: CacheKey): T | null {
        // Try memory cache first (fastest)
        const memEntry = this.memoryCache.get(key);
        if (memEntry && this.isValid(memEntry)) {
            return memEntry.data as T;
        }

        // Try localStorage (persistent across page reloads)
        try {
            const stored = localStorage.getItem(key);
            if (stored) {
                const entry: CacheEntry<T> = JSON.parse(stored);
                if (this.isValid(entry)) {
                    // Restore to memory cache
                    this.memoryCache.set(key, entry);
                    return entry.data;
                }
            }
        } catch (error) {
            console.error("Error reading from localStorage cache:", error);
        }

        return null;
    }

    /**
     * Set data in cache with optional TTL
     */
    set<T>(key: CacheKey, data: T, ttl: number = this.DEFAULT_TTL): void {
        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            ttl,
        };

        // Store in memory
        this.memoryCache.set(key, entry);

        // Store in localStorage
        try {
            localStorage.setItem(key, JSON.stringify(entry));
        } catch (error) {
            console.error("Error writing to localStorage cache:", error);
        }
    }

    /**
     * Invalidate specific cache key
     */
    invalidate(key: CacheKey): void {
        this.memoryCache.delete(key);
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error("Error removing from localStorage cache:", error);
        }
    }

    /**
     * Invalidate all keys matching a pattern
     */
    invalidatePattern(pattern: string): void {
        // Clear memory cache
        const keysToDelete: string[] = [];
        this.memoryCache.forEach((_, key) => {
            if (key.startsWith(pattern)) {
                keysToDelete.push(key);
            }
        });
        keysToDelete.forEach((key) => this.memoryCache.delete(key));

        // Clear localStorage
        try {
            const keys = Object.keys(localStorage);
            keys.forEach((key) => {
                if (key.startsWith(pattern)) {
                    localStorage.removeItem(key);
                }
            });
        } catch (error) {
            console.error("Error clearing localStorage pattern:", error);
        }
    }

    /**
     * Clear all cache
     */
    clear(): void {
        this.memoryCache.clear();
        try {
            // Clear only our cache keys, not all localStorage
            const keys = Object.keys(localStorage);
            keys.forEach((key) => {
                if (
                    key.startsWith("profile:") ||
                    key.startsWith("plan:") ||
                    key.startsWith("questions:") ||
                    key.startsWith("usage:") ||
                    key.startsWith("assessments:")
                ) {
                    localStorage.removeItem(key);
                }
            });
        } catch (error) {
            console.error("Error clearing localStorage cache:", error);
        }
    }

    /**
     * Check if cache entry is still valid
     */
    private isValid(entry: CacheEntry<any>): boolean {
        const now = Date.now();
        return now - entry.timestamp < entry.ttl;
    }

    /**
     * Get cache statistics
     */
    getStats(): { memorySize: number; localStorageSize: number } {
        let localStorageSize = 0;
        try {
            const keys = Object.keys(localStorage);
            keys.forEach((key) => {
                if (
                    key.startsWith("profile:") ||
                    key.startsWith("plan:") ||
                    key.startsWith("questions:") ||
                    key.startsWith("usage:") ||
                    key.startsWith("assessments:")
                ) {
                    localStorageSize++;
                }
            });
        } catch (error) {
            // Ignore
        }

        return {
            memorySize: this.memoryCache.size,
            localStorageSize,
        };
    }
}

// Singleton instance
export const cacheService = new CacheService();

/**
 * Invalidate cache when data is mutated
 */
export function invalidateUserCache(userId: string) {
    cacheService.invalidatePattern(`profile:${userId}`);
    cacheService.invalidatePattern(`questions:${userId}`);
    cacheService.invalidatePattern(`usage:${userId}`);
    cacheService.invalidatePattern(`assessments:${userId}`);
}

export function invalidatePlanCache(planId: string) {
    cacheService.invalidatePattern(`plan:${planId}`);
}

export function invalidateAllCache() {
    cacheService.clear();
}
