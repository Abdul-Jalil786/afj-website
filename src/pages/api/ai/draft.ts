export const prerender = false;

import type { APIRoute } from 'astro';
import { generateText } from '../../../lib/llm';
import { BLOG_DRAFT_SYSTEM_PROMPT } from '../../../lib/prompts';
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
