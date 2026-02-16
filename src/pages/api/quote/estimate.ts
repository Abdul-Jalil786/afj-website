export const prerender = false;

import type { APIRoute } from 'astro';
import { estimateQuote } from '../../../lib/quote-engine';
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '../../../lib/rate-limit';
import { validateBodySize } from '../../../lib/validate-body';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export const POST: APIRoute = async ({ request }) => {
  // Rate limit: 30 requests per IP per 15 minutes
  const rateCheck = checkRateLimit(request, 'quote', RATE_LIMITS.quote);
  if (!rateCheck.allowed) return rateLimitResponse(rateCheck.resetAt);

  const sizeError = await validateBodySize(request);
  if (sizeError) return sizeError;

  try {
    const body = await request.json();
    const { service, answers } = body;

    if (!service || !answers || typeof answers !== 'object') {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: service, answers' }),
        { status: 400, headers: JSON_HEADERS },
      );
    }

    // Validate service is a known key
    const validServices = ['private-hire', 'airport', 'send', 'nepts', 'executive', 'fleet'];
    if (typeof service !== 'string' || !validServices.includes(service)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid service type' }),
        { status: 400, headers: JSON_HEADERS },
      );
    }

    // Validate answer values are strings and not excessively long
    for (const [key, val] of Object.entries(answers)) {
      if (typeof val !== 'string') {
        return new Response(
          JSON.stringify({ success: false, error: `Answer "${key}" must be a string` }),
          { status: 400, headers: JSON_HEADERS },
        );
      }
      if ((val as string).length > 200) {
        return new Response(
          JSON.stringify({ success: false, error: `Answer "${key}" exceeds maximum length` }),
          { status: 400, headers: JSON_HEADERS },
        );
      }
    }

    const estimate = await estimateQuote(service, answers);

    return new Response(
      JSON.stringify({ success: true, estimate }),
      { status: 200, headers: JSON_HEADERS },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 400, headers: JSON_HEADERS },
    );
  }
};
