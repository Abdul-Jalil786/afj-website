#!/usr/bin/env node

/**
 * Remediation Agent — Daily 5:00 UTC
 *
 * Reads security-report.json and seo-report.json, identifies HIGH/CRITICAL
 * issues, generates plain English descriptions + ready-to-paste Claude Code
 * prompts, and stores them in src/data/proposed-fixes.json.
 *
 * No AI calls. No code generation. No GitHub commits.
 * Admin copies the prompt into Claude Code which handles the fix safely.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  saveReport, updateHistory, gradeFromIssues,
  sendReportEmail, createNotification,
  reportHeader, reportFooter,
} from './agent-utils.mjs';

const ROOT = process.cwd();
const FIXES_PATH = join(ROOT, 'src', 'data', 'proposed-fixes.json');

// ── Issue patterns with Claude Code prompts ──

const SECURITY_PATTERNS = {
  'missing-security-headers': {
    match: (issue) => issue.type === 'missing-header' || issue.category === 'headers' || /missing.*header/i.test(issue.message || issue.finding || ''),
    severity: 'high',
    title: (issue) => `Add missing security headers: ${issue.missingRequired?.join(', ') || issue.header || 'various'}`,
    description: (issue) => `The security scan found missing HTTP security headers on ${issue.page || 'multiple pages'}. Missing required headers: ${issue.missingRequired?.join(', ') || 'various'}. These protect against MIME-sniffing, clickjacking, and other client-side attacks.`,
    prompt: (issue) => `In src/middleware.ts, check that the following security headers are being set on all responses: ${issue.missingRequired?.join(', ') || 'x-content-type-options, x-frame-options'}. The security agent found these missing on ${issue.page || 'multiple pages'}. If they are already in the code, the issue may be that Railway or Cloudflare is stripping them — in that case, just note this and don't change the code. Test with npm run build. Do not commit unless you actually changed code.`,
  },
  'admin-noindex': {
    match: (issue) => /noindex/i.test(issue.message || issue.finding || '') && /admin/i.test(issue.page || issue.url || ''),
    severity: 'medium',
    title: () => 'Add noindex meta tag to admin pages',
    description: () => 'Admin pages should have a noindex,nofollow meta tag to prevent search engines from indexing internal tools.',
    prompt: () => 'Check that src/layouts/AdminLayout.astro includes <meta name="robots" content="noindex, nofollow"> in the head. If it already does, no change needed. Test with npm run build.',
  },
  'robots-txt': {
    match: (issue) => /robots/i.test(issue.message || issue.finding || ''),
    severity: 'medium',
    title: () => 'Update robots.txt to block admin paths',
    description: () => 'The robots.txt file should disallow crawling of /admin/ and other internal paths.',
    prompt: () => 'Check if public/robots.txt exists and blocks /admin/, /image-library, and /content-calendar. If it does not exist, create it with appropriate Disallow rules for those paths plus Allow for everything else. Sitemap should point to https://www.afjltd.co.uk/sitemap-index.xml. Test with npm run build.',
  },
};

const SEO_PATTERNS = {
  'missing-meta-description': {
    match: (issue) => issue.type === 'missing-description' || /meta description/i.test(issue.message || issue.issue || ''),
    severity: 'medium',
    title: (issue) => `Add meta description to ${issue.page || issue.url || 'page'}`,
    description: (issue) => `The page ${issue.page || issue.url || ''} is missing a meta description tag. This hurts SEO ranking and click-through rates from search results.`,
    prompt: (issue) => `The page at ${issue.page || issue.url || ''} is missing a meta description. Find the .astro file for this route and add an appropriate description prop to the PageLayout or SEOHead component. The description should be 120-155 characters, include relevant keywords, and match AFJ's brand voice. Test with npm run build.`,
  },
  'title-too-long': {
    match: (issue) => issue.type === 'title-too-long' || /title.*long/i.test(issue.message || issue.issue || ''),
    severity: 'low',
    title: (issue) => `Shorten title on ${issue.page || issue.url || 'page'}`,
    description: (issue) => `The page title on ${issue.page || issue.url || ''} is over 60 characters (${issue.detail || ''}). Google truncates titles longer than ~60 chars in search results.`,
    prompt: (issue) => `The title on ${issue.page || issue.url || ''} is too long (${issue.detail || 'over 60 chars'}). Find the .astro file for this route and shorten the title prop to under 60 characters while keeping it descriptive and including key terms. Test with npm run build.`,
  },
  'missing-og-image': {
    match: (issue) => issue.type === 'missing-og-image' || /og:image/i.test(issue.message || issue.issue || ''),
    severity: 'low',
    title: (issue) => `Add default og:image to ${issue.page || issue.url || 'page'}`,
    description: (issue) => `The page ${issue.page || issue.url || ''} has no og:image meta tag. Social media shares will show no preview image.`,
    prompt: (issue) => `The page at ${issue.page || issue.url || ''} is missing an og:image meta tag. Check if SEOHead.astro has a default og:image fallback (it should use /images/afj-og-default.jpg or similar). If not, add a default. Test with npm run build.`,
  },
  'missing-alt-text': {
    match: (issue) => issue.type === 'missing-alt' || /alt text/i.test(issue.message || issue.issue || ''),
    severity: 'medium',
    title: (issue) => `Add alt text to images on ${issue.page || issue.url || 'page'}`,
    description: (issue) => `Images on ${issue.page || issue.url || ''} are missing alt text. This is an accessibility requirement (WCAG 2.1 AA) and helps SEO.`,
    prompt: (issue) => `Find images without alt attributes on ${issue.page || issue.url || ''}. Add descriptive alt text to each image. For decorative images use alt="" with aria-hidden="true". Test with npm run build.`,
  },
  'missing-schema': {
    match: (issue) => issue.type === 'missing-schema' || /schema|json-ld/i.test(issue.message || issue.issue || ''),
    severity: 'medium',
    title: (issue) => `Add JSON-LD schema to ${issue.page || issue.url || 'page'}`,
    description: (issue) => `The page ${issue.page || issue.url || ''} has no JSON-LD structured data. Schema markup helps search engines understand the page content.`,
    prompt: (issue) => `The page at ${issue.page || issue.url || ''} is missing JSON-LD schema markup. Check if it uses PageLayout (which includes SEOHead with global LocalBusiness schema). If it's a service page, add a Service schema. Follow the patterns in seo/schema-markup/*.json for reference. Test with npm run build.`,
  },
  'broken-internal-link': {
    match: (issue) => issue.type === 'broken-link' || /broken.*link/i.test(issue.message || issue.issue || ''),
    severity: 'high',
    title: (issue) => `Fix broken link on ${issue.page || issue.sourcePage || 'page'}`,
    description: (issue) => `A broken internal link was found: ${issue.url || issue.path || 'unknown'} (HTTP ${issue.status || 'error'}). Broken links hurt SEO and user experience.`,
    prompt: (issue) => `There is a broken internal link to "${issue.url || issue.path || ''}" (HTTP ${issue.status || 'error'}) found on ${issue.page || issue.sourcePage || 'a page'}. Find where this link appears in the codebase using Grep and either fix the URL or remove the link. Test with npm run build.`,
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

// ── Collect issues from reports ──

function collectSecurityIssues(report) {
  const issues = [];

  if (report.authEnforcement) {
    for (const a of report.authEnforcement) {
      if (!a.protected) {
        issues.push({ type: 'unprotected-endpoint', endpoint: a.endpoint, status: a.status, message: `Unprotected admin endpoint: ${a.endpoint}` });
      }
    }
  }

  if (report.securityHeaders) {
    for (const h of report.securityHeaders) {
      if (h.missingRequired?.length > 0) {
        issues.push({ type: 'missing-header', page: h.page, missingRequired: h.missingRequired, message: `Missing security headers on ${h.page}: ${h.missingRequired.join(', ')}` });
      }
    }
  }

  if (report.aiAnalysis?.findings) {
    for (const f of report.aiAnalysis.findings) {
      if (f.severity === 'critical' || f.severity === 'high') {
        issues.push(f);
      }
    }
  }

  return issues;
}

function collectSeoIssues(report) {
  const issues = [];

  if (report.pages) {
    for (const page of report.pages) {
      if (page.issues) {
        for (const issue of page.issues) {
          issues.push({ ...issue, page: page.url || page.path });
        }
      }
      if (!page.description) {
        issues.push({ type: 'missing-description', page: page.url || page.path, message: `Missing meta description on ${page.url || page.path}` });
      }
      if (page.title && page.title.length > 60) {
        issues.push({ type: 'title-too-long', page: page.url || page.path, title: page.title, detail: `${page.title.length} chars`, message: `Title too long (${page.title.length} chars) on ${page.url || page.path}` });
      }
    }
  }

  if (report.brokenLinks?.broken) {
    for (const link of report.brokenLinks.broken) {
      issues.push({ type: 'broken-link', sourcePage: link.source || 'unknown', url: link.url, path: link.path, status: link.status, message: `Broken link: ${link.url || link.path}` });
    }
  }

  return issues;
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
  const pendingTitles = new Set(store.fixes.filter(f => f.status === 'pending').map(f => f.title));

  // Collect all current issue titles for auto-resolve
  const currentIssueTitles = new Set();
  let newFixes = 0;
  let resolvedCount = 0;

  // ── Process security issues ──
  if (securityReport) {
    const issues = collectSecurityIssues(securityReport);
    for (const issue of issues) {
      for (const [fixType, pattern] of Object.entries(SECURITY_PATTERNS)) {
        if (pattern.match(issue)) {
          const title = pattern.title(issue);
          currentIssueTitles.add(title);

          if (!pendingTitles.has(title)) {
            store.fixes.push({
              id: fixId(),
              source: 'security-agent',
              issueType: fixType,
              severity: pattern.severity,
              title,
              description: pattern.description(issue),
              claudeCodePrompt: pattern.prompt(issue),
              status: 'pending',
              createdAt: now.toISOString().split('T')[0],
            });
            pendingTitles.add(title);
            newFixes++;
            console.log(`New issue: ${title}`);
          }
          break;
        }
      }
    }
  }

  // ── Process SEO issues ──
  if (seoReport) {
    const issues = collectSeoIssues(seoReport);
    for (const issue of issues) {
      for (const [fixType, pattern] of Object.entries(SEO_PATTERNS)) {
        if (pattern.match(issue)) {
          const title = pattern.title(issue);
          currentIssueTitles.add(title);

          if (!pendingTitles.has(title)) {
            store.fixes.push({
              id: fixId(),
              source: 'seo-agent',
              issueType: fixType,
              severity: pattern.severity,
              title,
              description: pattern.description(issue),
              claudeCodePrompt: pattern.prompt(issue),
              status: 'pending',
              createdAt: now.toISOString().split('T')[0],
            });
            pendingTitles.add(title);
            newFixes++;
            console.log(`New issue: ${title}`);
          }
          break;
        }
      }
    }
  }

  // ── Auto-resolve: mark pending fixes as resolved if issue no longer in reports ──
  for (const fix of store.fixes) {
    if (fix.status === 'pending' && !currentIssueTitles.has(fix.title)) {
      fix.status = 'resolved';
      fix.resolvedAt = now.toISOString();
      resolvedCount++;
      console.log(`Auto-resolved: ${fix.title}`);
    }
  }

  // Keep only last 50 fixes
  store.fixes = store.fixes.slice(-50);
  saveFixes(store);

  // Grade and history
  const pendingCount = store.fixes.filter(f => f.status === 'pending').length;
  const grade = gradeFromIssues(0, 0, newFixes > 0 ? 1 : 0, 0);
  updateHistory('remediation', grade, `${newFixes} new, ${resolvedCount} resolved, ${pendingCount} pending`);

  // Save report
  const report = {
    generatedAt: now.toISOString(),
    agent: 'remediation',
    grade,
    newFixes,
    resolvedFixes: resolvedCount,
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
        title: `${secFixes.length} security issue${secFixes.length > 1 ? 's' : ''} found`,
        summary: `Claude Code prompts ready for ${secFixes.length} security fix${secFixes.length > 1 ? 'es' : ''}. Copy and paste to fix.`,
        actionUrl: '/admin/monitoring?tab=fixes',
        priority: secFixes.some(f => f.severity === 'high') ? 'high' : 'medium',
      });
    }

    if (seoFixes.length > 0) {
      createNotification({
        type: 'seo-fix',
        title: `${seoFixes.length} SEO issue${seoFixes.length > 1 ? 's' : ''} found`,
        summary: `Claude Code prompts ready for ${seoFixes.length} SEO fix${seoFixes.length > 1 ? 'es' : ''}. Copy and paste to fix.`,
        actionUrl: '/admin/monitoring?tab=fixes',
        priority: 'medium',
      });
    }
  }

  // Email if new fixes or resolved
  if (newFixes > 0 || resolvedCount > 0) {
    const emailHtml = `
      ${reportHeader('Remediation Report', grade, now.toISOString().split('T')[0])}
      <p style="color:#374151;font-size:14px">${newFixes} new issue${newFixes !== 1 ? 's' : ''} found. ${resolvedCount} issue${resolvedCount !== 1 ? 's' : ''} auto-resolved. ${pendingCount} pending.</p>
      ${store.fixes.filter(f => f.status === 'pending').length > 0 ? `
      <h3 style="color:#1e3a5f;margin-top:16px">Pending Issues</h3>
      <table style="width:100%;border-collapse:collapse;margin:12px 0">
        <tr style="background:#f3f4f6"><th style="padding:8px 12px;border:1px solid #e5e7eb;text-align:left">Issue</th><th style="padding:8px 12px;border:1px solid #e5e7eb;text-align:left">Source</th><th style="padding:8px 12px;border:1px solid #e5e7eb;text-align:left">Severity</th></tr>
        ${store.fixes.filter(f => f.status === 'pending').slice(-10).map(f => `
          <tr>
            <td style="padding:8px 12px;border:1px solid #e5e7eb">${f.title}</td>
            <td style="padding:8px 12px;border:1px solid #e5e7eb">${f.source}</td>
            <td style="padding:8px 12px;border:1px solid #e5e7eb;color:${f.severity === 'high' ? '#dc2626' : f.severity === 'medium' ? '#ea580c' : '#6b7280'};font-weight:bold">${f.severity}</td>
          </tr>
        `).join('')}
      </table>` : ''}
      <p style="margin-top:16px"><a href="${process.env.SITE_URL || 'https://www.afjltd.co.uk'}/admin/monitoring?tab=fixes" style="color:#2ecc40;font-weight:bold">Copy prompts and fix in Claude Code &rarr;</a></p>
      ${reportFooter()}
    `;
    await sendReportEmail(`[AFJ Remediation] ${newFixes} new, ${resolvedCount} resolved — ${now.toISOString().split('T')[0]}`, emailHtml);
  }

  console.log(`Remediation Agent complete — ${newFixes} new, ${resolvedCount} resolved, ${pendingCount} pending, Grade: ${grade}`);
}

run()
  .then(() => process.exit(0))
  .catch(err => { console.error('Remediation Agent failed:', err.message); process.exit(1); });
