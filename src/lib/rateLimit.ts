/**
 * Rate limiting for LayoutForge API routes.
 * Simple in-memory rate limiter per IP address.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

/** Time window in milliseconds (1 minute). */
const WINDOW_MS = 60 * 1000;

/** Maximum requests per window. */
const MAX_REQUESTS = 10;

/**
 * Check if a request from an IP is allowed.
 * Returns { allowed, remaining } where remaining is requests left in this window.
 */
export function checkRateLimit(ip: string): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  let entry = store.get(ip);

  // Initialize or reset if window expired
  if (!entry || now >= entry.resetAt) {
    entry = {
      count: 0,
      resetAt: now + WINDOW_MS,
    };
    store.set(ip, entry);
  }

  // Increment counter
  entry.count++;

  // Calculate remaining requests
  const remaining = Math.max(0, MAX_REQUESTS - entry.count);
  const allowed = entry.count <= MAX_REQUESTS;

  return {
    allowed,
    remaining,
    resetAt: entry.resetAt,
  };
}

/**
 * Reset rate limit for a specific IP (admin use).
 */
export function resetRateLimit(ip: string): void {
  store.delete(ip);
}

/**
 * Clear all rate limits (admin use).
 */
export function clearAllRateLimits(): void {
  store.clear();
}

/**
 * Get current rate limit info for an IP (debug/admin use).
 */
export function getRateLimitInfo(ip: string):
  | {
      count: number;
      resetAt: number;
      remaining: number;
      windowExpiresIn: number;
    }
  | null {
  const entry = store.get(ip);
  if (!entry) return null;

  const now = Date.now();
  const remaining = Math.max(0, MAX_REQUESTS - entry.count);
  const windowExpiresIn = Math.max(0, entry.resetAt - now);

  return {
    count: entry.count,
    resetAt: entry.resetAt,
    remaining,
    windowExpiresIn,
  };
}

/**
 * Extract client IP from request headers.
 * Handles X-Forwarded-For, X-Real-IP, and direct connection.
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp;

  return "unknown";
}

/**
 * Cleanup old entries periodically (call from cron or manually).
 * Removes entries older than 1 hour.
 */
export function cleanupExpiredEntries(): number {
  const now = Date.now();
  const maxAge = 60 * 60 * 1000; // 1 hour
  let removed = 0;

  for (const [ip, entry] of store.entries()) {
    if (now - entry.resetAt > maxAge) {
      store.delete(ip);
      removed++;
    }
  }

  return removed;
}

export const RATE_LIMIT_CONFIG = {
  WINDOW_MS,
  MAX_REQUESTS,
} as const;
