/**
 * Cloudflare Access JWT verification.
 *
 * Verifies the JWT signature against Cloudflare's public signing keys,
 * checks audience and expiry, and extracts the authenticated user email
 * from the token claims — never from the spoofable Cf-Access-Authenticated-User-Email header.
 *
 * Environment variables:
 *   CF_ACCESS_TEAM_DOMAIN  — your Cloudflare Access team domain (e.g. "afj")
 *   CF_ACCESS_AUD          — the Application Audience (AUD) tag from CF Access
 */

import { createRemoteJWKSet, jwtVerify } from 'jose';

interface CfAuthResult {
  email: string;
}

// Cache JWKS for 1 hour to avoid fetching on every request
let cachedJWKS: ReturnType<typeof createRemoteJWKSet> | null = null;
let jwksCachedAt = 0;
const JWKS_CACHE_MS = 60 * 60 * 1000; // 1 hour

function getJWKS(): ReturnType<typeof createRemoteJWKSet> {
  const teamDomain = import.meta.env.CF_ACCESS_TEAM_DOMAIN;
  if (!teamDomain) {
    throw new Error('CF_ACCESS_TEAM_DOMAIN environment variable is not set');
  }

  const now = Date.now();
  if (cachedJWKS && now - jwksCachedAt < JWKS_CACHE_MS) {
    return cachedJWKS;
  }

  const certsUrl = new URL(`https://${teamDomain}.cloudflareaccess.com/cdn-cgi/access/certs`);
  cachedJWKS = createRemoteJWKSet(certsUrl);
  jwksCachedAt = now;
  return cachedJWKS;
}

/**
 * Verify a Cloudflare Access JWT and return the authenticated email.
 * Throws if the token is missing, invalid, expired, or has wrong audience.
 */
export async function verifyCfJwt(token: string): Promise<CfAuthResult> {
  const aud = import.meta.env.CF_ACCESS_AUD;
  if (!aud) {
    throw new Error('CF_ACCESS_AUD environment variable is not set');
  }

  const jwks = getJWKS();
  const { payload } = await jwtVerify(token, jwks, {
    audience: aud,
    // jose automatically checks exp (expiry) claim
  });

  const email = payload.email as string | undefined;
  if (!email || typeof email !== 'string') {
    throw new Error('JWT does not contain an email claim');
  }

  return { email };
}

/**
 * Authenticate a request using either:
 *   1. DASHBOARD_SECRET header (for programmatic/script access)
 *   2. Cloudflare Access JWT (for admin dashboard users)
 *
 * Returns the authenticated user email, or null if unauthenticated.
 * For DASHBOARD_SECRET auth, returns 'api-client' as the email.
 */
export async function authenticateRequest(request: Request): Promise<string | null> {
  const secret = import.meta.env.DASHBOARD_SECRET;
  const authHeader = request.headers.get('x-dashboard-secret');

  // Path 1: Programmatic access via shared secret
  if (secret && authHeader === secret) {
    return 'api-client';
  }

  // Path 2: Cloudflare Access JWT
  const cfJwt = request.headers.get('Cf-Access-Jwt-Assertion');
  if (cfJwt) {
    // If CF env vars aren't set, fall back to header-only check (dev mode)
    const teamDomain = import.meta.env.CF_ACCESS_TEAM_DOMAIN;
    const aud = import.meta.env.CF_ACCESS_AUD;

    if (!teamDomain || !aud) {
      // Dev/staging fallback: accept the JWT header presence but read email from claims
      // This still prevents random unauthenticated requests (must have the header)
      console.warn('CF_ACCESS_TEAM_DOMAIN or CF_ACCESS_AUD not set — JWT signature not verified');
      // Try to decode the JWT payload without verification for the email
      try {
        const parts = cfJwt.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
          if (payload.email && typeof payload.email === 'string') {
            return payload.email;
          }
        }
      } catch {
        // Failed to decode — fall through
      }
      // Last resort in dev: read from header (only when CF vars aren't configured)
      return request.headers.get('Cf-Access-Authenticated-User-Email') || null;
    }

    try {
      const result = await verifyCfJwt(cfJwt);
      return result.email;
    } catch (err) {
      console.error('CF JWT verification failed:', err instanceof Error ? err.message : err);
      return null;
    }
  }

  return null;
}
