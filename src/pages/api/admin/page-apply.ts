export const prerender = false;

import type { APIRoute } from 'astro';
import { auditLog } from '../../../lib/audit-log';
import { authenticateRequest } from '../../../lib/cf-auth';
import { createOrUpdateFile } from '../../../lib/github';
import { validateBodySize, LARGE_MAX_BYTES } from '../../../lib/validate-body';

export const POST: APIRoute = async ({ request }) => {
  const sizeError = await validateBodySize(request, LARGE_MAX_BYTES);
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
    const { pagePath, content, fileSha, pageLabel } = body;

    if (!pagePath || !content || !fileSha) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: pagePath, content, fileSha' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Validate content: reject if it contains <script> tags
    const decoded = Buffer.from(content, 'base64').toString('utf-8');
    if (/<script[\s>]/i.test(decoded)) {
      return new Response(
        JSON.stringify({ error: 'Content contains disallowed script tags' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    await createOrUpdateFile(pagePath, {
      content: decoded,
      message: `page: update ${pageLabel || pagePath} (via admin dashboard)`,
      sha: fileSha,
    });

    await auditLog(userEmail, 'page-apply', { pagePath, pageLabel });

    return new Response(
      JSON.stringify({ success: true, message: `Page updated: ${pageLabel || pagePath}` }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Page apply error:', message);
    return new Response(
      JSON.stringify({ error: 'Failed to apply page change. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
