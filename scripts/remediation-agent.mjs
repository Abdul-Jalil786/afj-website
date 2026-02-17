#!/usr/bin/env node

/**
 * Remediation Agent — Daily 5:00 UTC
 *
 * Reads security-report.json and seo-report.json, identifies HIGH/CRITICAL
 * issues that can be auto-fixed, generates code fix proposals using Haiku,
 * and stores them in src/data/proposed-fixes.json for admin approval.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  API_KEY, callHaiku, parseAIJSON,
  saveReport, updateHistory, gradeFromIssues,
  sendReportEmail, createNotification,
  reportHeader, reportFooter,
} from './agent-utils.mjs';

const ROOT = process.cwd();
const FIXES_PATH = join(ROOT, 'src', 'data', 'proposed-fixes.json');

// ── Fixable issue patterns ──

const SECURITY_FIXERS = {
  'missing-security-headers': {
    match: (issue) => issue.type === 'missing-header' || issue.category === 'headers' || /missing.*header/i.test(issue.message || issue.finding || ''),
    severity: 'high',
    title: (issue) => `Add missing security headers: ${issue.missingRequired?.join(', ') || issue.header || 'various'}`,
  },
  'admin-noindex': {
    match: (issue) => /noindex/i.test(issue.message || issue.finding || '') && /admin/i.test(issue.page || issue.url || ''),
    severity: 'medium',
    title: () => 'Add noindex meta tag to admin pages',
  },
  'robots-txt': {
    match: (issue) => /robots/i.test(issue.message || issue.finding || ''),
    severity: 'medium',
    title: () => 'Update robots.txt to block admin paths',
  },
};

const SEO_FIXERS = {
  'missing-meta-description': {
    match: (issue) => issue.type === 'missing-description' || /meta description/i.test(issue.message || issue.issue || ''),
    severity: 'medium',
    title: (issue) => `Add meta description to ${issue.page || issue.url || 'page'}`,
  },
  'title-too-long': {
    match: (issue) => issue.type === 'title-too-long' || /title.*long/i.test(issue.message || issue.issue || ''),
    severity: 'low',
    title: (issue) => `Shorten title on ${issue.page || issue.url || 'page'}`,
  },
  'missing-og-image': {
    match: (issue) => issue.type === 'missing-og-image' || /og:image/i.test(issue.message || issue.issue || ''),
    severity: 'low',
    title: (issue) => `Add default og:image to ${issue.page || issue.url || 'page'}`,
  },
  'missing-alt-text': {
    match: (issue) => issue.type === 'missing-alt' || /alt text/i.test(issue.message || issue.issue || ''),
    severity: 'medium',
    title: (issue) => `Add alt text to images on ${issue.page || issue.url || 'page'}`,
  },
  'missing-schema': {
    match: (issue) => issue.type === 'missing-schema' || /schema|json-ld/i.test(issue.message || issue.issue || ''),
    severity: 'medium',
    title: (issue) => `Add JSON-LD schema to ${issue.page || issue.url || 'page'}`,
  },
  'broken-internal-link': {
    match: (issue) => issue.type === 'broken-link' || /broken.*link/i.test(issue.message || issue.issue || ''),
    severity: 'high',
    title: (issue) => `Fix broken link on ${issue.page || issue.sourcePage || 'page'}`,
  },
};

// ── Helpers ──

function loadFixes() {
  if (!existsSync(FIXES_PATH)) return { fixes: [] };
  try {
    return JSON.parse(readFileSync(FIXES_PATH, 'utf-8'));
  } catch {
    return { fixes: [] };
  }
}

function saveFixes(store) {
  writeFileSync(FIXES_PATH, JSON.stringify(store, null, 2) + '\n', 'utf-8');
}

function fixId() {
  return `fix_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
}

/**
 * Use AI to generate a code fix proposal for a given issue.
 */
async function generateFix(issue, sourceAgent, fixType, fixTitle) {
  const system = `You are a code remediation assistant for AFJ Limited's Astro website.
Generate a specific, minimal code fix for the described issue.
The site uses Astro v5.x, Tailwind CSS, and runs on Railway.
Key files: src/middleware.ts (security headers), src/components/core/SEOHead.astro (meta tags).

Output valid JSON:
{
  "file": "path/to/file.ts",
  "currentCode": "relevant section of current code that needs changing (or empty string if adding new code)",
  "proposedCode": "the fixed/new code",
  "diffSummary": "one-line description of what the fix does"
}

If you cannot determine the exact file or code, set file to "unknown" and explain in diffSummary.`;

  const raw = await callHaiku(system, JSON.stringify({
    issueType: fixType,
    details: issue,
    sourceAgent,
    title: fixTitle,
  }, null, 2));

  return parseAIJSON(raw);
}

// ── Main ──

async function run() {
  console.log('Remediation Agent starting...');
  const now = new Date();

  // Load reports
  let securityReport = null;
  let seoReport = null;

  try {
    const secPath = join(ROOT, 'src', 'data', 'reports', 'security-report.json');
    if (existsSync(secPath)) securityReport = JSON.parse(readFileSync(secPath, 'utf-8'));
  } catch { /* no report */ }

  try {
    const seoPath = join(ROOT, 'src', 'data', 'reports', 'seo-report.json');
    if (existsSync(seoPath)) seoReport = JSON.parse(readFileSync(seoPath, 'utf-8'));
  } catch { /* no report */ }

  if (!securityReport && !seoReport) {
    console.log('No reports to process. Exiting.');
    process.exit(0);
  }

  const store = loadFixes();
  const existingFixTitles = new Set(store.fixes.filter(f => f.status === 'pending').map(f => f.title));
  let newFixes = 0;

  // ── Process security issues ──
  if (securityReport) {
    const allSecIssues = [];

    // Collect issues from auth checks
    if (securityReport.auth) {
      for (const a of securityReport.auth) {
        if (!a.protected) {
          allSecIssues.push({ type: 'unprotected-endpoint', endpoint: a.endpoint, status: a.status, message: `Unprotected admin endpoint: ${a.endpoint}` });
        }
      }
    }

    // Collect issues from headers
    if (securityReport.headers) {
      for (const h of securityReport.headers) {
        if (h.missingRequired?.length > 0) {
          allSecIssues.push({ type: 'missing-header', page: h.page, missingRequired: h.missingRequired, message: `Missing security headers on ${h.page}: ${h.missingRequired.join(', ')}` });
        }
      }
    }

    // Collect from AI analysis recommendations
    if (securityReport.aiAnalysis?.findings) {
      for (const f of securityReport.aiAnalysis.findings) {
        if (f.severity === 'critical' || f.severity === 'high') {
          allSecIssues.push(f);
        }
      }
    }

    // Match fixable issues
    for (const issue of allSecIssues) {
      for (const [fixType, fixer] of Object.entries(SECURITY_FIXERS)) {
        if (fixer.match(issue)) {
          const title = fixer.title(issue);
          if (existingFixTitles.has(title)) continue; // Skip duplicates

          if (API_KEY) {
            try {
              const fix = await generateFix(issue, 'security-agent', fixType, title);
              store.fixes.push({
                id: fixId(),
                source: 'security-agent',
                issueType: fixType,
                severity: fixer.severity,
                title,
                description: issue.message || issue.finding || JSON.stringify(issue),
                file: fix.file || 'unknown',
                currentCode: fix.currentCode || '',
                proposedCode: fix.proposedCode || '',
                diffSummary: fix.diffSummary || title,
                status: 'pending',
                createdAt: now.toISOString().split('T')[0],
                approvedAt: null,
                appliedAt: null,
                rejectedAt: null,
                rejectedReason: null,
              });
              existingFixTitles.add(title);
              newFixes++;
              console.log(`Fix generated: ${title}`);
            } catch (err) {
              console.error(`Failed to generate fix for "${title}":`, err.message);
            }
          }
          break; // Only match first fixer per issue
        }
      }
    }
  }

  // ── Process SEO issues ──
  if (seoReport) {
    const allSeoIssues = [];

    // Collect page-level issues
    if (seoReport.pages) {
      for (const page of seoReport.pages) {
        if (page.issues) {
          for (const issue of page.issues) {
            allSeoIssues.push({ ...issue, page: page.url || page.path });
          }
        }
        // Check for missing fields
        if (!page.description) {
          allSeoIssues.push({ type: 'missing-description', page: page.url || page.path, message: `Missing meta description on ${page.url || page.path}` });
        }
        if (page.title && page.title.length > 60) {
          allSeoIssues.push({ type: 'title-too-long', page: page.url || page.path, title: page.title, message: `Title too long (${page.title.length} chars) on ${page.url || page.path}` });
        }
      }
    }

    // Broken links
    if (seoReport.brokenLinks?.broken) {
      for (const link of seoReport.brokenLinks.broken) {
        allSeoIssues.push({ type: 'broken-link', sourcePage: link.source || 'unknown', url: link.url, status: link.status, message: `Broken link: ${link.url}` });
      }
    }

    // Match fixable issues
    for (const issue of allSeoIssues) {
      for (const [fixType, fixer] of Object.entries(SEO_FIXERS)) {
        if (fixer.match(issue)) {
          const title = fixer.title(issue);
          if (existingFixTitles.has(title)) continue;

          if (API_KEY) {
            try {
              const fix = await generateFix(issue, 'seo-agent', fixType, title);
              store.fixes.push({
                id: fixId(),
                source: 'seo-agent',
                issueType: fixType,
                severity: fixer.severity,
                title,
                description: issue.message || issue.issue || JSON.stringify(issue),
                file: fix.file || 'unknown',
                currentCode: fix.currentCode || '',
                proposedCode: fix.proposedCode || '',
                diffSummary: fix.diffSummary || title,
                status: 'pending',
                createdAt: now.toISOString().split('T')[0],
                approvedAt: null,
                appliedAt: null,
                rejectedAt: null,
                rejectedReason: null,
              });
              existingFixTitles.add(title);
              newFixes++;
              console.log(`Fix generated: ${title}`);
            } catch (err) {
              console.error(`Failed to generate fix for "${title}":`, err.message);
            }
          }
          break;
        }
      }
    }
  }

  // Save fixes
  // Keep only last 50 fixes to prevent bloat
  store.fixes = store.fixes.slice(-50);
  saveFixes(store);

  // Grade and history
  const pendingCount = store.fixes.filter(f => f.status === 'pending').length;
  const grade = gradeFromIssues(0, 0, newFixes > 0 ? 1 : 0, 0);
  updateHistory('remediation', grade, `${newFixes} new fixes, ${pendingCount} pending`);

  // Save report
  const report = {
    generatedAt: now.toISOString(),
    agent: 'remediation',
    grade,
    newFixes,
    pendingFixes: pendingCount,
    totalFixes: store.fixes.length,
  };
  saveReport('remediation-report.json', report);

  // Create notifications for new fixes
  if (newFixes > 0) {
    const secFixes = store.fixes.filter(f => f.source === 'security-agent' && f.status === 'pending');
    const seoFixes = store.fixes.filter(f => f.source === 'seo-agent' && f.status === 'pending');

    if (secFixes.length > 0) {
      createNotification({
        type: 'security-fix',
        title: `${secFixes.length} security fix${secFixes.length > 1 ? 'es' : ''} available`,
        summary: `Auto-generated code fixes for security issues. Review and approve to apply.`,
        actionUrl: '/admin/monitoring?tab=fixes',
        priority: secFixes.some(f => f.severity === 'high') ? 'high' : 'medium',
      });
    }

    if (seoFixes.length > 0) {
      createNotification({
        type: 'seo-fix',
        title: `${seoFixes.length} SEO fix${seoFixes.length > 1 ? 'es' : ''} available`,
        summary: `Auto-generated fixes for SEO issues. Review and approve to apply.`,
        actionUrl: '/admin/monitoring?tab=fixes',
        priority: 'medium',
      });
    }
  }

  // Email if new fixes found
  if (newFixes > 0) {
    const emailHtml = `
      ${reportHeader('Remediation Report', grade, now.toISOString().split('T')[0])}
      <h3>New Fix Proposals</h3>
      <p>${newFixes} new auto-fix proposal(s) generated. ${pendingCount} total pending.</p>
      <table style="width:100%;border-collapse:collapse;margin:12px 0">
        <tr style="background:#f3f4f6"><th style="padding:8px 12px;border:1px solid #e5e7eb;text-align:left">Fix</th><th style="padding:8px 12px;border:1px solid #e5e7eb;text-align:left">Source</th><th style="padding:8px 12px;border:1px solid #e5e7eb;text-align:left">Severity</th></tr>
        ${store.fixes.filter(f => f.status === 'pending').slice(-10).map(f => `
          <tr>
            <td style="padding:8px 12px;border:1px solid #e5e7eb">${f.title}</td>
            <td style="padding:8px 12px;border:1px solid #e5e7eb">${f.source}</td>
            <td style="padding:8px 12px;border:1px solid #e5e7eb;color:${f.severity === 'high' ? '#dc2626' : f.severity === 'medium' ? '#ea580c' : '#6b7280'};font-weight:bold">${f.severity}</td>
          </tr>
        `).join('')}
      </table>
      <p><a href="${process.env.SITE_URL || 'https://www.afjltd.co.uk'}/admin/monitoring?tab=fixes" style="color:#2ecc40;font-weight:bold">Review and approve fixes &rarr;</a></p>
      ${reportFooter()}
    `;
    await sendReportEmail(`[AFJ Remediation] ${newFixes} fix${newFixes > 1 ? 'es' : ''} proposed — ${now.toISOString().split('T')[0]}`, emailHtml);
  }

  console.log(`Remediation Agent complete — ${newFixes} new fixes, ${pendingCount} pending, Grade: ${grade}`);
}

run()
  .then(() => process.exit(0))
  .catch(err => { console.error('Remediation Agent failed:', err.message); process.exit(1); });
