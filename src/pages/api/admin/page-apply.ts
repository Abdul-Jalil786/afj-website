export const prerender = false;

import type { APIRoute } from 'astro';
import { auditLog } from '../../../lib/audit-log';

export const POST: APIRoute = async ({ request }) => {
  const secret = import.meta.env.DASHBOARD_SECRET;
  const githubToken = import.meta.env.GITHUB_TOKEN;
  const githubRepo = import.meta.env.GITHUB_REPO;

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

  if (!githubToken || !githubRepo) {
    return new Response(
      JSON.stringify({ error: 'GitHub credentials not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
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

    // Commit the file to GitHub
    const response = await fetch(
      `https://api.github.com/repos/${githubRepo}/contents/${pagePath}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `page: update ${pageLabel || pagePath} (via admin dashboard)`,
          content,
          sha: fileSha,
          branch: 'main',
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      return new Response(
        JSON.stringify({ error: 'GitHub API error', details: (errorData as any).message }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } },
      );
    }

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
