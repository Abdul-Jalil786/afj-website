#!/usr/bin/env node

/**
 * Run All Monitoring Agents
 *
 * Convenience script to run all 5 monitoring agents in sequence.
 * Useful for local testing or manual full scan.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... SITE_URL=https://www.afjltd.co.uk node scripts/run-all-agents.mjs
 *
 * Optional: pass agent names to run a subset:
 *   node scripts/run-all-agents.mjs security performance
 */

import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const ROOT = process.cwd();

const AGENTS = [
  { name: 'security', script: 'security-agent.mjs' },
  { name: 'seo', script: 'seo-agent.mjs' },
  { name: 'remediation', script: 'remediation-agent.mjs' },
  { name: 'marketing', script: 'marketing-agent.mjs' },
  { name: 'competitor', script: 'competitor-agent.mjs' },
  { name: 'performance', script: 'performance-agent.mjs' },
  { name: 'compliance', script: 'compliance-check-agent.mjs' },
  { name: 'meta', script: 'meta-agent.mjs' },
];

const requestedAgents = process.argv.slice(2);
const agentsToRun = requestedAgents.length > 0
  ? AGENTS.filter(a => requestedAgents.includes(a.name))
  : AGENTS;

if (agentsToRun.length === 0) {
  console.error(`No matching agents found. Available: ${AGENTS.map(a => a.name).join(', ')}`);
  process.exit(1);
}

console.log(`Running ${agentsToRun.length} agent(s): ${agentsToRun.map(a => a.name).join(', ')}\n`);

let failed = 0;

for (const agent of agentsToRun) {
  const scriptPath = join(ROOT, 'scripts', agent.script);
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Running: ${agent.name} agent`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    execFileSync('node', [scriptPath], {
      stdio: 'inherit',
      env: process.env,
      cwd: ROOT,
    });
    console.log(`\n${agent.name} agent: SUCCESS`);
  } catch (err) {
    console.error(`\n${agent.name} agent: FAILED — ${err.message}`);
    failed++;
  }
}

console.log(`\n${'='.repeat(60)}`);
console.log(`All agents complete. ${agentsToRun.length - failed}/${agentsToRun.length} succeeded.`);
console.log(`${'='.repeat(60)}`);

process.exit(failed > 0 ? 1 : 0);
