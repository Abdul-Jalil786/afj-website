#!/usr/bin/env node

/**
 * Weekly Market Research Agent
 *
 * Reads quote-rules.json + quote-log.jsonl, analyses pricing performance,
 * and generates AI-powered recommendations via Anthropic Haiku.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... node scripts/market-research-agent.mjs
 *
 * Schedule: Sunday 22:00 UTC via GitHub Actions
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const RULES_PATH = join(ROOT, 'src', 'data', 'quote-rules.json');
const LOG_PATH = join(ROOT, 'data', 'quote-log.jsonl');
const REPORT_PATH = join(ROOT, 'src', 'data', 'reports', 'pricing-report.json');

const API_KEY = process.env.ANTHROPIC_API_KEY || process.env.LLM_API_KEY || '';
const MODEL = process.env.LLM_MODEL || 'claude-haiku-4-5-20251001';

if (!API_KEY) {
  console.error('ERROR: ANTHROPIC_API_KEY or LLM_API_KEY environment variable required');
  process.exit(1);
}

// ── Load data ──

function loadQuoteRules() {
  return JSON.parse(readFileSync(RULES_PATH, 'utf-8'));
}

function loadQuoteLog(daysBack = 7) {
  if (!existsSync(LOG_PATH)) return [];

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysBack);
  const cutoffISO = cutoff.toISOString();

  const lines = readFileSync(LOG_PATH, 'utf-8').trim().split('\n').filter(Boolean);
  const entries = [];

  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      if (entry.timestamp >= cutoffISO) entries.push(entry);
    } catch { /* skip malformed lines */ }
  }

  return entries;
}

// ── Analyse quote data ──

function analyseQuotes(quotes) {
  if (quotes.length === 0) {
    return {
      count: 0,
      converted: 0,
      conversionRate: 0,
      averageQuoteValue: 0,
      serviceBreakdown: {},
      tierBreakdown: {},
      topRoutes: [],
      minimumFloorHits: { 'private-hire': 0, airport: 0 },
      minimumFloorTotal: { 'private-hire': 0, airport: 0 },
    };
  }

  const converted = quotes.filter(q => q.converted);
  const serviceCount = {};
  const tierCount = {};
  const routeCount = {};
  const minimumHits = { 'private-hire': 0, airport: 0 };
  const minimumTotal = { 'private-hire': 0, airport: 0 };
  let totalValue = 0;

  for (const q of quotes) {
    totalValue += q.quoteTotal || 0;

    // Service breakdown
    serviceCount[q.service] = (serviceCount[q.service] || 0) + 1;

    // Tier breakdown
    const tier = q.passengers || 'unknown';
    if (!tierCount[tier]) tierCount[tier] = { count: 0, totalValue: 0, converted: 0 };
    tierCount[tier].count++;
    tierCount[tier].totalValue += q.quoteTotal || 0;
    if (q.converted) tierCount[tier].converted++;

    // Route tracking
    const route = `${q.pickup || '?'}→${q.destination || '?'}`;
    routeCount[route] = (routeCount[route] || 0) + 1;

    // Minimum floor tracking (quoteTotal === minimumBooking value → likely hit the floor)
    if (q.service === 'private-hire' || q.service === 'airport') {
      minimumTotal[q.service] = (minimumTotal[q.service] || 0) + 1;
    }
  }

  // Sort routes by count
  const topRoutes = Object.entries(routeCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([route, count]) => ({ route, count }));

  return {
    count: quotes.length,
    converted: converted.length,
    conversionRate: quotes.length > 0 ? (converted.length / quotes.length) : 0,
    averageQuoteValue: quotes.length > 0 ? Math.round(totalValue / quotes.length) : 0,
    serviceBreakdown: serviceCount,
    tierBreakdown: tierCount,
    topRoutes,
    minimumFloorHits: minimumHits,
    minimumFloorTotal: minimumTotal,
  };
}

// ── Call Anthropic API ──

async function callHaiku(system, userMessage) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      system,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${err}`);
  }

  const data = await response.json();
  const textBlock = data.content?.find(b => b.type === 'text');
  return textBlock?.text || '';
}

// ── Generate report ──

async function generateReport() {
  const rules = loadQuoteRules();
  const quotes = loadQuoteLog(7);
  const analysis = analyseQuotes(quotes);

  const now = new Date();
  const periodTo = now.toISOString().split('T')[0];
  const periodFrom = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0];

  console.log(`Analysing ${analysis.count} quotes from ${periodFrom} to ${periodTo}`);

  // Build the AI prompt
  const system = `You are a pricing analyst for AFJ Limited, a UK transport company based in Birmingham.
Your job is to analyse recent quote data and current pricing configuration, then provide actionable recommendations.

AFJ provides: Private minibus hire, Airport transfers, SEND transport, NEPTS, Executive hire.

Current pricing model:
- Private hire: cost-per-mile (£${rules.costPerMile}) + charge-out rate (£${rules.chargeOutRatePerHour}/hr) × passenger multiplier
- Airport: fixed-rate table by postcode area and airport
- Minimum booking floors per passenger tier

When making recommendations:
- Be specific: recommend exact values, not vague directions
- Consider conversion rate impact — aggressive pricing loses bookings
- Consider competitor landscape (UK private hire market)
- Prioritise recommendations by estimated revenue impact
- Include reasoning for each recommendation

Output ONLY valid JSON matching this schema (no markdown, no explanation outside the JSON):
{
  "recommendations": [
    {
      "id": "rec-N",
      "type": "rate-adjustment" | "minimum-floor" | "multiplier" | "surcharge" | "operational",
      "priority": "high" | "medium" | "low",
      "title": "Short title",
      "description": "Detailed description",
      "field": "JSON path in quote-rules.json (e.g. costPerMile, minimumBooking.private-hire.1-4)",
      "currentValue": <current value>,
      "recommendedValue": <recommended value>,
      "reasoning": "Why this change",
      "estimatedImpact": "Expected revenue impact description"
    }
  ],
  "tierAnalysis": {
    "<band>": { "quoteCount": N, "avgValue": N, "conversionRate": N, "assessment": "text" }
  },
  "minimumFloorAnalysis": {
    "private-hire": { "assessment": "text", "recommendation": "text" },
    "airport": { "assessment": "text", "recommendation": "text" }
  },
  "insights": "2-3 paragraph market analysis summary"
}`;

  const userData = JSON.stringify({
    currentPricing: {
      costPerMile: rules.costPerMile,
      chargeOutRatePerHour: rules.chargeOutRatePerHour,
      driverWagePerHour: rules.driverWagePerHour,
      minimumBooking: rules.minimumBooking,
      passengerMultipliers: rules.pricing?.['private-hire']?.passengerMultipliers,
      airportMultipliers: rules.pricing?.airport?.passengerMultipliers,
      surcharges: rules.surcharges,
    },
    weeklyAnalysis: {
      period: `${periodFrom} to ${periodTo}`,
      totalQuotes: analysis.count,
      convertedQuotes: analysis.converted,
      conversionRate: `${(analysis.conversionRate * 100).toFixed(1)}%`,
      averageQuoteValue: `£${analysis.averageQuoteValue}`,
      serviceBreakdown: analysis.serviceBreakdown,
      tierBreakdown: analysis.tierBreakdown,
      topRoutes: analysis.topRoutes,
    },
  }, null, 2);

  let recommendations;

  if (analysis.count < 5) {
    // Not enough data for meaningful AI analysis — generate a placeholder report
    console.log('Fewer than 5 quotes this week — generating baseline report');
    recommendations = {
      recommendations: [],
      tierAnalysis: {},
      minimumFloorAnalysis: {
        'private-hire': { assessment: 'Insufficient data', recommendation: 'Collect more quotes before adjusting' },
        airport: { assessment: 'Insufficient data', recommendation: 'Collect more quotes before adjusting' },
      },
      insights: `Only ${analysis.count} quotes received in the period ${periodFrom} to ${periodTo}. At least 5 quotes are needed for meaningful analysis. Current pricing configuration appears reasonable as a baseline. Recommend focusing on increasing quote volume through marketing before making pricing adjustments.`,
    };
  } else {
    console.log('Calling Anthropic Haiku for analysis...');
    const raw = await callHaiku(system, `Here is this week's data:\n\n${userData}`);

    // Parse JSON from response (handle potential markdown wrapping)
    let jsonStr = raw.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    try {
      recommendations = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', e.message);
      console.error('Raw response:', raw.slice(0, 500));
      recommendations = {
        recommendations: [],
        tierAnalysis: {},
        minimumFloorAnalysis: {},
        insights: 'AI analysis failed to produce structured output. Raw analysis available in logs.',
      };
    }
  }

  // Build final report
  const report = {
    generatedAt: now.toISOString(),
    status: 'pending',
    periodFrom,
    periodTo,
    quoteCount: analysis.count,
    convertedCount: analysis.converted,
    conversionRate: analysis.conversionRate,
    averageQuoteValue: analysis.averageQuoteValue,
    serviceBreakdown: analysis.serviceBreakdown,
    topRoutes: analysis.topRoutes,
    recommendations: recommendations.recommendations || [],
    tierAnalysis: recommendations.tierAnalysis || {},
    minimumFloorAnalysis: recommendations.minimumFloorAnalysis || {},
    insights: recommendations.insights || null,
  };

  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2) + '\n', 'utf-8');
  console.log(`Report saved to ${REPORT_PATH}`);
  console.log(`  Quotes analysed: ${report.quoteCount}`);
  console.log(`  Recommendations: ${report.recommendations.length}`);

  return report;
}

// ── Run ──

generateReport()
  .then(() => {
    console.log('Market research agent completed successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Market research agent failed:', err.message);
    process.exit(1);
  });
