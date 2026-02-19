/**
 * GET  /api/admin/proposed-fixes          — list all proposed fixes
 * PUT  /api/admin/proposed-fixes          — dismiss a fix
 *
 * Auth: CF JWT or DASHBOARD_SECRET. Management only.
 */

export const prerender = false;

import type { APIRoute } from 'astro';
import { authenticateRequest } from '../../../lib/cf-auth';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const FIXES_PATH = join(process.cwd(), 'src', 'data', 'proposed-fixes.json');

interface ProposedFix {
  id: string;
  source: string;
  issueType: string;
  severity: string;
  title: string;
  description: string;
  claudeCodePrompt: string;
  status: 'pending' | 'dismissed' | 'resolved';
  createdAt: string;
  resolvedAt?: string | null;
  dismissedAt?: string | null;
  dismissedReason?: string | null;
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
          resolved: store.fixes.filter((f) => f.status === 'resolved').length,
          dismissed: store.fixes.filter((f) => f.status === 'dismissed').length,
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

  if (!action) {
    return new Response(JSON.stringify({ success: false, error: 'action required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const store = await readFixes();

  if (action === 'dismiss-all') {
    const now = new Date().toISOString();
    const dismissReason = reason || 'Bulk dismissed';
    let count = 0;
    for (const f of store.fixes) {
      if (f.status === 'pending') {
        f.status = 'dismissed';
        (f as any).dismissedAt = now;
        (f as any).dismissedReason = dismissReason;
        count++;
      }
    }
    await writeFixes(store);
    return new Response(JSON.stringify({ success: true, data: { dismissed: count } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!id) {
    return new Response(JSON.stringify({ success: false, error: 'id required for this action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const fix = store.fixes.find((f) => f.id === id);
  if (!fix) {
    return new Response(JSON.stringify({ success: false, error: 'Fix not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (action === 'dismiss') {
    fix.status = 'dismissed';
    (fix as any).dismissedAt = new Date().toISOString();
    (fix as any).dismissedReason = reason || null;
    await writeFixes(store);

    return new Response(JSON.stringify({ success: true, data: { fix } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: false, error: 'Invalid action. Use dismiss or dismiss-all.' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
};
