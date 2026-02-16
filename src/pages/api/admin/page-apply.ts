export const prerender = false;

import type { APIRoute } from 'astro';
import { auditLog } from '../../../lib/audit-log';
import { createOrUpdateFile } from '../../../lib/github';

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

  const userEmail = request.headers.get('Cf-Access-Authenticated-User-Email') || 'admin@afjltd.co.uk';

  try {
    const body = await request.json();
    const { pagePath, content, fileSha, pageLabel } = body;

    if (!pagePath || !content || !fileSha) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: pagePath, content, fileSha' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Content is already base64-encoded from the client; decode for the shared helper
    const decoded = Buffer.from(content, 'base64').toString('utf-8');
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
