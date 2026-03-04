/**
 * Simple in-memory rate limit for admin API routes (per serverless instance).
 * Limits by IP: max 30 requests per minute. Returns null if allowed, or a 429 Response if over limit.
 */
const store = new Map<string, { count: number; resetAt: number }>();
const MAX_REQUESTS = 30;
const WINDOW_MS = 60 * 1000;

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

export function checkAdminRateLimit(request: Request): Response | null {
  const ip = getClientIp(request);
  const now = Date.now();
  let entry = store.get(ip);
  if (!entry || now >= entry.resetAt) {
    entry = { count: 1, resetAt: now + WINDOW_MS };
    store.set(ip, entry);
    return null;
  }
  entry.count++;
  if (entry.count > MAX_REQUESTS) {
    return new Response(
      JSON.stringify({ error: "Too many requests", message: "Rate limit exceeded. Try again in a minute." }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }
  return null;
}
