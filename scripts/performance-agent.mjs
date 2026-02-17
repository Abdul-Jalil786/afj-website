#!/usr/bin/env node

/**
 * Performance & Uptime Agent — Daily 6:00 UTC
 *
 * NO AI — pure programmatic checks:
 * endpoint health, admin protection, response times,
 * SSL, content integrity.
 *
 * Only emails on failures (not daily noise).
 */

import {
  SITE_URL, fetchWithTimeout,
  saveReport, updateHistory, gradeFromIssues,
  sendReportEmail, reportHeader, reportFooter,
} from './agent-utils.mjs';

// ── Pages to health-check ──

const HEALTH_PAGES = [
  '/',
  '/about',
  '/contact',
  '/services/send-transport',
  '/services/patient-transport',
  '/services/private-hire',
  '/services/airport-transfers',
  '/quote',
  '/compliance',
  '/blog',
  '/areas',
  '/faq',
];

const ADMIN_PAGES = [
  '/admin',
  '/admin/content',
  '/admin/pricing',
  '/admin/monitoring',
];

const API_ENDPOINTS = [
  { path: '/api/compliance/status', method: 'GET', expectStatus: 200 },
];

// ── Content integrity keywords (expected on key pages) ──

const CONTENT_CHECKS = [
  { path: '/', keywords: ['AFJ', 'transport', 'Birmingham'] },
  { path: '/services/send-transport', keywords: ['SEND', 'school', 'transport'] },
  { path: '/services/patient-transport', keywords: ['patient', 'NEPTS', 'transport'] },
  { path: '/quote', keywords: ['quote', 'estimate'] },
];

// ── Checks ──

async function checkEndpointHealth() {
  const results = [];

  for (const page of HEALTH_PAGES) {
    const start = Date.now();
    try {
      const res = await fetchWithTimeout(`${SITE_URL}${page}`, {}, 20000);
      const elapsed = Date.now() - start;
      results.push({
        path: page,
        status: res.status,
        responseTime: elapsed,
        ok: res.status >= 200 && res.status < 400,
        severity: res.status >= 400 ? 'high' : elapsed > 5000 ? 'medium' : 'ok',
      });
    } catch (err) {
      results.push({
        path: page,
        status: null,
        responseTime: Date.now() - start,
        ok: false,
        error: err.message,
        severity: 'critical',
      });
    }
  }

  return results;
}

async function checkAdminProtection() {
  const results = [];

  for (const page of ADMIN_PAGES) {
    try {
      const res = await fetchWithTimeout(`${SITE_URL}${page}`, {
        redirect: 'manual',
      }, 15000);

      // Admin pages should redirect to Cloudflare Access or return 403
      const isProtected = res.status === 302 || res.status === 301 ||
        res.status === 403 || res.status === 401;

      results.push({
        path: page,
        status: res.status,
        protected: isProtected,
        severity: isProtected ? 'ok' : 'critical',
      });
    } catch (err) {
      results.push({
        path: page,
        error: err.message,
        protected: null,
        severity: 'medium',
      });
    }
  }

  return results;
}

async function checkAPIs() {
  const results = [];

  for (const ep of API_ENDPOINTS) {
    const start = Date.now();
    try {
      const res = await fetchWithTimeout(`${SITE_URL}${ep.path}`, {
        method: ep.method,
        headers: { 'Content-Type': 'application/json' },
      }, 15000);

      const elapsed = Date.now() - start;
      const statusOk = ep.expectStatus ? res.status === ep.expectStatus : res.ok;

      results.push({
        path: ep.path,
        method: ep.method,
        status: res.status,
        responseTime: elapsed,
        ok: statusOk,
        severity: statusOk ? 'ok' : 'high',
      });
    } catch (err) {
      results.push({
        path: ep.path,
        method: ep.method,
        ok: false,
        error: err.message,
        severity: 'high',
      });
    }
  }

  return results;
}

async function checkSSL() {
  try {
    const res = await fetchWithTimeout(SITE_URL, { method: 'HEAD' }, 10000);
    const isHttps = new URL(SITE_URL).protocol === 'https:';
    return { ok: isHttps && res.ok, isHttps, status: res.status, severity: isHttps ? 'ok' : 'critical' };
  } catch (err) {
    return { ok: false, error: err.message, severity: 'critical' };
  }
}

async function checkContentIntegrity() {
  const results = [];

  for (const check of CONTENT_CHECKS) {
    try {
      const res = await fetchWithTimeout(`${SITE_URL}${check.path}`, {}, 15000);
      if (!res.ok) {
        results.push({ path: check.path, ok: false, severity: 'high', reason: `HTTP ${res.status}` });
        continue;
      }

      const html = await res.text();
      const htmlLower = html.toLowerCase();
      const missing = check.keywords.filter(kw => !htmlLower.includes(kw.toLowerCase()));

      results.push({
        path: check.path,
        ok: missing.length === 0,
        missingKeywords: missing,
        severity: missing.length > 0 ? 'medium' : 'ok',
      });
    } catch (err) {
      results.push({ path: check.path, ok: false, error: err.message, severity: 'high' });
    }
  }

  return results;
}

// ── Main ──

async function run() {
  console.log('Performance & Uptime Agent starting...');
  const now = new Date();

  const [health, admin, apis, ssl, content] = await Promise.all([
    checkEndpointHealth(),
    checkAdminProtection(),
    checkAPIs(),
    checkSSL(),
    checkContentIntegrity(),
  ]);

  // Aggregate severities
  const allChecks = [...health, ...admin, ...apis, ssl, ...content];
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const c of allChecks) {
    if (c.severity && counts[c.severity] !== undefined) counts[c.severity]++;
  }

  const grade = gradeFromIssues(counts.critical, counts.high, counts.medium, counts.low);

  // Response time stats
  const responseTimes = health.filter(h => h.responseTime).map(h => h.responseTime);
  const avgResponseTime = responseTimes.length > 0
    ? Math.round(responseTimes.reduce((s, t) => s + t, 0) / responseTimes.length)
    : 0;
  const maxResponseTime = responseTimes.length > 0 ? Math.max(...responseTimes) : 0;

  const failedPages = health.filter(h => !h.ok);
  const unprotectedAdmin = admin.filter(a => a.severity === 'critical');

  // Build report
  const report = {
    generatedAt: now.toISOString(),
    agent: 'performance',
    grade,
    counts,
    health: {
      totalPages: HEALTH_PAGES.length,
      pagesUp: health.filter(h => h.ok).length,
      pagesDown: failedPages.length,
      avgResponseTime,
      maxResponseTime,
      details: health,
    },
    adminProtection: {
      totalChecked: ADMIN_PAGES.length,
      allProtected: unprotectedAdmin.length === 0,
      details: admin,
    },
    apis: {
      checked: API_ENDPOINTS.length,
      allOk: apis.every(a => a.ok),
      details: apis,
    },
    ssl,
    contentIntegrity: {
      checked: CONTENT_CHECKS.length,
      allOk: content.every(c => c.ok),
      details: content,
    },
  };

  saveReport('performance-report.json', report);
  updateHistory('performance', grade, `${health.filter(h => h.ok).length}/${HEALTH_PAGES.length} up, avg ${avgResponseTime}ms`);

  // Only email on failures (grade D or F)
  if (grade === 'D' || grade === 'F') {
    const emailHtml = `
      ${reportHeader('Performance & Uptime Alert', grade, now.toISOString().split('T')[0])}
      <p style="color:#dc2626;font-weight:bold;font-size:16px">Issues detected — immediate attention required</p>

      ${failedPages.length > 0 ? `
      <h3>Failed Pages (${failedPages.length})</h3>
      <ul>
        ${failedPages.map(f => `<li><strong>${f.path}</strong> — ${f.error || `HTTP ${f.status}`}</li>`).join('')}
      </ul>` : ''}

      ${unprotectedAdmin.length > 0 ? `
      <h3 style="color:#dc2626">Unprotected Admin Pages!</h3>
      <ul>
        ${unprotectedAdmin.map(a => `<li><strong>${a.path}</strong> — returned ${a.status} (should be 302/403)</li>`).join('')}
      </ul>` : ''}

      ${!ssl.ok ? `<h3 style="color:#dc2626">SSL Issue</h3><p>${ssl.error || 'HTTPS not active'}</p>` : ''}

      ${content.filter(c => !c.ok).length > 0 ? `
      <h3>Content Integrity Issues</h3>
      <ul>
        ${content.filter(c => !c.ok).map(c => `<li><strong>${c.path}</strong> — ${c.missingKeywords?.length ? `missing: ${c.missingKeywords.join(', ')}` : c.reason || c.error}</li>`).join('')}
      </ul>` : ''}

      <h3>Response Times</h3>
      <p>Average: ${avgResponseTime}ms | Max: ${maxResponseTime}ms</p>
      ${reportFooter()}
    `;
    await sendReportEmail(`[AFJ ALERT] Performance Grade ${grade} — ${now.toISOString().split('T')[0]}`, emailHtml);
  } else {
    console.log('All checks passed — no email sent (only alerts on failures)');
  }

  console.log(`Performance Agent complete — Grade: ${grade} (avg ${avgResponseTime}ms)`);
}

run()
  .then(() => process.exit(0))
  .catch(err => { console.error('Performance Agent failed:', err.message); process.exit(1); });
