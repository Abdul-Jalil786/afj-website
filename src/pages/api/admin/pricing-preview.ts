export const prerender = false;

import type { APIRoute } from 'astro';
import { estimateQuote } from '../../../lib/quote-engine';
import { authenticateRequest } from '../../../lib/cf-auth';
import { validateBodySize } from '../../../lib/validate-body';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

/**
 * POST /api/admin/pricing-preview
 * Admin-only endpoint that calculates a quote with config overrides.
 * Used for live preview of unsaved pricing changes.
 * Does NOT log to quote-log.jsonl or count against rate limits.
 */
export const POST: APIRoute = async ({ request }) => {
  const sizeError = await validateBodySize(request);
  if (sizeError) return sizeError;

  const userEmail = await authenticateRequest(request);
  if (!userEmail) {
    return new Response(JSON.stringify({ error: 'Unauthorised' }), { status: 401, headers: JSON_HEADERS });
  }

  try {
    const body = await request.json();
    const { service, answers, configOverrides } = body;

    if (!service || !answers || typeof answers !== 'object') {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: service, answers' }),
        { status: 400, headers: JSON_HEADERS },
      );
    }

    const estimate = await estimateQuote(service, answers, configOverrides || undefined);

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
