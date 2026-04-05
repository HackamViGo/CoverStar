/**
 * Simple in-memory rate limiter.
 * Uses Date.now() → compatible with jest.useFakeTimers().
 */

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60_000; // 1 minute

/**
 * @param ip          Identifier (IP address, user ID, etc.)
 * @param maxRequests Max allowed requests per window (default 5)
 * @returns true if allowed, false if rate-limited
 */
export function checkRateLimit(ip: string, maxRequests = 5): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  // First request OR window expired → start fresh
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false; // Rate limited
  }

  entry.count++;
  return true;
}

/** Reset all rate limit entries — for use in tests */
export function resetRateLimits(): void {
  rateLimitMap.clear();
}
