/**
 * In-memory rate limiter
 * Limits requests per IP per endpoint per time window
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Map: `${ip}:${key}` -> entry
const store = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Array.from(store.entries()).forEach(([key, entry]) => {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  });
}, 5 * 60 * 1000);

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check and increment rate limit counter
 * @param ip - Client IP address
 * @param key - Identifier for the endpoint/action
 * @param limit - Max requests allowed
 * @param windowMs - Time window in milliseconds
 */
export function checkRateLimit(
  ip: string,
  key: string,
  limit: number = 10,
  windowMs: number = 60 * 1000 // 1 minute default
): RateLimitResult {
  const mapKey = `${ip}:${key}`;
  const now = Date.now();

  let entry = store.get(mapKey);

  if (!entry || entry.resetAt < now) {
    // New window
    entry = { count: 1, resetAt: now + windowMs };
    store.set(mapKey, entry);
    return { success: true, remaining: limit - 1, resetAt: entry.resetAt };
  }

  entry.count++;

  if (entry.count > limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { success: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

/**
 * Get client IP from request headers
 * Handles Azure App Service / proxy headers
 */
export function getClientIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    headers.get('cf-connecting-ip') ||
    'unknown'
  );
}
