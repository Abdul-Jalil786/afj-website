export const prerender = false;

import type { APIRoute } from 'astro';
import complianceData from '../../../data/compliance.json';

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
    const { items } = body;

    if (!items || !Array.isArray(items)) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: items' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Build updated compliance JSON
    const updated = {
      lastUpdated: new Date().toISOString().split('T')[0],
      items: complianceData.items.map((existing) => {
        const update = items.find((u: any) => u.id === existing.id);
        if (update) {
          return {
            ...existing,
            value: update.value || existing.value,
            detail: update.detail || existing.detail,
            status: update.status || existing.status,
          };
        }
        return existing;
      }),
    };

    // Push to GitHub via API
    const githubToken = import.meta.env.GITHUB_TOKEN;
    const githubRepo = import.meta.env.GITHUB_REPO;

    if (!githubToken || !githubRepo) {
      return new Response(
        JSON.stringify({ error: 'GitHub credentials not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const filePath = 'src/data/compliance.json';
    const content = JSON.stringify(updated, null, 2) + '\n';
    const encoded = Buffer.from(content).toString('base64');

    // Get current file SHA
    const getRes = await fetch(`https://api.github.com/repos/${githubRepo}/contents/${filePath}`, {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    let sha = '';
    if (getRes.ok) {
      const fileData = await getRes.json();
      sha = fileData.sha;
    }

    // Update file
    const putRes = await fetch(`https://api.github.com/repos/${githubRepo}/contents/${filePath}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `chore: update compliance data (${updated.lastUpdated})`,
        content: encoded,
        sha,
      }),
    });

    if (!putRes.ok) {
      const errData = await putRes.json().catch(() => ({}));
      throw new Error(`GitHub API error: ${(errData as any).message || putRes.statusText}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Compliance update error:', message);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to save compliance data. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
