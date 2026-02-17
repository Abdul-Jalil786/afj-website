#!/usr/bin/env node

/**
 * Meta Agent — Agent Health Monitor
 *
 * Monthly (1st at 08:00 UTC). Reads all agent scripts and their latest reports.
 * Uses Haiku to analyse agent health, identify patterns, and recommend improvements.
 *
 * Cost: ~£0.03/run
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... node scripts/meta-agent.mjs
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  callHaiku,
  parseAIJSON,
  saveReport,
  loadReport,
  updateHistory,
  gradeFromIssues,
  createNotification,
  sendReportEmail,
  reportHeader,
  reportFooter,
  gradeColour,
} from './agent-utils.mjs';

const ROOT = process.cwd();

console.log('=== Meta Agent — Agent Health Monitor ===');
console.log(`Time: ${new Date().toISOString()}`);

// ── Collect agent information ──

const agentScripts = [
  { name: 'security', file: 'security-agent.mjs', reportFile: 'security-report.json', schedule: 'Daily 3:00 UTC', usesAI: true },
  { name: 'seo', file: 'seo-agent.mjs', reportFile: 'seo-report.json', schedule: 'Daily 4:00 UTC', usesAI: true },
  { name: 'remediation', file: 'remediation-agent.mjs', reportFile: 'remediation-report.json', schedule: 'Daily 5:00 UTC', usesAI: true },
  { name: 'performance', file: 'performance-agent.mjs', reportFile: 'performance-report.json', schedule: 'Daily 6:00 UTC', usesAI: false },
  { name: 'compliance', file: 'compliance-check-agent.mjs', reportFile: 'compliance-check-report.json', schedule: 'Daily 7:00 UTC', usesAI: false },
  { name: 'marketing', file: 'marketing-agent.mjs', reportFile: 'marketing-report.json', schedule: 'Monday 7:00 UTC', usesAI: true },
  { name: 'competitor', file: 'competitor-agent.mjs', reportFile: 'competitor-report.json', schedule: 'Sunday 21:00 UTC', usesAI: true },
  { name: 'pricing', file: 'market-research-agent.mjs', reportFile: 'pricing-report.json', schedule: 'Sunday 22:00 UTC', usesAI: true },
];

// Load history
let history = {};
try {
  const histPath = join(ROOT, 'src', 'data', 'reports', 'history.json');
  if (existsSync(histPath)) {
    history = JSON.parse(readFileSync(histPath, 'utf-8'));
  }
} catch { /* no history */ }

// Collect data about each agent
const agentData = [];

for (const agent of agentScripts) {
  const info = {
    name: agent.name,
    schedule: agent.schedule,
    usesAI: agent.usesAI,
    scriptExists: false,
    scriptLines: 0,
    lastReport: null,
    lastGrade: null,
    lastRunDate: null,
    recentGrades: [],
    daysSinceLastRun: null,
    missedRuns: false,
  };

  // Check script exists and get line count
  const scriptPath = join(ROOT, 'scripts', agent.file);
  if (existsSync(scriptPath)) {
    info.scriptExists = true;
    try {
      const content = readFileSync(scriptPath, 'utf-8');
      info.scriptLines = content.split('\n').length;
    } catch { /* ignore */ }
  }

  // Load latest report
  const report = loadReport(agent.reportFile);
  if (report) {
    info.lastReport = {
      generatedAt: report.generatedAt,
      grade: report.grade,
      summary: report.summary || report.overallAssessment || null,
    };
    info.lastGrade = report.grade;
    info.lastRunDate = report.generatedAt;

    if (report.generatedAt) {
      const lastRun = new Date(report.generatedAt);
      info.daysSinceLastRun = Math.floor((Date.now() - lastRun.getTime()) / (24 * 60 * 60 * 1000));

      // Check for missed runs
      if (agent.schedule.startsWith('Daily') && info.daysSinceLastRun > 2) {
        info.missedRuns = true;
      } else if (agent.schedule.includes('Monday') && info.daysSinceLastRun > 9) {
        info.missedRuns = true;
      } else if (agent.schedule.includes('Sunday') && info.daysSinceLastRun > 9) {
        info.missedRuns = true;
      }
    }
  }

  // Load grade history
  const agentHistory = history[agent.name] || [];
  info.recentGrades = agentHistory.slice(-10).map(e => ({ date: e.date, grade: e.grade }));

  agentData.push(info);
}

// ── AI analysis ──

const systemPrompt = `You are a DevOps engineer reviewing the health of an automated monitoring agent fleet for AFJ Limited (a UK transport company).

Analyse the agent data below and return a JSON object with this exact structure:
{
  "overallHealth": "healthy" | "degraded" | "critical",
  "overallGrade": "A" | "B" | "C" | "D" | "F",
  "summary": "2-3 sentence overall assessment",
  "agentAssessments": [
    {
      "name": "agent name",
      "health": "healthy" | "degraded" | "critical" | "offline",
      "assessment": "1-2 sentence assessment",
      "trend": "improving" | "stable" | "declining" | "unknown"
    }
  ],
  "recommendations": [
    {
      "priority": "high" | "medium" | "low",
      "category": "reliability" | "coverage" | "cost" | "configuration" | "new-agent",
      "title": "Short title",
      "description": "What to do and why"
    }
  ],
  "costEstimate": {
    "monthlyAICalls": number,
    "estimatedMonthlyCost": "£X.XX",
    "breakdown": "brief cost breakdown"
  },
  "patterns": ["pattern 1", "pattern 2"]
}

Consider:
- Are agents running on schedule? (check daysSinceLastRun vs schedule)
- Are grades stable, improving, or declining?
- Are there any agents that have never run?
- Are AI-powered agents providing value vs cost?
- Any coverage gaps (things not being monitored)?
- Agent reliability issues (missed runs, missing scripts)`;

const userMessage = `Agent Fleet Data:\n${JSON.stringify(agentData, null, 2)}`;

let analysis;
try {
  const raw = await callHaiku(systemPrompt, userMessage);
  analysis = parseAIJSON(raw);
  console.log(`AI analysis complete. Overall health: ${analysis.overallHealth}`);
} catch (err) {
  console.error('AI analysis failed:', err.message);
  // Fallback analysis
  const missedCount = agentData.filter(a => a.missedRuns).length;
  const offlineCount = agentData.filter(a => !a.scriptExists).length;

  analysis = {
    overallHealth: missedCount > 2 || offlineCount > 0 ? 'degraded' : 'healthy',
    overallGrade: offlineCount > 0 ? 'D' : missedCount > 0 ? 'C' : 'A',
    summary: `${agentData.length} agents configured. ${missedCount} have missed recent runs. ${offlineCount} scripts missing.`,
    agentAssessments: agentData.map(a => ({
      name: a.name,
      health: !a.scriptExists ? 'offline' : a.missedRuns ? 'degraded' : 'healthy',
      assessment: !a.scriptExists ? 'Script not found' : a.missedRuns ? 'Missed recent scheduled runs' : 'Running normally',
      trend: a.recentGrades.length >= 2 ? 'stable' : 'unknown',
    })),
    recommendations: [],
    costEstimate: { monthlyAICalls: 0, estimatedMonthlyCost: '£0.00', breakdown: 'Could not estimate' },
    patterns: [],
  };
}

// ── Build report ──

const report = {
  generatedAt: new Date().toISOString(),
  grade: analysis.overallGrade || 'B',
  overallHealth: analysis.overallHealth,
  summary: analysis.summary,
  agentCount: agentData.length,
  agentAssessments: analysis.agentAssessments,
  recommendations: analysis.recommendations || [],
  costEstimate: analysis.costEstimate,
  patterns: analysis.patterns || [],
  agentData, // Raw data for reference
};

saveReport('meta-report.json', report);
updateHistory('meta', report.grade, report.summary);

// ── Notification ──
const recCount = (analysis.recommendations || []).length;
createNotification({
  type: 'agent-critical',
  title: `Meta Agent: ${analysis.overallHealth} — ${recCount} recommendations`,
  summary: analysis.summary || `${agentData.length} agents analysed. Grade: ${report.grade}.`,
  actionUrl: '/admin/monitoring?tab=health',
  priority: analysis.overallHealth === 'critical' ? 'high' : analysis.overallHealth === 'degraded' ? 'medium' : 'low',
});

// ── Email report ──
const generatedAt = new Date().toLocaleString('en-GB');

let emailHtml = reportHeader('Meta Agent — Monthly Health Report', report.grade, generatedAt);

emailHtml += `<p style="color:#374151;font-size:14px;line-height:1.6">${analysis.summary}</p>`;

emailHtml += '<h3 style="color:#1e3a5f;margin-top:16px">Agent Status</h3>';
emailHtml += '<table style="width:100%;border-collapse:collapse;font-size:13px">';
emailHtml += '<tr style="background:#f3f4f6"><th style="text-align:left;padding:8px;border-bottom:1px solid #e5e7eb">Agent</th><th style="padding:8px;border-bottom:1px solid #e5e7eb">Health</th><th style="padding:8px;border-bottom:1px solid #e5e7eb">Trend</th></tr>';

for (const a of analysis.agentAssessments || []) {
  const healthColour = a.health === 'healthy' ? '#16a34a' : a.health === 'degraded' ? '#ea580c' : a.health === 'critical' ? '#dc2626' : '#6b7280';
  emailHtml += `<tr><td style="padding:8px;border-bottom:1px solid #e5e7eb">${a.name}</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:${healthColour};font-weight:bold">${a.health}</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${a.trend}</td></tr>`;
}
emailHtml += '</table>';

if (analysis.recommendations?.length > 0) {
  emailHtml += '<h3 style="color:#1e3a5f;margin-top:16px">Recommendations</h3><ul style="color:#374151;font-size:13px">';
  for (const r of analysis.recommendations) {
    const badge = r.priority === 'high' ? '🔴' : r.priority === 'medium' ? '🟡' : '🟢';
    emailHtml += `<li style="margin-bottom:6px">${badge} <strong>${r.title}</strong>: ${r.description}</li>`;
  }
  emailHtml += '</ul>';
}

if (analysis.costEstimate) {
  emailHtml += `<p style="color:#6b7280;font-size:12px;margin-top:12px">Estimated monthly cost: ${analysis.costEstimate.estimatedMonthlyCost}</p>`;
}

emailHtml += reportFooter();

await sendReportEmail(`[AFJ] Meta Agent — Grade ${report.grade} — ${analysis.overallHealth}`, emailHtml);

console.log('\n=== Meta Agent Complete ===');
