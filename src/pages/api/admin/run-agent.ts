export const prerender = false;

import type { APIRoute } from 'astro';
import { exec } from 'child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { authenticateRequest } from '../../../lib/cf-auth';
import departments from '../../../data/departments.json';

const AGENT_SCRIPTS: Record<string, string> = {
  security: 'scripts/security-agent.mjs',
  seo: 'scripts/seo-agent.mjs',
  remediation: 'scripts/remediation-agent.mjs',
  marketing: 'scripts/marketing-agent.mjs',
  competitor: 'scripts/competitor-agent.mjs',
  performance: 'scripts/performance-agent.mjs',
  pricing: 'scripts/market-research-agent.mjs',
  compliance: 'scripts/compliance-check-agent.mjs',
  meta: 'scripts/meta-agent.mjs',
};

// Files each agent writes (relative to project root)
const AGENT_FILES: Record<string, string[]> = {
  security: ['src/data/reports/security-report.json'],
  seo: ['src/data/reports/seo-report.json'],
  remediation: ['src/data/reports/remediation-report.json', 'src/data/proposed-fixes.json'],
  marketing: ['src/data/reports/marketing-report.json', 'src/data/blog-drafts.json'],
  competitor: ['src/data/reports/competitor-report.json', 'src/data/reports/competitor-hashes.json'],
  performance: ['src/data/reports/performance-report.json'],
  pricing: ['src/data/reports/pricing-report.json'],
  compliance: ['src/data/reports/compliance-check-report.json', 'src/data/reports/compliance-dedup.json', 'src/data/compliance-records.json'],
  meta: ['src/data/reports/meta-report.json'],
};

// Shared files all agents may update
const SHARED_FILES = [
  'src/data/reports/history.json',
  'src/data/notifications.json',
];

const VALID_AGENTS = Object.keys(AGENT_SCRIPTS);

// Simple in-memory lock — only one agent at a time
let runningAgent: string | null = null;
let lastRunResult: { agent: string; status: string; committedFiles?: number; error?: string; finishedAt?: string } | null = null;

function getUserDepartment(email: string): string {
  for (const [key, dept] of Object.entries(departments)) {
    if ((dept as any).emails.includes(email)) return key;
  }
  return 'unknown';
}

/** Read a local file, return its content or null if missing */
function readLocalFile(relativePath: string): string | null {
  try {
    return readFileSync(join(process.cwd(), relativePath), 'utf-8');
  } catch {
    return null;
  }
}

/** GitHub API helper for Git Trees batch commit */
function ghApi(repo: string, token: string) {
  const base = `https://api.github.com/repos/${repo}`;
  const hdrs = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  return {
    async getRef(branch: string): Promise<string> {
      const res = await fetch(`${base}/git/refs/heads/${branch}`, { headers: hdrs });
      if (!res.ok) throw new Error(`getRef failed: ${res.status}`);
      const data = await res.json();
      return (data as any).object.sha;
    },

    async createBlob(content: string): Promise<string> {
      const res = await fetch(`${base}/git/blobs`, {
        method: 'POST',
        headers: hdrs,
        body: JSON.stringify({ content: Buffer.from(content).toString('base64'), encoding: 'base64' }),
      });
      if (!res.ok) throw new Error(`createBlob failed: ${res.status}`);
      const data = await res.json();
      return (data as any).sha;
    },

    async createTree(baseTree: string, files: { path: string; sha: string }[]): Promise<string> {
      const tree = files.map(f => ({ path: f.path, mode: '100644' as const, type: 'blob' as const, sha: f.sha }));
      const res = await fetch(`${base}/git/trees`, {
        method: 'POST',
        headers: hdrs,
        body: JSON.stringify({ base_tree: baseTree, tree }),
      });
      if (!res.ok) throw new Error(`createTree failed: ${res.status}`);
      const data = await res.json();
      return (data as any).sha;
    },

    async createCommit(message: string, treeSha: string, parentSha: string): Promise<string> {
      const res = await fetch(`${base}/git/commits`, {
        method: 'POST',
        headers: hdrs,
        body: JSON.stringify({ message, tree: treeSha, parents: [parentSha] }),
      });
      if (!res.ok) throw new Error(`createCommit failed: ${res.status}`);
      const data = await res.json();
      return (data as any).sha;
    },

    async updateRef(branch: string, commitSha: string): Promise<void> {
      const res = await fetch(`${base}/git/refs/heads/${branch}`, {
        method: 'PATCH',
        headers: hdrs,
        body: JSON.stringify({ sha: commitSha }),
      });
      if (!res.ok) throw new Error(`updateRef failed: ${res.status}`);
    },
  };
}

/**
 * Batch-commit all changed report files in a single GitHub commit.
 * Uses Git Trees API: create blobs → create tree → create commit → update ref.
 * One commit = one Railway deployment instead of N commits = N deployments.
 */
async function commitReports(agent: string): Promise<number> {
  const token = import.meta.env.GITHUB_TOKEN;
  const repo = import.meta.env.GITHUB_REPO;
  if (!token || !repo) {
    console.error('GITHUB_TOKEN or GITHUB_REPO not set — skipping report commit');
    return 0;
  }

  const filesToCommit = [...(AGENT_FILES[agent] || []), ...SHARED_FILES];
  const files: { path: string; content: string }[] = [];

  for (const filePath of filesToCommit) {
    const content = readLocalFile(filePath);
    if (content) files.push({ path: filePath, content });
  }

  if (files.length === 0) return 0;

  const api = ghApi(repo, token);

  // 1. Get current HEAD SHA of main
  const headSha = await api.getRef('main');

  // 2. Create blobs for each file
  const treeEntries: { path: string; sha: string }[] = [];
  for (const file of files) {
    const blobSha = await api.createBlob(file.content);
    treeEntries.push({ path: file.path, sha: blobSha });
  }

  // 3. Create tree based on current HEAD
  const treeSha = await api.createTree(headSha, treeEntries);

  // 4. Create commit
  const commitSha = await api.createCommit(
    `chore: ${agent} agent report (run from admin dashboard)`,
    treeSha,
    headSha,
  );

  // 5. Update main ref
  await api.updateRef('main', commitSha);

  return files.length;
}

export const GET: APIRoute = async ({ request }) => {
  const userEmail = await authenticateRequest(request);
  if (!userEmail) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorised' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({
      success: true,
      running: runningAgent,
      lastResult: lastRunResult,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
};

export const POST: APIRoute = async ({ request }) => {
  const userEmail = await authenticateRequest(request);
  if (!userEmail) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorised' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Management only
  if (userEmail !== 'api-client') {
    const dept = getUserDepartment(userEmail);
    if (dept !== 'management') {
      return new Response(
        JSON.stringify({ success: false, error: 'Only management can run agents' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } },
      );
    }
  }

  let body: { agent?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid JSON body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const { agent } = body;
  if (!agent || !VALID_AGENTS.includes(agent)) {
    return new Response(
      JSON.stringify({ success: false, error: `Invalid agent. Valid agents: ${VALID_AGENTS.join(', ')}` }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Check lock
  if (runningAgent) {
    return new Response(
      JSON.stringify({ success: false, error: `Agent "${runningAgent}" is already running. Wait for it to finish.` }),
      { status: 409, headers: { 'Content-Type': 'application/json' } },
    );
  }

  runningAgent = agent;
  lastRunResult = null;
  const script = AGENT_SCRIPTS[agent];

  // Fire-and-forget: start agent in background, return immediately to avoid 502 timeouts
  const child = exec(`node ${script}`, {
    timeout: 120_000,
    env: {
      ...process.env,
      RESEND_API_KEY: process.env.RESEND_KEY || import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY || '',
      NOTIFICATION_EMAIL: import.meta.env.NOTIFICATION_EMAIL || process.env.NOTIFICATION_EMAIL || '',
      LLM_API_KEY: import.meta.env.LLM_API_KEY || process.env.LLM_API_KEY || '',
      SITE_URL: import.meta.env.SITE_URL || process.env.SITE_URL || '',
      GITHUB_TOKEN: import.meta.env.GITHUB_TOKEN || process.env.GITHUB_TOKEN || '',
      GITHUB_REPO: import.meta.env.GITHUB_REPO || process.env.GITHUB_REPO || '',
    },
    maxBuffer: 1024 * 1024,
  }, async (error, _stdout, stderr) => {
    if (error) {
      const message = stderr || error.message;
      console.error(`Agent ${agent} run failed:`, message);
      lastRunResult = { agent, status: 'failed', error: message.slice(0, 500), finishedAt: new Date().toISOString() };
      runningAgent = null;
      return;
    }

    // Commit report files to GitHub so they persist across Railway deploys
    let committedFiles = 0;
    try {
      committedFiles = await commitReports(agent);
    } catch (err) {
      console.error(`Failed to commit reports for ${agent}:`, err instanceof Error ? err.message : err);
    }

    lastRunResult = { agent, status: 'completed', committedFiles, finishedAt: new Date().toISOString() };
    runningAgent = null;
    console.log(`Agent ${agent} completed — ${committedFiles} files committed`);
  });

  return new Response(
    JSON.stringify({ success: true, agent, status: 'started', message: `${agent} agent started in background` }),
    { status: 202, headers: { 'Content-Type': 'application/json' } },
  );
};
