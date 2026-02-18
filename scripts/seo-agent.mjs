#!/usr/bin/env node

/**
 * SEO Agent — Daily 4:00 UTC
 *
 * Checks: sitemap crawl, meta tags, broken internal links,
 * schema markup, blog freshness, page performance, AI analysis.
 */

import {
  SITE_URL, API_KEY, fetchWithTimeout, callHaiku, parseAIJSON,
  saveReport, updateHistory, gradeFromIssues,
  sendReportEmail, reportHeader, reportFooter,
} from './agent-utils.mjs';

// ── Fetch and parse sitemap ──

// Astro generates sitemap URLs using the `site` config (production domain),
// but the agent may run against a staging domain. Rewrite all extracted URLs
// so they point at SITE_URL regardless of what the sitemap contains.
const SITE_ORIGIN = new URL(SITE_URL).origin;

function rewriteUrl(url) {
  try {
    const parsed = new URL(url);
    return `${SITE_ORIGIN}${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return url;
  }
}

async function fetchSitemap() {
  const urls = [];

  try {
    // Try sitemap index first
    const indexRes = await fetchWithTimeout(`${SITE_URL}/sitemap-index.xml`);
    if (indexRes.ok) {
      const indexXml = await indexRes.text();
      const sitemapUrls = [...indexXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => rewriteUrl(m[1]));

      for (const sitemapUrl of sitemapUrls) {
        try {
          const res = await fetchWithTimeout(sitemapUrl);
          if (res.ok) {
            const xml = await res.text();
            const pageUrls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => rewriteUrl(m[1]));
            urls.push(...pageUrls);
          }
        } catch { /* skip failed sub-sitemap */ }
      }
    }
  } catch { /* fallback below */ }

  if (urls.length === 0) {
    try {
      const res = await fetchWithTimeout(`${SITE_URL}/sitemap.xml`);
      if (res.ok) {
        const xml = await res.text();
        const pageUrls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => rewriteUrl(m[1]));
        urls.push(...pageUrls);
      }
    } catch { /* no sitemap found */ }
  }

  return urls;
}

// ── Check page status and meta tags ──

async function checkPage(url) {
  const result = {
    url,
    status: null,
    title: null,
    description: null,
    ogTitle: null,
    ogDescription: null,
    ogImage: null,
    hasCanonical: false,
    hasSchema: false,
    issues: [],
  };

  try {
    const start = Date.now();
    const res = await fetchWithTimeout(url, {}, 20000);
    result.status = res.status;
    result.responseTime = Date.now() - start;

    if (!res.ok) {
      result.issues.push({ type: 'http-error', severity: 'high', detail: `HTTP ${res.status}` });
      return result;
    }

    const html = await res.text();

    // Extract meta tags
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    result.title = titleMatch ? titleMatch[1].trim() : null;

    const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
    result.description = descMatch ? descMatch[1] : null;

    const ogTitleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
    result.ogTitle = ogTitleMatch ? ogTitleMatch[1] : null;

    const ogDescMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i);
    result.ogDescription = ogDescMatch ? ogDescMatch[1] : null;

    const ogImgMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
    result.ogImage = ogImgMatch ? ogImgMatch[1] : null;

    result.hasCanonical = /<link\s[^>]*rel="canonical"/i.test(html);
    result.hasSchema = /application\/ld\+json/i.test(html);

    // Validate meta tags
    if (!result.title) result.issues.push({ type: 'missing-title', severity: 'high' });
    else if (result.title.length > 65) result.issues.push({ type: 'title-too-long', severity: 'low', detail: `${result.title.length} chars` });

    if (!result.description) result.issues.push({ type: 'missing-description', severity: 'high' });
    else if (result.description.length > 160) result.issues.push({ type: 'description-too-long', severity: 'low', detail: `${result.description.length} chars` });

    if (!result.ogTitle) result.issues.push({ type: 'missing-og-title', severity: 'medium' });
    if (!result.ogDescription) result.issues.push({ type: 'missing-og-description', severity: 'medium' });
    if (!result.hasCanonical) result.issues.push({ type: 'missing-canonical', severity: 'medium' });

    if (result.responseTime > 3000) result.issues.push({ type: 'slow-response', severity: 'medium', detail: `${result.responseTime}ms` });

    // Check for broken internal links (sample first 50)
    const links = [...html.matchAll(/href="(\/[^"#?]+)"/g)]
      .map(m => m[1])
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 50);

    result.internalLinks = links.length;

  } catch (err) {
    result.issues.push({ type: 'fetch-error', severity: 'high', detail: err.message });
  }

  return result;
}

// ── Check for broken internal links (sample) ──

async function checkBrokenLinks(sitemapUrls) {
  // Pick a sample of internal link paths from the first 5 pages
  const paths = new Set();
  const pagesHtml = [];

  for (const url of sitemapUrls.slice(0, 5)) {
    try {
      const res = await fetchWithTimeout(url, {}, 15000);
      if (res.ok) {
        const html = await res.text();
        pagesHtml.push(html);
        const links = [...html.matchAll(/href="(\/[^"#?]+)"/g)].map(m => m[1]);
        for (const l of links) paths.add(l);
      }
    } catch { /* skip */ }
  }

  // Check unique paths (limit to 30)
  const brokenLinks = [];
  const uniquePaths = [...paths].slice(0, 30);

  for (const path of uniquePaths) {
    try {
      const res = await fetchWithTimeout(`${SITE_URL}${path}`, { method: 'HEAD' }, 10000);
      if (res.status >= 400) {
        brokenLinks.push({ path, status: res.status });
      }
    } catch (err) {
      brokenLinks.push({ path, error: err.message });
    }
  }

  return { checked: uniquePaths.length, broken: brokenLinks };
}

// ── Main ──

async function run() {
  console.log('SEO Agent starting...');
  const now = new Date();

  // Fetch sitemap
  const sitemapUrls = await fetchSitemap();
  console.log(`Found ${sitemapUrls.length} URLs in sitemap`);

  if (sitemapUrls.length === 0) {
    console.error('No sitemap URLs found — generating error report');
    const report = {
      generatedAt: now.toISOString(),
      agent: 'seo',
      grade: 'F',
      sitemapCount: 0,
      error: 'No sitemap found or empty sitemap',
      pages: [],
      brokenLinks: { checked: 0, broken: [] },
      aiAnalysis: null,
    };
    saveReport('seo-report.json', report);
    updateHistory('seo', 'F', 'No sitemap found');
    await sendReportEmail(
      `[AFJ SEO] Grade F — No Sitemap — ${now.toISOString().split('T')[0]}`,
      `${reportHeader('SEO Report', 'F', now.toISOString().split('T')[0])}<p style="color:#dc2626;font-weight:bold">No sitemap found at ${SITE_URL}/sitemap-index.xml or ${SITE_URL}/sitemap.xml</p>${reportFooter()}`,
    );
    return;
  }

  // Check all pages (parallel, batched in groups of 5)
  const pageResults = [];
  for (let i = 0; i < sitemapUrls.length; i += 5) {
    const batch = sitemapUrls.slice(i, i + 5);
    const results = await Promise.all(batch.map(url => checkPage(url)));
    pageResults.push(...results);
  }

  // Check broken links
  const brokenLinks = await checkBrokenLinks(sitemapUrls);

  // Aggregate issues
  const allIssues = pageResults.flatMap(p => p.issues);
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const issue of allIssues) {
    if (counts[issue.severity] !== undefined) counts[issue.severity]++;
  }
  if (brokenLinks.broken.length > 0) counts.medium += brokenLinks.broken.length;

  const grade = gradeFromIssues(counts.critical, counts.high, counts.medium, counts.low);

  // AI analysis
  let aiAnalysis = null;
  if (API_KEY) {
    try {
      const summary = {
        totalPages: sitemapUrls.length,
        issuesCount: counts,
        pagesWithIssues: pageResults.filter(p => p.issues.length > 0).map(p => ({
          url: p.url,
          issues: p.issues,
        })),
        brokenLinks: brokenLinks.broken,
        avgResponseTime: Math.round(pageResults.reduce((s, p) => s + (p.responseTime || 0), 0) / pageResults.length),
      };

      const raw = await callHaiku(
        `You are an SEO analyst for AFJ Limited (${SITE_URL}), a UK transport company. Analyse SEO scan results and provide recommendations. Output valid JSON: { "summary": "1-2 paragraphs", "recommendations": ["action 1", ...], "quickWins": ["quick fix 1", ...] }`,
        JSON.stringify(summary, null, 2),
      );
      aiAnalysis = parseAIJSON(raw);
    } catch (err) {
      console.error('AI analysis failed:', err.message);
    }
  }

  // Build report
  const report = {
    generatedAt: now.toISOString(),
    agent: 'seo',
    grade,
    counts,
    sitemapCount: sitemapUrls.length,
    pages: pageResults.map(p => ({
      url: p.url,
      status: p.status,
      title: p.title,
      hasDescription: !!p.description,
      hasOG: !!p.ogTitle,
      hasCanonical: p.hasCanonical,
      hasSchema: p.hasSchema,
      responseTime: p.responseTime,
      issueCount: p.issues.length,
      issues: p.issues,
    })),
    brokenLinks,
    aiAnalysis,
  };

  saveReport('seo-report.json', report);
  updateHistory('seo', grade, `${sitemapUrls.length} pages, ${allIssues.length} issues`);

  // Email report
  const pagesWithIssues = pageResults.filter(p => p.issues.length > 0);
  const avgTime = Math.round(pageResults.reduce((s, p) => s + (p.responseTime || 0), 0) / pageResults.length);

  const emailHtml = `
    ${reportHeader('SEO Scan Report', grade, now.toISOString().split('T')[0])}
    <h3>Overview</h3>
    <table style="width:100%;border-collapse:collapse;margin:12px 0">
      <tr>
        <td style="padding:8px 12px;border:1px solid #e5e7eb"><strong>Pages scanned</strong></td>
        <td style="padding:8px 12px;border:1px solid #e5e7eb">${sitemapUrls.length}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;border:1px solid #e5e7eb"><strong>Pages with issues</strong></td>
        <td style="padding:8px 12px;border:1px solid #e5e7eb">${pagesWithIssues.length}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;border:1px solid #e5e7eb"><strong>Broken links found</strong></td>
        <td style="padding:8px 12px;border:1px solid #e5e7eb">${brokenLinks.broken.length}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;border:1px solid #e5e7eb"><strong>Avg response time</strong></td>
        <td style="padding:8px 12px;border:1px solid #e5e7eb">${avgTime}ms</td>
      </tr>
    </table>

    ${pagesWithIssues.length > 0 ? `
    <h3>Pages with Issues (${pagesWithIssues.length})</h3>
    <ul>
      ${pagesWithIssues.slice(0, 15).map(p => `<li><strong>${new URL(p.url).pathname}</strong>: ${p.issues.map(i => i.type).join(', ')}</li>`).join('')}
      ${pagesWithIssues.length > 15 ? `<li>...and ${pagesWithIssues.length - 15} more</li>` : ''}
    </ul>` : ''}

    ${brokenLinks.broken.length > 0 ? `
    <h3>Broken Links</h3>
    <ul>
      ${brokenLinks.broken.map(b => `<li><code>${b.path}</code> — ${b.status || b.error}</li>`).join('')}
    </ul>` : ''}

    ${aiAnalysis ? `<h3>AI Analysis</h3><p>${aiAnalysis.summary}</p><h4>Recommendations</h4><ul>${(aiAnalysis.recommendations || []).map(r => `<li>${r}</li>`).join('')}</ul>` : ''}
    ${reportFooter()}
  `;
  await sendReportEmail(`[AFJ SEO] Grade ${grade} — ${now.toISOString().split('T')[0]}`, emailHtml);

  console.log(`SEO Agent complete — Grade: ${grade}`);
}

run()
  .then(() => process.exit(0))
  .catch(err => { console.error('SEO Agent failed:', err.message); process.exit(1); });
