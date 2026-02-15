export const prerender = false;

import type { APIRoute } from 'astro';
import { generateText } from '../../../lib/llm';

export const POST: APIRoute = async ({ request }) => {
  const secret = import.meta.env.DASHBOARD_SECRET;

  // Auth check
  const authHeader = request.headers.get('x-dashboard-secret');
  if (!secret || authHeader !== secret) {
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
