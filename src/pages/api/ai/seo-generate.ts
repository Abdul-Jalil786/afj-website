export const prerender = false;

import type { APIRoute } from 'astro';
import { generateText } from '../../../lib/llm';
import { authenticateRequest } from '../../../lib/cf-auth';
import { validateBodySize } from '../../../lib/validate-body';

const SEO_META_SYSTEM_PROMPT = `You are an SEO specialist for AFJ Limited, a UK transport company (SEND school transport, non-emergency patient transport, private hire, fleet services). Generate optimised meta titles and descriptions.

Rules:
- Meta title: max 60 characters, include primary keyword near start, include "AFJ Limited" or "AFJ" where space allows
- Meta description: 150-160 characters, compelling call-to-action, include location keywords where relevant
- Keywords: 5-8 relevant long-tail keywords for the page
- Use British English spelling (organisation, specialised, etc.)
- Never use filler phrases like "In today's fast-paced world"
- Focus on: trust signals, specific numbers, local relevance (Birmingham, Manchester, West Midlands)

Return ONLY valid JSON in this exact format (no markdown fences):
{"title":"...","description":"...","keywords":["...",  "..."]}`;

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
    const { pageUrl, pageContent, currentTitle, currentDescription } = body;

    if (!pageUrl && !pageContent) {
      return new Response(
        JSON.stringify({ error: 'Provide either pageUrl or pageContent' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const userMessage = [
      pageUrl ? `Page URL: ${pageUrl}` : null,
      currentTitle ? `Current title: ${currentTitle}` : null,
      currentDescription ? `Current description: ${currentDescription}` : null,
      pageContent ? `Page content:\n${pageContent.slice(0, 3000)}` : null,
    ].filter(Boolean).join('\n\n');

    const raw = await generateText(SEO_META_SYSTEM_PROMPT, userMessage, 512);

    // Parse JSON from LLM response (strip markdown fences if present)
    const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const result = JSON.parse(cleaned);

    return new Response(
      JSON.stringify({
        success: true,
        title: result.title || '',
        description: result.description || '',
        keywords: Array.isArray(result.keywords) ? result.keywords : [],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('SEO generate error:', message);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'SEO generation is temporarily unavailable. Please try again.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
