export const prerender = false;

import type { APIRoute } from 'astro';
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '../../../lib/rate-limit';
import complianceData from '../../../data/compliance.json';

export const GET: APIRoute = async ({ request }) => {
  const rateCheck = checkRateLimit(request, 'compliance', RATE_LIMITS.quote);
  if (!rateCheck.allowed) return rateLimitResponse(rateCheck.resetAt);

  return new Response(
    JSON.stringify({
      success: true,
      data: complianceData,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
      },
    },
  );
};
