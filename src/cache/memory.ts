import { createLogger } from '../logger.js';
import { config } from '../config.js';

const logger = createLogger('cache');

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private ttlMs: number;

  constructor(ttlSeconds = config.cache.ttlSeconds) {
    this.ttlMs = ttlSeconds * 1000;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      logger.debug({ key }, 'Cache miss');
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      logger.debug({ key }, 'Cache expired');
      this.cache.delete(key);
      return null;
    }

    logger.debug({ key }, 'Cache hit');
    return entry.data;
  }

  set<T>(key: string, data: T, ttlMs?: number): void {
    const expiresAt = Date.now() + (ttlMs || this.ttlMs);
    this.cache.set(key, { data, expiresAt });
    logger.debug({ key, expiresAt }, 'Cache set');
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired entries periodically
  startCleanup(intervalMs = 60000): void {
    setInterval(() => {
      const now = Date.now();
      let cleaned = 0;

      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expiresAt) {
          this.cache.delete(key);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        logger.debug({ cleaned }, 'Cleaned expired cache entries');
      }
    }, intervalMs);
  }
}

// Global cache instance
export const cache = new MemoryCache();