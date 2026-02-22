/**
 * In-memory rate limiter for middleware (no external package).
 */

const store = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_POINTS = 100; // 100 requests per window

export async function checkRateLimit(identifier: string): Promise<boolean> {
  const now = Date.now();
  let entry = store.get(identifier);

  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
    store.set(identifier, entry);
  }

  entry.count++;
  return entry.count <= MAX_POINTS;
}

export async function checkApiRateLimit(
  identifier: string
): Promise<{ remainingPoints: number } | null> {
  const allowed = await checkRateLimit(identifier);
  return allowed ? { remainingPoints: MAX_POINTS - 1 } : null;
}

export function getRemainingPoints(identifier: string): number {
  const entry = store.get(identifier);
  if (!entry) return MAX_POINTS;
  return Math.max(0, MAX_POINTS - entry.count);
}
