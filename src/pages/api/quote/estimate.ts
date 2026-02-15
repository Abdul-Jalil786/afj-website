export const prerender = false;

import type { APIRoute } from 'astro';
import { estimateQuote } from '../../../lib/quote-engine';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { service, answers } = body;

    if (!service || !answers || typeof answers !== 'object') {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: service, answers' }),
        { status: 400, headers: JSON_HEADERS },
      );
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
