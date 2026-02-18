export const prerender = false;

import type { APIRoute } from 'astro';
import { exec } from 'child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { authenticateRequest } from '../../../lib/cf-auth';
import { updateFileContent } from '../../../lib/github';
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

/** Commit changed files to GitHub so they persist across Railway deploys */
async function commitReports(agent: string): Promise<number> {
  const filesToCommit = [...(AGENT_FILES[agent] || []), ...SHARED_FILES];
  let committed = 0;

  for (const filePath of filesToCommit) {
    const content = readLocalFile(filePath);
    if (!content) continue;

    try {
      await updateFileContent(
        filePath,
        content,
        `chore: ${agent} agent report (run from admin dashboard)`,
      );
      committed++;
    } catch (err) {
      console.error(`Failed to commit ${filePath}:`, err instanceof Error ? err.message : err);
    }
  }

  return committed;
}

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
  const script = AGENT_SCRIPTS[agent];

  try {
    const output = await new Promise<string>((resolve, reject) => {
      exec(`node ${script}`, {
        timeout: 120_000,
        env: { ...process.env },
        maxBuffer: 1024 * 1024,
      }, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr || error.message));
        } else {
          resolve(stdout);
        }
      });
    });

    // Commit report files to GitHub so they persist across Railway deploys
    let committedFiles = 0;
    try {
      committedFiles = await commitReports(agent);
    } catch (err) {
      console.error(`Failed to commit reports for ${agent}:`, err instanceof Error ? err.message : err);
    }

    runningAgent = null;
    return new Response(
      JSON.stringify({ success: true, agent, committedFiles, output: output.slice(-2000) }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    runningAgent = null;
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Agent ${agent} run failed:`, message);
    return new Response(
      JSON.stringify({ success: false, error: `Agent failed: ${message.slice(0, 500)}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
