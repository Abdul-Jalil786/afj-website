/**
 * GET  /api/admin/proposed-fixes          — list all proposed fixes
 * PUT  /api/admin/proposed-fixes          — approve or reject a fix
 *
 * Auth: CF JWT or DASHBOARD_SECRET. Management only.
 */

export const prerender = false;

import type { APIRoute } from 'astro';
import { authenticateRequest } from '../../../lib/cf-auth';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createOrUpdateFile, getFileContent } from '../../../lib/github';
import { createNotification } from '../../../lib/notifications';

const FIXES_PATH = join(process.cwd(), 'src', 'data', 'proposed-fixes.json');

interface ProposedFix {
  id: string;
  source: string;
  issueType: string;
  severity: string;
  title: string;
  description: string;
  file: string;
  currentCode: string;
  proposedCode: string;
  diffSummary: string;
  status: 'pending' | 'approved' | 'applied' | 'rejected';
  createdAt: string;
  approvedAt: string | null;
  appliedAt: string | null;
  rejectedAt: string | null;
  rejectedReason: string | null;
}

interface FixesStore {
  fixes: ProposedFix[];
}

async function readFixes(): Promise<FixesStore> {
  try {
    const raw = await readFile(FIXES_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { fixes: [] };
  }
}

async function writeFixes(store: FixesStore): Promise<void> {
  await writeFile(FIXES_PATH, JSON.stringify(store, null, 2) + '\n', 'utf-8');
}

export const GET: APIRoute = async ({ request, url }) => {
  const user = await authenticateRequest(request);
  if (!user) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const status = url.searchParams.get('status');
  const source = url.searchParams.get('source');

  const store = await readFixes();
  let fixes = store.fixes;

  if (status) fixes = fixes.filter((f) => f.status === status);
  if (source) fixes = fixes.filter((f) => f.source === source);

  // Sort newest first
  fixes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        fixes,
        counts: {
          pending: store.fixes.filter((f) => f.status === 'pending').length,
          approved: store.fixes.filter((f) => f.status === 'approved').length,
          applied: store.fixes.filter((f) => f.status === 'applied').length,
          rejected: store.fixes.filter((f) => f.status === 'rejected').length,
        },
      },
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
};

export const PUT: APIRoute = async ({ request }) => {
  const user = await authenticateRequest(request);
  if (!user) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { action, id, reason } = body;

  if (!id || !action) {
    return new Response(JSON.stringify({ success: false, error: 'id and action required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const store = await readFixes();
  const fix = store.fixes.find((f) => f.id === id);
  if (!fix) {
    return new Response(JSON.stringify({ success: false, error: 'Fix not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (action === 'approve') {
    fix.status = 'approved';
    fix.approvedAt = new Date().toISOString();
    await writeFixes(store);

    // Try to apply the fix via GitHub API
    if (fix.file && fix.file !== 'unknown' && fix.proposedCode) {
      try {
        // Read current file
        const current = await getFileContent(fix.file);
        let newContent = current.content;

        if (fix.currentCode && newContent.includes(fix.currentCode)) {
          newContent = newContent.replace(fix.currentCode, fix.proposedCode);
        } else {
          // If we can't find the exact code to replace, append as a comment
          newContent += `\n// Auto-fix applied: ${fix.title}\n${fix.proposedCode}\n`;
        }

        await createOrUpdateFile(fix.file, {
          content: newContent,
          message: `fix: ${fix.title} (auto-remediation)`,
          sha: current.sha,
        });

        fix.status = 'applied';
        fix.appliedAt = new Date().toISOString();
        await writeFixes(store);

        return new Response(
          JSON.stringify({ success: true, data: { fix, applied: true } }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      } catch (err: any) {
        // Approved but failed to apply — log and return error details
        const errorMsg = err?.message || String(err);
        console.error(`[proposed-fixes] GitHub apply failed for fix "${fix.id}" (${fix.file}):`, errorMsg);
        console.error(`[proposed-fixes] GITHUB_TOKEN set: ${!!process.env.GITHUB_TOKEN}, GITHUB_REPO set: ${!!process.env.GITHUB_REPO}`);
        return new Response(
          JSON.stringify({
            success: true,
            data: { fix, applied: false, error: `GitHub commit failed: ${errorMsg}` },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
    }

    return new Response(
      JSON.stringify({ success: true, data: { fix, applied: false } }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }

  if (action === 'reject') {
    fix.status = 'rejected';
    fix.rejectedAt = new Date().toISOString();
    fix.rejectedReason = reason || null;
    await writeFixes(store);

    return new Response(JSON.stringify({ success: true, data: { fix } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: false, error: 'Invalid action. Use approve or reject.' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
};
