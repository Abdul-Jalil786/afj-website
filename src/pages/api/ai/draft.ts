export const prerender = false;

import type { APIRoute } from 'astro';
import { generateText } from '../../../lib/llm';
import { BLOG_DRAFT_SYSTEM_PROMPT } from '../../../lib/prompts';

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
    const { title, keyPoints, category, department } = body;

    if (!title || !keyPoints) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: title, keyPoints' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const userMessage = [
      `Title: ${title}`,
      category ? `Category: ${category}` : null,
      department ? `Department: ${department}` : null,
      `Key points to cover:\n${keyPoints}`,
      `Today's date: ${new Date().toISOString().split('T')[0]}`,
    ].filter(Boolean).join('\n\n');

    const draft = await generateText(BLOG_DRAFT_SYSTEM_PROMPT, userMessage, 4096);

    return new Response(
      JSON.stringify({ success: true, draft }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('AI draft error:', message);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'AI drafting is temporarily unavailable. You can still write your content manually.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
