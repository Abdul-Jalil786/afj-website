#!/usr/bin/env node

/**
 * Competitor Monitor Agent — Weekly Sunday 21:00 UTC
 *
 * Crawls competitor websites, detects content changes via hashing,
 * AI analysis of competitive landscape.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import {
  SITE_URL, API_KEY, fetchWithTimeout, callHaiku, parseAIJSON,
  saveReport, updateHistory, gradeFromIssues,
  sendReportEmail, reportHeader, reportFooter,
} from './agent-utils.mjs';

const ROOT = process.cwd();
const COMPETITORS_PATH = join(ROOT, 'src', 'data', 'competitors.json');
const HASHES_PATH = join(ROOT, 'src', 'data', 'reports', 'competitor-hashes.json');

// ── Load data ──

function loadCompetitors() {
  if (!existsSync(COMPETITORS_PATH)) return [];
  return JSON.parse(readFileSync(COMPETITORS_PATH, 'utf-8')).competitors || [];
}

function loadHashes() {
  if (!existsSync(HASHES_PATH)) return {};
  try {
    return JSON.parse(readFileSync(HASHES_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

function saveHashes(hashes) {
  writeFileSync(HASHES_PATH, JSON.stringify(hashes, null, 2) + '\n', 'utf-8');
}

// ── Crawl competitor ──

async function crawlCompetitor(competitor) {
  const result = {
    name: competitor.name,
    url: competitor.url,
    tier: competitor.tier,
    accessible: false,
    pages: [],
    changes: [],
    error: null,
  };

  // Pages to check for each competitor
  const paths = ['/', '/services', '/about', '/contact'];

  for (const path of paths) {
    const fullUrl = `${competitor.url}${path}`;
    try {
      const res = await fetchWithTimeout(fullUrl, {
        headers: { 'User-Agent': 'AFJ-CompetitorMonitor/1.0' },
      }, 20000);

      if (res.ok) {
        result.accessible = true;
        const html = await res.text();

        // Extract key signals
        const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
        const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);

        // Content hash (body text only, stripped of tags and normalised)
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        const bodyText = (bodyMatch?.[1] || html)
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 10000); // cap to avoid huge hashes

        const hash = createHash('sha256').update(bodyText).digest('hex').slice(0, 16);

        result.pages.push({
          path,
          status: res.status,
          title: titleMatch?.[1]?.trim() || null,
          description: descMatch?.[1] || null,
          contentHash: hash,
          contentLength: bodyText.length,
        });
      } else {
        result.pages.push({ path, status: res.status, error: `HTTP ${res.status}` });
      }
    } catch (err) {
      result.pages.push({ path, status: null, error: err.message });
    }
  }

  return result;
}

// ── Detect changes ──

function detectChanges(results, oldHashes) {
  const newHashes = { ...oldHashes };
  const changes = [];

  for (const competitor of results) {
    const key = competitor.url;
    if (!newHashes[key]) newHashes[key] = {};

    for (const page of competitor.pages) {
      if (!page.contentHash) continue;

      const pageKey = `${key}${page.path}`;
      const oldHash = newHashes[key][page.path];

      if (oldHash && oldHash !== page.contentHash) {
        changes.push({
          competitor: competitor.name,
          url: `${competitor.url}${page.path}`,
          path: page.path,
          oldHash,
          newHash: page.contentHash,
        });
      }

      newHashes[key][page.path] = page.contentHash;
    }
  }

  return { changes, newHashes };
}

// ── Main ──

async function run() {
  console.log('Competitor Monitor Agent starting...');
  const now = new Date();

  const competitors = loadCompetitors();
  if (competitors.length === 0) {
    console.log('No competitors configured — generating empty report');
    saveReport('competitor-report.json', {
      generatedAt: now.toISOString(),
      agent: 'competitor',
      grade: 'A',
      competitors: [],
      changes: [],
      aiAnalysis: null,
    });
    updateHistory('competitor', 'A', 'No competitors configured');
    return;
  }

  const oldHashes = loadHashes();

  // Crawl all competitors
  console.log(`Crawling ${competitors.length} competitors...`);
  const results = [];
  for (const comp of competitors) {
    console.log(`  Crawling: ${comp.name} (${comp.url})`);
    const result = await crawlCompetitor(comp);
    results.push(result);
  }

  // Detect changes
  const { changes, newHashes } = detectChanges(results, oldHashes);
  saveHashes(newHashes);

  console.log(`Changes detected: ${changes.length}`);

  // AI analysis
  let aiAnalysis = null;
  if (API_KEY) {
    try {
      const raw = await callHaiku(
        `You are a competitive intelligence analyst for AFJ Limited (${SITE_URL}), a UK transport company.
Services: SEND school transport, NEPTS, private minibus hire, airport transfers, executive hire.
Based in Birmingham, serving West Midlands, Greater Manchester, and surrounding areas.

Analyse competitor crawl data and provide strategic insights.
Output ONLY valid JSON:
{
  "summary": "1-2 paragraph competitive landscape overview",
  "competitorAssessments": [{ "name": "...", "strengths": ["..."], "weaknesses": ["..."], "threat": "low|medium|high" }],
  "opportunities": ["..."],
  "recommendations": ["..."]
}`,
        JSON.stringify({
          competitors: results.map(r => ({
            name: r.name,
            url: r.url,
            tier: r.tier,
            accessible: r.accessible,
            pages: r.pages.map(p => ({ path: p.path, title: p.title, description: p.description })),
          })),
          recentChanges: changes,
          scanDate: now.toISOString().split('T')[0],
        }, null, 2),
      );
      aiAnalysis = parseAIJSON(raw);
    } catch (err) {
      console.error('AI analysis failed:', err.message);
    }
  }

  // Grade (changes are informational, not problems)
  const inaccessible = results.filter(r => !r.accessible).length;
  const grade = gradeFromIssues(0, 0, inaccessible, 0);

  // Build report
  const report = {
    generatedAt: now.toISOString(),
    agent: 'competitor',
    grade,
    competitorCount: competitors.length,
    competitors: results,
    changesDetected: changes.length,
    changes,
    aiAnalysis,
  };

  saveReport('competitor-report.json', report);
  updateHistory('competitor', grade, `${competitors.length} competitors, ${changes.length} changes`);

  // Email report
  const emailHtml = `
    ${reportHeader('Competitor Intelligence Report', grade, now.toISOString().split('T')[0])}
    <h3>Competitors Scanned</h3>
    <table style="width:100%;border-collapse:collapse;margin:12px 0">
      <tr style="background:#f9fafb">
        <th style="padding:8px 12px;border:1px solid #e5e7eb;text-align:left">Competitor</th>
        <th style="padding:8px 12px;border:1px solid #e5e7eb;text-align:left">Tier</th>
        <th style="padding:8px 12px;border:1px solid #e5e7eb;text-align:left">Status</th>
        <th style="padding:8px 12px;border:1px solid #e5e7eb;text-align:left">Pages</th>
      </tr>
      ${results.map(r => `
        <tr>
          <td style="padding:8px 12px;border:1px solid #e5e7eb"><a href="${r.url}">${r.name}</a></td>
          <td style="padding:8px 12px;border:1px solid #e5e7eb">${r.tier}</td>
          <td style="padding:8px 12px;border:1px solid #e5e7eb">${r.accessible ? 'Accessible' : '<span style="color:#dc2626">Down</span>'}</td>
          <td style="padding:8px 12px;border:1px solid #e5e7eb">${r.pages.filter(p => p.status === 200).length}/${r.pages.length}</td>
        </tr>
      `).join('')}
    </table>

    ${changes.length > 0 ? `
    <h3>Content Changes Detected (${changes.length})</h3>
    <ul>
      ${changes.map(c => `<li><strong>${c.competitor}</strong> — <code>${c.path}</code> content changed</li>`).join('')}
    </ul>` : '<h3>No Content Changes</h3><p>No competitor website changes detected since last scan.</p>'}

    ${aiAnalysis ? `
    <h3>AI Analysis</h3>
    <p>${aiAnalysis.summary}</p>
    <h4>Opportunities</h4>
    <ul>${(aiAnalysis.opportunities || []).map(o => `<li>${o}</li>`).join('')}</ul>
    <h4>Recommendations</h4>
    <ul>${(aiAnalysis.recommendations || []).map(r => `<li>${r}</li>`).join('')}</ul>
    ` : ''}
    ${reportFooter()}
  `;
  await sendReportEmail(`[AFJ Competitor] Grade ${grade} — ${now.toISOString().split('T')[0]}`, emailHtml);

  console.log(`Competitor Monitor Agent complete — Grade: ${grade}`);
}

run()
  .then(() => process.exit(0))
  .catch(err => { console.error('Competitor Monitor Agent failed:', err.message); process.exit(1); });
