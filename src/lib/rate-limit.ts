import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';

const rateLimiter = new RateLimiterMemory({
  points: 100, // 100 requests
  duration: 60, // per 60 seconds
});

const apiRateLimiter = new RateLimiterMemory({
  points: 1000, // 1000 API calls
  duration: 3600, // per hour
});

export async function checkRateLimit(identifier: string): Promise<boolean> {
  try {
    await rateLimiter.consume(identifier);
    return true;
  } catch (e) {
    return false;
  }
}

export async function checkApiRateLimit(
  identifier: string
): Promise<RateLimiterRes | null> {
  try {
    const res = await apiRateLimiter.consume(identifier);
    return res;
  } catch (e) {
    return null;
  }
}

export function getRemainingPoints(identifier: string): number {
  const state = rateLimiter.limiterRes?.remainingPoints || 100;
  return state;
}
