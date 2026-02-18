/**
 * Centralised Notification Service
 *
 * All systems that need admin attention route through here:
 * blog drafts, pricing recommendations, security/SEO fixes,
 * compliance expiries, social drafts, conversion milestones, agent criticals.
 *
 * Storage: src/data/notifications.json (committed to repo)
 * Email: Resend (noreply@afjltd.co.uk until afjltd.co.uk domain verified)
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { escapeHtml } from './utils';

export type NotificationType =
  | 'blog-draft'
  | 'pricing-recommendation'
  | 'security-fix'
  | 'seo-fix'
  | 'compliance-expiry'
  | 'social-draft'
  | 'conversion-milestone'
  | 'agent-critical';

export type NotificationPriority = 'high' | 'medium' | 'low';
export type NotificationStatus = 'pending' | 'read' | 'acted';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  summary: string;
  actionUrl: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  createdAt: string;
  readAt: string | null;
  actedAt: string | null;
  emailSent: boolean;
}

interface NotificationsStore {
  notifications: Notification[];
}

const STORE_PATH = join(process.cwd(), 'src', 'data', 'notifications.json');

const TYPE_EMOJIS: Record<NotificationType, string> = {
  'blog-draft': '\u{1F4DD}',
  'pricing-recommendation': '\u{1F4B0}',
  'security-fix': '\u{1F6E1}\uFE0F',
  'seo-fix': '\u{1F50D}',
  'compliance-expiry': '\u{26A0}\uFE0F',
  'social-draft': '\u{1F4F1}',
  'conversion-milestone': '\u{1F4C8}',
  'agent-critical': '\u{1F6A8}',
};

const PRIORITY_COLOURS: Record<NotificationPriority, string> = {
  high: '#dc2626',
  medium: '#ea580c',
  low: '#6b7280',
};

/** Generate a unique notification ID */
function generateId(): string {
  const ts = Math.floor(Date.now() / 1000);
  const rand = Math.random().toString(36).substring(2, 5);
  return `n_${ts}_${rand}`;
}

/** Read all notifications from store */
export async function readNotifications(): Promise<Notification[]> {
  try {
    const raw = await readFile(STORE_PATH, 'utf-8');
    const store: NotificationsStore = JSON.parse(raw);
    return store.notifications || [];
  } catch {
    return [];
  }
}

/** Write notifications to store */
async function writeNotifications(notifications: Notification[]): Promise<void> {
  const dir = join(process.cwd(), 'src', 'data');
  await mkdir(dir, { recursive: true });
  const store: NotificationsStore = { notifications };
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2) + '\n', 'utf-8');
}

/**
 * Create a new notification. Sends an email asynchronously (fire-and-forget).
 * Returns the created notification.
 */
export async function createNotification(opts: {
  type: NotificationType;
  title: string;
  summary: string;
  actionUrl: string;
  priority: NotificationPriority;
}): Promise<Notification> {
  const notification: Notification = {
    id: generateId(),
    type: opts.type,
    title: opts.title,
    summary: opts.summary,
    actionUrl: opts.actionUrl,
    priority: opts.priority,
    status: 'pending',
    createdAt: new Date().toISOString(),
    readAt: null,
    actedAt: null,
    emailSent: false,
  };

  const all = await readNotifications();
  all.push(notification);

  // Keep only last 200 notifications to prevent file bloat
  const trimmed = all.slice(-200);
  await writeNotifications(trimmed);

  // Send email asynchronously — fire and forget
  sendNotificationEmail(notification).catch((err) => {
    console.error('Notification email failed:', err instanceof Error ? err.message : err);
  });

  return notification;
}

/** Mark a notification as read */
export async function markAsRead(id: string): Promise<boolean> {
  const all = await readNotifications();
  const n = all.find((x) => x.id === id);
  if (!n) return false;
  n.status = n.status === 'pending' ? 'read' : n.status;
  n.readAt = n.readAt || new Date().toISOString();
  await writeNotifications(all);
  return true;
}

/** Mark a notification as acted */
export async function markAsActed(id: string): Promise<boolean> {
  const all = await readNotifications();
  const n = all.find((x) => x.id === id);
  if (!n) return false;
  n.status = 'acted';
  n.readAt = n.readAt || new Date().toISOString();
  n.actedAt = new Date().toISOString();
  await writeNotifications(all);
  return true;
}

/** Bulk mark as read */
export async function markAllAsRead(ids: string[]): Promise<number> {
  const all = await readNotifications();
  let count = 0;
  const now = new Date().toISOString();
  for (const n of all) {
    if (ids.includes(n.id) && n.status === 'pending') {
      n.status = 'read';
      n.readAt = now;
      count++;
    }
  }
  if (count > 0) await writeNotifications(all);
  return count;
}

/** Get unread count */
export async function getUnreadCount(): Promise<number> {
  const all = await readNotifications();
  return all.filter((n) => n.status === 'pending').length;
}

/** Send email for a notification via Resend */
async function sendNotificationEmail(notification: Notification): Promise<void> {
  const resendKey = import.meta.env.RESEND_API_KEY;
  const toEmail = import.meta.env.NOTIFICATION_EMAIL || 'info@afjltd.co.uk';
  const siteUrl = (import.meta.env.SITE_URL || 'https://www.afjltd.co.uk').replace(/\/$/, '');

  if (!resendKey) {
    console.log('RESEND_API_KEY not set — skipping notification email');
    return;
  }

  const emoji = TYPE_EMOJIS[notification.type] || '';
  const subject = `[AFJ] ${emoji} ${notification.title}`;
  const priorityColour = PRIORITY_COLOURS[notification.priority];
  const actionLink = `${siteUrl}${notification.actionUrl}`;

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <div style="background:#1e3a5f;color:white;padding:20px;border-radius:8px 8px 0 0">
        <h1 style="margin:0;font-size:18px">${emoji} ${escapeHtml(notification.title)}</h1>
        <p style="margin:4px 0 0;opacity:0.8;font-size:12px">${new Date(notification.createdAt).toLocaleString('en-GB')}</p>
      </div>
      <div style="border:1px solid #e5e7eb;border-top:none;padding:20px;border-radius:0 0 8px 8px">
        <div style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:bold;color:white;background:${priorityColour};margin-bottom:12px">
          ${notification.priority.toUpperCase()} PRIORITY
        </div>
        <p style="color:#374151;font-size:14px;line-height:1.6;margin:12px 0">${escapeHtml(notification.summary)}</p>
        <a href="${actionLink}" style="display:inline-block;background:#2ecc40;color:white;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:14px;margin-top:8px">
          Take Action
        </a>
      </div>
      <p style="text-align:center;color:#9ca3af;font-size:11px;margin-top:12px">
        AFJ Limited &middot; <a href="${siteUrl}/admin/notifications" style="color:#9ca3af">View all notifications</a>
      </p>
    </div>
  `;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'AFJ Notifications <noreply@afjltd.co.uk>',
        to: [toEmail],
        subject,
        html,
      }),
    });

    if (res.ok) {
      // Mark emailSent on the notification
      const all = await readNotifications();
      const n = all.find((x) => x.id === notification.id);
      if (n) {
        n.emailSent = true;
        await writeNotifications(all);
      }
      console.log(`Notification email sent: ${notification.title}`);
    } else {
      const err = await res.text();
      console.error(`Notification email failed (${res.status}):`, err);
    }
  } catch (err) {
    console.error('Notification email error:', err instanceof Error ? err.message : err);
  }
}
