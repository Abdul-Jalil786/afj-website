/**
 * Simple in-memory rate limiter for API endpoints.
 *
 * Tracks requests by IP address with configurable window and max requests.
 * Old entries are cleaned up every 10 minutes to prevent memory leaks.
 *
 * Note: This is an application-level rate limit. Cloudflare rate limiting
 * should also be configured as the first layer of defence.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 10 minutes
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}

/**
 * Extract client IP from request headers.
 * Checks x-forwarded-for (standard proxy header), then cf-connecting-ip (Cloudflare).
 */
function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // Take the first IP in the chain (original client)
    return forwarded.split(',')[0].trim();
  }
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp;
  return 'unknown';
}

interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check if a request is within the rate limit.
 *
 * @param request - The incoming HTTP request
 * @param endpoint - A unique identifier for the endpoint (used as part of the key)
 * @param config - Rate limit configuration
 * @returns Whether the request is allowed and remaining quota
 */
export function checkRateLimit(
  request: Request,
  endpoint: string,
  config: RateLimitConfig,
): RateLimitResult {
  cleanup();

  const ip = getClientIp(request);
  const key = `${endpoint}:${ip}`;
  const now = Date.now();

  const existing = store.get(key);

  if (!existing || now > existing.resetAt) {
    // New window
    const entry: RateLimitEntry = {
      count: 1,
      resetAt: now + config.windowMs,
    };
    store.set(key, entry);
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: entry.resetAt };
  }

  // Existing window
  existing.count++;
  if (existing.count > config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - existing.count,
    resetAt: existing.resetAt,
  };
}

/**
 * Create a 429 Too Many Requests response.
 */
export function rateLimitResponse(resetAt: number): Response {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
  return new Response(
    JSON.stringify({ error: 'Too many requests. Please try again later.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(Math.max(retryAfter, 1)),
      },
    },
  );
}

// Pre-configured rate limit settings
export const RATE_LIMITS = {
  contact: { maxRequests: 5, windowMs: 15 * 60 * 1000 },    // 5 per 15 min
  quoteRequest: { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 per 15 min
  quote: { maxRequests: 30, windowMs: 15 * 60 * 1000 },      // 30 per 15 min
  chatPerMinute: { maxRequests: 5, windowMs: 60 * 1000 },    // 5 per IP per minute
  chatPerHour: { maxRequests: 30, windowMs: 60 * 60 * 1000 }, // 30 per IP per hour
} as const;
