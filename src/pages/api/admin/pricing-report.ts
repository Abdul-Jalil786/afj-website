export const prerender = false;

import type { APIRoute } from 'astro';
import departments from '../../../data/departments.json';
import { updateFileContent, getFileContent } from '../../../lib/github';
import { authenticateRequest } from '../../../lib/cf-auth';

const PRICING_ROLES = ['management'];
const REPORT_PATH = 'src/data/reports/pricing-report.json';

function getUserDepartment(email: string): string {
  for (const [key, dept] of Object.entries(departments)) {
    if ((dept as any).emails.includes(email)) return key;
  }
  return 'unknown';
}

const JSON_HEADERS = { 'Content-Type': 'application/json' };

/**
 * GET /api/admin/pricing-report — returns the latest pricing intelligence report.
 */
export const GET: APIRoute = async ({ request }) => {
  const userEmail = await authenticateRequest(request);
  if (!userEmail) {
    return new Response(JSON.stringify({ error: 'Unauthorised' }), { status: 401, headers: JSON_HEADERS });
  }

  if (userEmail !== 'api-client') {
    const dept = getUserDepartment(userEmail);
    if (!PRICING_ROLES.includes(dept)) {
      return new Response(JSON.stringify({ error: 'Access denied' }), { status: 403, headers: JSON_HEADERS });
    }
  }

  try {
    // Read report from local file (faster than GitHub API)
    const { readFile } = await import('node:fs/promises');
    const { join } = await import('node:path');
    const reportPath = join(process.cwd(), REPORT_PATH);
    const raw = await readFile(reportPath, 'utf-8');
    const report = JSON.parse(raw);

    return new Response(JSON.stringify({ success: true, report }), {
      status: 200,
      headers: JSON_HEADERS,
    });
  } catch {
    return new Response(JSON.stringify({ success: true, report: null }), {
      status: 200,
      headers: JSON_HEADERS,
    });
  }
};

/**
 * PUT /api/admin/pricing-report — update recommendation status (approve/reject).
 * Body: { recommendationId: string, action: 'approve' | 'reject', reason?: string }
 */
export const PUT: APIRoute = async ({ request }) => {
  const userEmail = await authenticateRequest(request);
  if (!userEmail) {
    return new Response(JSON.stringify({ error: 'Unauthorised' }), { status: 401, headers: JSON_HEADERS });
  }

  if (userEmail !== 'api-client') {
    const dept = getUserDepartment(userEmail);
    if (!PRICING_ROLES.includes(dept)) {
      return new Response(JSON.stringify({ error: 'Access denied' }), { status: 403, headers: JSON_HEADERS });
    }
  }

  try {
    const body = await request.json();
    const { recommendationId, action, reason } = body;

    if (!recommendationId || !['approve', 'reject'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: recommendationId and action (approve|reject) required' }),
        { status: 400, headers: JSON_HEADERS },
      );
    }

    // Read current report
    const { readFile, writeFile } = await import('node:fs/promises');
    const { join } = await import('node:path');
    const reportPath = join(process.cwd(), REPORT_PATH);
    const raw = await readFile(reportPath, 'utf-8');
    const report = JSON.parse(raw);

    // Find and update the recommendation
    const rec = report.recommendations?.find((r: any) => r.id === recommendationId);
    if (!rec) {
      return new Response(
        JSON.stringify({ error: 'Recommendation not found' }),
        { status: 404, headers: JSON_HEADERS },
      );
    }

    rec.status = action === 'approve' ? 'approved' : 'rejected';
    rec.actionBy = userEmail;
    rec.actionAt = new Date().toISOString();
    if (reason) rec.rejectReason = reason;

    // Check if all recommendations have been actioned
    const allActioned = report.recommendations.every(
      (r: any) => r.status === 'approved' || r.status === 'rejected',
    );
    if (allActioned) report.status = 'reviewed';

    // Save locally
    await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf-8');

    // Also commit to GitHub for persistence
    const content = JSON.stringify(report, null, 2) + '\n';
    await updateFileContent(
      REPORT_PATH,
      content,
      `chore: ${action} pricing recommendation ${recommendationId}`,
    ).catch((err: Error) => {
      console.error('GitHub commit failed for report update:', err.message);
    });

    return new Response(JSON.stringify({ success: true, action, recommendationId }), {
      status: 200,
      headers: JSON_HEADERS,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Pricing report update error:', message);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to update report' }),
      { status: 500, headers: JSON_HEADERS },
    );
  }
};
