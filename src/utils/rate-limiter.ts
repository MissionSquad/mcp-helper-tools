import { McpToolError } from './errors.js';
import { ErrorCode } from '@modelcontextprotocol/sdk/types.js';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  errorMessage?: string;
}

export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private readonly errorMessage: string;

  constructor(config: RateLimitConfig) {
    this.maxRequests = config.maxRequests;
    this.windowMs = config.windowMs;
    this.errorMessage = config.errorMessage || 'Rate limit exceeded. Please try again later.';
  }

  checkLimit(key: string): void {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    
    // Remove expired timestamps
    const validTimestamps = timestamps.filter(time => now - time < this.windowMs);
    
    if (validTimestamps.length >= this.maxRequests) {
      const oldestRequest = validTimestamps[0];
      const resetTime = Math.ceil((oldestRequest + this.windowMs - now) / 1000);
      
      throw new McpToolError(
        ErrorCode.InternalError,
        this.errorMessage,
        { resetInSeconds: resetTime }
      );
    }

    // Add current request
    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);
  }

  async withRateLimit<T>(key: string, operation: () => Promise<T>): Promise<T> {
    this.checkLimit(key);
    return operation();
  }

  getRemainingRequests(key: string): number {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    const validTimestamps = timestamps.filter(time => now - time < this.windowMs);
    return Math.max(0, this.maxRequests - validTimestamps.length);
  }

  getTimeToReset(key: string): number {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    const validTimestamps = timestamps.filter(time => now - time < this.windowMs);
    
    if (validTimestamps.length === 0) {
      return 0;
    }

    return Math.max(0, validTimestamps[0] + this.windowMs - now);
  }

  // Clean up expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, timestamps] of this.requests.entries()) {
      const validTimestamps = timestamps.filter(time => now - time < this.windowMs);
      if (validTimestamps.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validTimestamps);
      }
    }
  }
}

// Create rate limiters for different tool categories
export const systemRateLimiter = new RateLimiter({
  maxRequests: 100,
  windowMs: 60 * 1000, // 1 minute
  errorMessage: 'Too many system operations. Please try again in a moment.'
});

export const networkRateLimiter = new RateLimiter({
  maxRequests: 50,
  windowMs: 60 * 1000,
  errorMessage: 'Too many network operations. Please try again in a moment.'
});

export const geoRateLimiter = new RateLimiter({
  maxRequests: 45,
  windowMs: 60 * 1000,
  errorMessage: 'IP-API rate limit exceeded. Please try again in a moment.'
});

// Clean up expired rate limit entries every minute
setInterval(() => {
  systemRateLimiter.cleanup();
  networkRateLimiter.cleanup();
  geoRateLimiter.cleanup();
}, 60 * 1000);