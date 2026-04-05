/**
 * Simple, testable rate limiter.
 * Higher performance for this scale and fully compatible with Jest fakeTimers.
 */
type RateEntry = { count: number; lastReset: number };
const limits = new Map<string, RateEntry>();

const WINDOW_MS = 60_000; // 1 minute

/**
 * Checks if a request from a given IP is allowed based on a rate limit.
 * @param ip The identifier (usually IP address)
 * @param max Max allowed requests in the window
 */
export function checkRateLimit(ip: string, max = 5): boolean {
  const now = Date.now();
  let entry = limits.get(ip);
  
  // If entry doesn't exist or window expired, reset
  if (!entry || (now - entry.lastReset >= WINDOW_MS)) {
    entry = { count: 0, lastReset: now };
  }
  
  if (entry.count >= max) {
    return false;
  }
  
  entry.count++;
  limits.set(ip, entry);
  return true;
}

/**
 * Reset all rate limit entries — primarily for testing.
 */
export function resetRateLimits(): void {
  limits.clear();
}
