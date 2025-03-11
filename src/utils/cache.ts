import { CacheEntry } from '../types.js';

export class Cache<T> {
  private cache: Map<string, CacheEntry<T>>;
  private ttl: number;

  constructor(ttlMs: number = 5 * 60 * 1000) { // Default 5 minutes
    this.cache = new Map();
    this.ttl = ttlMs;
  }

  set(key: string, value: T): void {
    this.cache.set(key, {
      data: value,
      timestamp: Date.now()
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  prune(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

export class RateLimiter {
  private windowMs: number;
  private maxRequests: number;
  private requests: number;
  private resetTime: number;

  constructor(maxRequests: number = 45, windowMs: number = 60000) { // Default: 45 requests per minute
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.requests = 0;
    this.resetTime = Date.now() + windowMs;
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    if (now >= this.resetTime) {
      this.requests = 0;
      this.resetTime = now + this.windowMs;
    }

    return this.requests < this.maxRequests;
  }

  incrementRequests(): void {
    this.requests++;
  }

  getRemainingRequests(): number {
    const now = Date.now();
    if (now >= this.resetTime) {
      this.requests = 0;
      this.resetTime = now + this.windowMs;
    }
    return Math.max(0, this.maxRequests - this.requests);
  }

  getTimeToReset(): number {
    return Math.max(0, this.resetTime - Date.now());
  }
}