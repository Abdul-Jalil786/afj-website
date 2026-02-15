export const prerender = false;

import type { APIRoute } from 'astro';
import { generateText } from '../../../lib/llm';
import { TESTIMONIAL_SYSTEM_PROMPT } from '../../../lib/prompts';

export const POST: APIRoute = async ({ request }) => {
  const secret = import.meta.env.DASHBOARD_SECRET;

  // Auth: accept either DASHBOARD_SECRET header or Cloudflare Access JWT
  const authHeader = request.headers.get('x-dashboard-secret');
  const cfJwt = request.headers.get('Cf-Access-Jwt-Assertion');
  if ((!secret || authHeader !== secret) && !cfJwt) {
    return new Response(JSON.stringify({ error: 'Unauthorised' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { rawFeedback, clientName, serviceCategory } = body;

    if (!rawFeedback) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: rawFeedback' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const userMessage = [
      `Raw customer feedback:`,
      rawFeedback,
      clientName ? `\nCustomer name/role: ${clientName}` : null,
      serviceCategory ? `Service category: ${serviceCategory}` : null,
    ].filter(Boolean).join('\n');

    const result = await generateText(TESTIMONIAL_SYSTEM_PROMPT, userMessage, 2048);

    return new Response(
      JSON.stringify({ success: true, result }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('AI testimonial error:', message);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'AI generation is temporarily unavailable. You can still write your testimonial manually.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
