#!/usr/bin/env node

/**
 * Shared utilities for AFJ monitoring agents.
 *
 * Provides: callHaiku, sendReportEmail, saveReport, loadReport,
 * updateHistory, fetchWithTimeout, createGitHubIssue, gradeFromIssues.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const REPORTS_DIR = join(ROOT, 'src', 'data', 'reports');
const HISTORY_PATH = join(REPORTS_DIR, 'history.json');

// ── Environment ──

export const API_KEY = process.env.ANTHROPIC_API_KEY || process.env.LLM_API_KEY || '';
export const MODEL = process.env.LLM_MODEL || 'claude-haiku-4-5-20251001';
export const SITE_URL = (process.env.SITE_URL || 'https://www.afjltd.co.uk').replace(/\/$/, '');
export const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
export const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL || 'info@afjltd.co.uk';
export const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
export const GITHUB_REPO = process.env.GITHUB_REPO || '';

// ── Fetch with timeout ──

export async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new Error(`Request to ${url} timed out after ${timeoutMs}ms`);
    }
    throw err;
  }
}

// ── Call Anthropic Haiku ──

export async function callHaiku(system, userMessage) {
  if (!API_KEY) throw new Error('No LLM API key configured');

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

// ── Parse JSON from AI response ──

export function parseAIJSON(raw) {
  let jsonStr = raw.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  return JSON.parse(jsonStr);
}

// ── Report persistence ──

export function saveReport(filename, data) {
  if (!existsSync(REPORTS_DIR)) mkdirSync(REPORTS_DIR, { recursive: true });
  const path = join(REPORTS_DIR, filename);
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  console.log(`Report saved: ${path}`);
}

export function loadReport(filename) {
  const path = join(REPORTS_DIR, filename);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf-8'));
}

// ── History tracking (90-day cap) ──

export function updateHistory(agentName, grade, summary) {
  let history = {};
  if (existsSync(HISTORY_PATH)) {
    try { history = JSON.parse(readFileSync(HISTORY_PATH, 'utf-8')); } catch { history = {}; }
  }

  if (!history[agentName]) history[agentName] = [];

  history[agentName].push({
    date: new Date().toISOString().split('T')[0],
    grade,
    summary,
  });

  // Cap at 90 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  for (const key of Object.keys(history)) {
    history[key] = history[key].filter(e => e.date >= cutoffStr);
  }

  writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2) + '\n', 'utf-8');
}

// ── Grade calculation ──

export function gradeFromIssues(critical = 0, high = 0, medium = 0, low = 0) {
  if (critical > 0) return 'F';
  if (high > 0) return 'D';
  if (medium > 2) return 'C';
  if (medium > 0) return 'B';
  if (low > 2) return 'B';
  return 'A';
}

// ── Trend calculation ──

export function getTrend(agentName) {
  let history = {};
  if (existsSync(HISTORY_PATH)) {
    try { history = JSON.parse(readFileSync(HISTORY_PATH, 'utf-8')); } catch { history = {}; }
  }

  const entries = history[agentName] || [];
  if (entries.length < 2) return 'stable';

  const gradeOrder = { A: 5, B: 4, C: 3, D: 2, F: 1 };
  const recent = entries.slice(-3);
  const first = gradeOrder[recent[0].grade] || 3;
  const last = gradeOrder[recent[recent.length - 1].grade] || 3;

  if (last > first) return 'improving';
  if (last < first) return 'declining';
  return 'stable';
}

// ── Email via Resend ──

export async function sendReportEmail(subject, htmlBody) {
  if (!RESEND_API_KEY) {
    console.log('RESEND_API_KEY not set — skipping email');
    return;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'AFJ Monitoring <onboarding@resend.dev>',
        to: [NOTIFICATION_EMAIL],
        subject,
        html: htmlBody,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`Resend email failed (${res.status}):`, err);
    } else {
      console.log(`Email sent: ${subject}`);
    }
  } catch (err) {
    console.error('Email send error:', err.message);
  }
}

// ── GitHub issue creation ──

export async function createGitHubIssue(title, body, labels = ['security', 'automated']) {
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    console.log('GITHUB_TOKEN/GITHUB_REPO not set — skipping issue creation');
    return;
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, body, labels }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`GitHub issue creation failed (${res.status}):`, err);
    } else {
      const issue = await res.json();
      console.log(`GitHub issue created: #${issue.number} — ${title}`);
    }
  } catch (err) {
    console.error('GitHub issue creation error:', err.message);
  }
}

// ── Notification creation (writes directly to notifications.json) ──

const NOTIFICATIONS_PATH = join(ROOT, 'src', 'data', 'notifications.json');

const NOTIF_TYPE_EMOJIS = {
  'blog-draft': '\u{1F4DD}',
  'pricing-recommendation': '\u{1F4B0}',
  'security-fix': '\u{1F6E1}\uFE0F',
  'seo-fix': '\u{1F50D}',
  'compliance-expiry': '\u{26A0}\uFE0F',
  'social-draft': '\u{1F4F1}',
  'conversion-milestone': '\u{1F4C8}',
  'agent-critical': '\u{1F6A8}',
};

/**
 * Create a notification and optionally send an email.
 * Agents call this after saving their reports.
 */
export function createNotification({ type, title, summary, actionUrl, priority = 'medium' }) {
  try {
    const ts = Math.floor(Date.now() / 1000);
    const rand = Math.random().toString(36).substring(2, 5);
    const id = `n_${ts}_${rand}`;

    const notification = {
      id,
      type,
      title,
      summary,
      actionUrl,
      priority,
      status: 'pending',
      createdAt: new Date().toISOString(),
      readAt: null,
      actedAt: null,
      emailSent: false,
    };

    let store = { notifications: [] };
    if (existsSync(NOTIFICATIONS_PATH)) {
      try { store = JSON.parse(readFileSync(NOTIFICATIONS_PATH, 'utf-8')); } catch { store = { notifications: [] }; }
    }
    store.notifications.push(notification);
    // Keep last 200
    store.notifications = store.notifications.slice(-200);
    writeFileSync(NOTIFICATIONS_PATH, JSON.stringify(store, null, 2) + '\n', 'utf-8');
    console.log(`Notification created: ${title}`);

    // Fire-and-forget email
    sendNotificationEmail(notification).catch(err => {
      console.error('Notification email failed:', err.message);
    });

    return notification;
  } catch (err) {
    console.error('Failed to create notification:', err.message);
    return null;
  }
}

async function sendNotificationEmail(notification) {
  if (!RESEND_API_KEY) return;

  const emoji = NOTIF_TYPE_EMOJIS[notification.type] || '';
  const subject = `[AFJ] ${emoji} ${notification.title}`;
  const siteUrl = SITE_URL;
  const actionLink = `${siteUrl}${notification.actionUrl}`;
  const priorityColours = { high: '#dc2626', medium: '#ea580c', low: '#6b7280' };
  const priorityColour = priorityColours[notification.priority] || '#6b7280';

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <div style="background:#1e3a5f;color:white;padding:20px;border-radius:8px 8px 0 0">
        <h1 style="margin:0;font-size:18px">${emoji} ${notification.title}</h1>
        <p style="margin:4px 0 0;opacity:0.8;font-size:12px">${new Date(notification.createdAt).toLocaleString('en-GB')}</p>
      </div>
      <div style="border:1px solid #e5e7eb;border-top:none;padding:20px;border-radius:0 0 8px 8px">
        <div style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:bold;color:white;background:${priorityColour};margin-bottom:12px">
          ${notification.priority.toUpperCase()} PRIORITY
        </div>
        <p style="color:#374151;font-size:14px;line-height:1.6;margin:12px 0">${notification.summary}</p>
        <a href="${actionLink}" style="display:inline-block;background:#2ecc40;color:white;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:14px;margin-top:8px">
          Take Action
        </a>
      </div>
      <p style="text-align:center;color:#9ca3af;font-size:11px;margin-top:12px">
        AFJ Limited &middot; <a href="${siteUrl}/admin/notifications" style="color:#9ca3af">View all notifications</a>
      </p>
    </div>
  `;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'AFJ Notifications <onboarding@resend.dev>',
      to: [NOTIFICATION_EMAIL],
      subject,
      html,
    }),
  });

  if (res.ok) {
    // Mark emailSent
    try {
      const store = JSON.parse(readFileSync(NOTIFICATIONS_PATH, 'utf-8'));
      const n = store.notifications.find(x => x.id === notification.id);
      if (n) {
        n.emailSent = true;
        writeFileSync(NOTIFICATIONS_PATH, JSON.stringify(store, null, 2) + '\n', 'utf-8');
      }
    } catch { /* best effort */ }
    console.log(`Notification email sent: ${notification.title}`);
  } else {
    console.error(`Notification email failed (${res.status}):`, await res.text());
  }
}

// ── HTML report helpers ──

export function gradeColour(grade) {
  const colours = { A: '#16a34a', B: '#65a30d', C: '#ca8a04', D: '#ea580c', F: '#dc2626' };
  return colours[grade] || '#6b7280';
}

export function reportHeader(title, grade, generatedAt) {
  return `
    <div style="font-family:sans-serif;max-width:700px;margin:0 auto;padding:20px">
      <div style="background:#1e3a5f;color:white;padding:20px;border-radius:8px 8px 0 0">
        <h1 style="margin:0;font-size:20px">${title}</h1>
        <p style="margin:4px 0 0;opacity:0.8;font-size:13px">Generated ${generatedAt}</p>
      </div>
      <div style="background:${gradeColour(grade)};color:white;padding:12px 20px;font-size:16px;font-weight:bold">
        Overall Grade: ${grade}
      </div>
      <div style="border:1px solid #e5e7eb;border-top:none;padding:20px;border-radius:0 0 8px 8px">
  `;
}

export function reportFooter() {
  return `
      </div>
      <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:12px">
        AFJ Automated Monitoring &middot; <a href="${SITE_URL}/admin/monitoring">View Dashboard</a>
      </p>
    </div>
  `;
}
