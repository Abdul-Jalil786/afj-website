export const prerender = false;

import type { APIRoute } from 'astro';
import { generateText } from '../../../lib/llm';
import { PAGE_EDIT_SYSTEM_PROMPT } from '../../../lib/prompts';
import departments from '../../../data/departments.json';
import { auditLog } from '../../../lib/audit-log';

const ALLOWED_DEPARTMENTS = ['management', 'marketing'];

function getUserDepartment(email: string): string {
  for (const [key, dept] of Object.entries(departments)) {
    if ((dept as any).emails.includes(email)) return key;
  }
  return 'unknown'; // unrecognised email — no department privileges
}

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

  // Role-based permission: only management and marketing can edit pages
  if (cfJwt) {
    const userEmail = request.headers.get('Cf-Access-Authenticated-User-Email') || '';
    const dept = getUserDepartment(userEmail);
    if (!ALLOWED_DEPARTMENTS.includes(dept)) {
      return new Response(
        JSON.stringify({ error: 'You do not have permission to edit pages' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } },
      );
    }
  }

  if (!githubToken || !githubRepo) {
    return new Response(
      JSON.stringify({ error: 'GitHub credentials not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  try {
    const body = await request.json();
    const { pagePath, instruction } = body;

    if (!pagePath || !instruction) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: pagePath, instruction' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Fetch current file content from GitHub
    const fileUrl = `https://api.github.com/repos/${githubRepo}/contents/${pagePath}`;
    const ghResponse = await fetch(fileUrl, {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!ghResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'The requested page could not be found or accessed' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const ghData = await ghResponse.json();
    const currentContent = Buffer.from(ghData.content, 'base64').toString('utf-8');

    // Send to LLM with page content and instruction
    const userMessage = [
      `Page: ${pagePath}`,
      `\nInstruction: ${instruction}`,
      `\nCurrent content:\n\`\`\`\n${currentContent}\n\`\`\``,
    ].join('\n');

    const proposedChanges = await generateText(PAGE_EDIT_SYSTEM_PROMPT, userMessage, 4096);

    const editUserEmail = request.headers.get('Cf-Access-Authenticated-User-Email') || 'api-client';
    await auditLog(editUserEmail, 'page-edit-preview', { pagePath, instruction });

    return new Response(
      JSON.stringify({
        success: true,
        currentContent,
        proposedContent: proposedChanges,
        fileSha: ghData.sha,
        pagePath,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Page edit error:', message);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'AI drafting is temporarily unavailable. You can still write your content manually.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
