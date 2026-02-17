/**
 * GET /api/admin/notifications — list notifications (filterable by status, type, priority)
 * PUT /api/admin/notifications — mark as read / acted / bulk read
 *
 * Management only. Auth via CF JWT or DASHBOARD_SECRET.
 */

export const prerender = false;

import type { APIRoute } from 'astro';
import { authenticateRequest } from '../../../lib/cf-auth';
import {
  readNotifications,
  markAsRead,
  markAsActed,
  markAllAsRead,
  getUnreadCount,
} from '../../../lib/notifications';

export const GET: APIRoute = async ({ request, url }) => {
  const user = await authenticateRequest(request);
  if (!user) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const status = url.searchParams.get('status');
  const type = url.searchParams.get('type');
  const priority = url.searchParams.get('priority');
  const limit = parseInt(url.searchParams.get('limit') || '100', 10);

  let notifications = await readNotifications();

  // Sort newest first
  notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (status) {
    notifications = notifications.filter((n) => n.status === status);
  }
  if (type) {
    notifications = notifications.filter((n) => n.type === type);
  }
  if (priority) {
    notifications = notifications.filter((n) => n.priority === priority);
  }

  const unreadCount = await getUnreadCount();

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        notifications: notifications.slice(0, limit),
        total: notifications.length,
        unreadCount,
      },
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
};

export const PUT: APIRoute = async ({ request }) => {
  const user = await authenticateRequest(request);
  if (!user) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { action, id, ids } = body;

  if (action === 'read' && id) {
    const ok = await markAsRead(id);
    return new Response(JSON.stringify({ success: ok }), {
      status: ok ? 200 : 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (action === 'acted' && id) {
    const ok = await markAsActed(id);
    return new Response(JSON.stringify({ success: ok }), {
      status: ok ? 200 : 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (action === 'bulk-read' && Array.isArray(ids)) {
    const count = await markAllAsRead(ids);
    return new Response(JSON.stringify({ success: true, data: { updated: count } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({ success: false, error: 'Invalid action. Use read, acted, or bulk-read.' }),
    { status: 400, headers: { 'Content-Type': 'application/json' } },
  );
};
