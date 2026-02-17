#!/usr/bin/env node

/**
 * Security Agent — Daily 3:00 UTC
 *
 * Checks: auth enforcement, public endpoint abuse potential,
 * security headers, info leakage, SSL status, AI analysis.
 *
 * Creates GitHub issues on CRITICAL findings.
 */

import {
  SITE_URL, API_KEY, fetchWithTimeout, callHaiku, parseAIJSON,
  saveReport, updateHistory, gradeFromIssues,
  sendReportEmail, createGitHubIssue, createNotification,
  reportHeader, reportFooter, gradeColour,
} from './agent-utils.mjs';

// ── Endpoints to test ──

const ADMIN_ENDPOINTS = [
  '/api/admin/pricing',
  '/api/admin/compliance',
  '/api/admin/approval',
  '/api/admin/pricing-report',
  '/api/admin/conversions',
];

const PUBLIC_ENDPOINTS = [
  '/api/quote/estimate',
  '/api/compliance/status',
  '/api/contact/submit',
];

const PAGES_TO_CHECK_HEADERS = [
  '/',
  '/services/send-transport',
  '/admin',
  '/quote',
];

// ── Checks ──

async function checkAuthEnforcement() {
  const results = [];

  for (const endpoint of ADMIN_ENDPOINTS) {
    try {
      const res = await fetchWithTimeout(`${SITE_URL}${endpoint}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const isProtected = res.status === 401 || res.status === 403;
      results.push({
        endpoint,
        status: res.status,
        protected: isProtected,
        severity: isProtected ? 'ok' : 'critical',
      });
    } catch (err) {
      results.push({
        endpoint,
        status: 'error',
        protected: null,
        severity: 'medium',
        error: err.message,
      });
    }
  }

  return results;
}

async function checkSecurityHeaders() {
  const results = [];
  const requiredHeaders = [
    'x-content-type-options',
    'x-frame-options',
  ];
  const recommendedHeaders = [
    'strict-transport-security',
    'content-security-policy',
    'referrer-policy',
    'permissions-policy',
  ];

  for (const page of PAGES_TO_CHECK_HEADERS) {
    try {
      const res = await fetchWithTimeout(`${SITE_URL}${page}`);
      const headers = {};
      const missing = [];
      const recommended = [];

      for (const h of requiredHeaders) {
        const val = res.headers.get(h);
        headers[h] = val || null;
        if (!val) missing.push(h);
      }

      for (const h of recommendedHeaders) {
        const val = res.headers.get(h);
        headers[h] = val || null;
        if (!val) recommended.push(h);
      }

      results.push({
        page,
        headers,
        missingRequired: missing,
        missingRecommended: recommended,
        severity: missing.length > 0 ? 'high' : recommended.length > 2 ? 'medium' : 'low',
      });
    } catch (err) {
      results.push({
        page,
        error: err.message,
        severity: 'medium',
      });
    }
  }

  return results;
}

async function checkInfoLeakage() {
  const results = [];
  const testCases = [
    { endpoint: '/api/quote/estimate', method: 'POST', body: '{}' },
    { endpoint: '/api/contact/submit', method: 'POST', body: '{}' },
    { endpoint: '/api/ai/draft', method: 'POST', body: '{}' },
  ];

  for (const tc of testCases) {
    try {
      const res = await fetchWithTimeout(`${SITE_URL}${tc.endpoint}`, {
        method: tc.method,
        headers: { 'Content-Type': 'application/json' },
        body: tc.body,
      });

      let body = '';
      try { body = await res.text(); } catch { /* ignore */ }

      // Check for server path exposure, stack traces, or sensitive info
      const leaks = [];
      if (/\/home\/|\/var\/|\/usr\/|C:\\|node_modules/.test(body)) leaks.push('server-path');
      if (/at\s+\w+\s+\(/.test(body)) leaks.push('stack-trace');
      if (/password|secret|token|api.key/i.test(body)) leaks.push('sensitive-keyword');

      results.push({
        endpoint: tc.endpoint,
        status: res.status,
        leaks,
        severity: leaks.length > 0 ? 'high' : 'ok',
      });
    } catch (err) {
      results.push({
        endpoint: tc.endpoint,
        error: err.message,
        severity: 'low',
      });
    }
  }

  return results;
}

async function checkSSL() {
  try {
    const res = await fetchWithTimeout(SITE_URL, { method: 'HEAD' });
    const url = new URL(SITE_URL);
    return {
      url: SITE_URL,
      isHttps: url.protocol === 'https:',
      status: res.status,
      severity: url.protocol === 'https:' ? 'ok' : 'critical',
    };
  } catch (err) {
    return {
      url: SITE_URL,
      error: err.message,
      severity: 'high',
    };
  }
}

// ── Main ──

async function run() {
  console.log('Security Agent starting...');
  const now = new Date();

  const [auth, headers, leakage, ssl] = await Promise.all([
    checkAuthEnforcement(),
    checkSecurityHeaders(),
    checkInfoLeakage(),
    checkSSL(),
  ]);

  // Count issues by severity
  const allFindings = [...auth, ...headers, ...leakage, ssl];
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const f of allFindings) {
    if (f.severity && counts[f.severity] !== undefined) counts[f.severity]++;
  }

  const grade = gradeFromIssues(counts.critical, counts.high, counts.medium, counts.low);

  // AI analysis (if API key available)
  let aiAnalysis = null;
  if (API_KEY) {
    try {
      const raw = await callHaiku(
        `You are a web security analyst for AFJ Limited (${SITE_URL}), a UK transport company. Analyse the security scan results and provide a brief assessment with actionable recommendations. Output valid JSON: { "summary": "1-2 paragraphs", "recommendations": ["action 1", ...], "riskLevel": "low|medium|high|critical" }`,
        JSON.stringify({ auth, headers, leakage, ssl, counts }, null, 2),
      );
      aiAnalysis = parseAIJSON(raw);
    } catch (err) {
      console.error('AI analysis failed:', err.message);
      aiAnalysis = { summary: 'AI analysis unavailable.', recommendations: [], riskLevel: 'unknown' };
    }
  }

  // Build report
  const report = {
    generatedAt: now.toISOString(),
    agent: 'security',
    grade,
    counts,
    authEnforcement: auth,
    securityHeaders: headers,
    infoLeakage: leakage,
    ssl,
    aiAnalysis,
  };

  saveReport('security-report.json', report);
  updateHistory('security', grade, `${counts.critical}C ${counts.high}H ${counts.medium}M ${counts.low}L`);

  // Create GitHub issues for CRITICAL findings
  const criticals = allFindings.filter(f => f.severity === 'critical');
  for (const finding of criticals) {
    const title = `CRITICAL: Security issue — ${finding.endpoint || finding.url || 'unknown'}`;
    const body = `## Automated Security Alert\n\n\`\`\`json\n${JSON.stringify(finding, null, 2)}\n\`\`\`\n\nDetected by AFJ Security Agent on ${now.toISOString().split('T')[0]}.`;
    await createGitHubIssue(title, body, ['security', 'critical', 'automated']);
  }

  // Create notification for critical/high findings
  if (counts.critical > 0 || counts.high > 0) {
    createNotification({
      type: 'agent-critical',
      title: `Security: ${counts.critical} critical, ${counts.high} high issues`,
      summary: `Daily security scan found ${counts.critical + counts.high} serious issue(s). Review and apply fixes.`,
      actionUrl: '/admin/monitoring',
      priority: counts.critical > 0 ? 'high' : 'medium',
    });
  }

  // Email report
  const emailSubject = `[AFJ Security] Grade ${grade} — ${now.toISOString().split('T')[0]}`;
  const emailHtml = `
    ${reportHeader('Security Scan Report', grade, now.toISOString().split('T')[0])}
    <h3>Issue Counts</h3>
    <table style="width:100%;border-collapse:collapse;margin:12px 0">
      <tr>
        <td style="padding:6px 12px;border:1px solid #e5e7eb;background:#fef2f2;color:#dc2626;font-weight:bold">Critical: ${counts.critical}</td>
        <td style="padding:6px 12px;border:1px solid #e5e7eb;background:#fff7ed;color:#ea580c;font-weight:bold">High: ${counts.high}</td>
        <td style="padding:6px 12px;border:1px solid #e5e7eb;background:#fefce8;color:#ca8a04">Medium: ${counts.medium}</td>
        <td style="padding:6px 12px;border:1px solid #e5e7eb;background:#f0fdf4;color:#16a34a">Low: ${counts.low}</td>
      </tr>
    </table>

    <h3>Auth Enforcement</h3>
    <ul>
      ${auth.map(a => `<li>${a.endpoint}: ${a.protected ? 'Protected' : '<strong style="color:#dc2626">UNPROTECTED (${a.status})</strong>'}</li>`).join('')}
    </ul>

    <h3>Security Headers</h3>
    <ul>
      ${headers.map(h => `<li>${h.page}: ${h.missingRequired?.length ? `<strong style="color:#dc2626">Missing: ${h.missingRequired.join(', ')}</strong>` : 'OK'}${h.missingRecommended?.length ? ` (recommend: ${h.missingRecommended.join(', ')})` : ''}</li>`).join('')}
    </ul>

    <h3>Info Leakage</h3>
    <ul>
      ${leakage.map(l => `<li>${l.endpoint}: ${l.leaks?.length ? `<strong style="color:#ea580c">${l.leaks.join(', ')}</strong>` : 'Clean'}</li>`).join('')}
    </ul>

    <h3>SSL</h3>
    <p>${ssl.isHttps ? 'HTTPS active' : '<strong style="color:#dc2626">Not HTTPS!</strong>'} — Status: ${ssl.status || ssl.error}</p>

    ${aiAnalysis ? `<h3>AI Analysis</h3><p>${aiAnalysis.summary}</p><ul>${(aiAnalysis.recommendations || []).map(r => `<li>${r}</li>`).join('')}</ul>` : ''}
    ${reportFooter()}
  `;
  await sendReportEmail(emailSubject, emailHtml);

  console.log(`Security Agent complete — Grade: ${grade}`);
}

run()
  .then(() => process.exit(0))
  .catch(err => { console.error('Security Agent failed:', err.message); process.exit(1); });
