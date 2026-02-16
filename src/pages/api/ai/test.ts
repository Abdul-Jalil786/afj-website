export const prerender = false;

import type { APIRoute } from 'astro';
import { generateText } from '../../../lib/llm';
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
    const { prompt } = body;

    if (!prompt || typeof prompt !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing required field: prompt' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const result = await generateText(
      'You are a helpful assistant for AFJ Limited, a Birmingham-based transport company.',
      prompt,
    );

    return new Response(
      JSON.stringify({ success: true, data: { response: result } }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: 'AI drafting is temporarily unavailable. You can still write your content manually.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
