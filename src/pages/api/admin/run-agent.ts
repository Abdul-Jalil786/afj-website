export const prerender = false;

import type { APIRoute } from 'astro';
import { exec } from 'child_process';
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

const VALID_AGENTS = Object.keys(AGENT_SCRIPTS);

// Simple in-memory lock — only one agent at a time
let runningAgent: string | null = null;

function getUserDepartment(email: string): string {
  for (const [key, dept] of Object.entries(departments)) {
    if ((dept as any).emails.includes(email)) return key;
  }
  return 'unknown';
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
      const child = exec(`node ${script}`, {
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

    runningAgent = null;
    return new Response(
      JSON.stringify({ success: true, agent, output: output.slice(-2000) }),
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
