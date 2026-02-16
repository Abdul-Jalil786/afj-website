export const prerender = false;

import type { APIRoute } from 'astro';
import { generateText } from '../../../lib/llm';
import { PAGE_EDIT_SYSTEM_PROMPT } from '../../../lib/prompts';
import departments from '../../../data/departments.json';
import { auditLog } from '../../../lib/audit-log';
import { getFileContent } from '../../../lib/github';
import { authenticateRequest } from '../../../lib/cf-auth';
import { validateBodySize, LARGE_MAX_BYTES } from '../../../lib/validate-body';

const ALLOWED_DEPARTMENTS = ['management', 'marketing'];

function getUserDepartment(email: string): string {
  for (const [key, dept] of Object.entries(departments)) {
    if ((dept as any).emails.includes(email)) return key;
  }
  return 'unknown'; // unrecognised email — no department privileges
}

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

  // Role-based permission: only management and marketing can edit pages
  if (userEmail !== 'api-client') {
    const dept = getUserDepartment(userEmail);
    if (!ALLOWED_DEPARTMENTS.includes(dept)) {
      return new Response(
        JSON.stringify({ error: 'You do not have permission to edit pages' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } },
      );
    }
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
    let currentContent: string;
    let fileSha: string;
    try {
      const file = await getFileContent(pagePath);
      currentContent = file.content;
      fileSha = file.sha;
    } catch {
      return new Response(
        JSON.stringify({ error: 'The requested page could not be found or accessed' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Send to LLM with page content and instruction
    const userMessage = [
      `Page: ${pagePath}`,
      `\nInstruction: ${instruction}`,
      `\nCurrent content:\n\`\`\`\n${currentContent}\n\`\`\``,
    ].join('\n');

    const proposedChanges = await generateText(PAGE_EDIT_SYSTEM_PROMPT, userMessage, 4096);

    await auditLog(userEmail, 'page-edit-preview', { pagePath, instruction });

    return new Response(
      JSON.stringify({
        success: true,
        currentContent,
        proposedContent: proposedChanges,
        fileSha,
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
