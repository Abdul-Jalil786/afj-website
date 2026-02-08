import { NextRequest, NextResponse } from "next/server";

// Simple in-memory rate limiter using token bucket approach
const rateLimit = new Map<string, { tokens: number; lastRefill: number }>();

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

// Periodically clean up stale entries to prevent memory leaks
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
let lastCleanup = Date.now();

function cleanupRateLimit() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, value] of rateLimit.entries()) {
    if (now - value.lastRefill > RATE_LIMIT_WINDOW_MS * 2) {
      rateLimit.delete(key);
    }
  }
}

function isRateLimited(ip: string): boolean {
  cleanupRateLimit();

  const now = Date.now();
  const entry = rateLimit.get(ip);

  if (!entry) {
    rateLimit.set(ip, { tokens: RATE_LIMIT_MAX - 1, lastRefill: now });
    return false;
  }

  // Refill tokens based on elapsed time
  const elapsed = now - entry.lastRefill;
  const refill = Math.floor(
    (elapsed / RATE_LIMIT_WINDOW_MS) * RATE_LIMIT_MAX
  );

  if (refill > 0) {
    entry.tokens = Math.min(RATE_LIMIT_MAX, entry.tokens + refill);
    entry.lastRefill = now;
  }

  if (entry.tokens <= 0) {
    return true;
  }

  entry.tokens -= 1;
  return false;
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /studio route in production
  if (pathname.startsWith("/studio")) {
    const isDevEnv = process.env.NODE_ENV === "development";
    const hasStudioToken = !!process.env.STUDIO_ACCESS_TOKEN;

    if (!isDevEnv && !hasStudioToken) {
      const url = request.nextUrl.clone();
      url.pathname = "/not-found";
      return NextResponse.rewrite(url);
    }
  }

  // Rate limit API routes
  if (pathname.startsWith("/api/contact") || pathname.startsWith("/api/booking")) {
    const ip = getClientIp(request);

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }
  }

  // Add security headers as fallback to all responses
  const response = NextResponse.next();

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  return response;
}

export const config = {
  matcher: [
    "/api/contact/:path*",
    "/api/booking/:path*",
    "/studio/:path*",
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
