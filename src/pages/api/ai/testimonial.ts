export const prerender = false;

import type { APIRoute } from 'astro';
import { generateText } from '../../../lib/llm';
import { TESTIMONIAL_SYSTEM_PROMPT } from '../../../lib/prompts';
import { authenticateRequest } from '../../../lib/cf-auth';
import { validateBodySize } from '../../../lib/validate-body';

export const POST: APIRoute = async ({ request }) => {
  const sizeError = await validateBodySize(request);
  if (sizeError) return sizeError;

  const userEmail = await authenticateRequest(request);
  if (!userEmail) {
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
