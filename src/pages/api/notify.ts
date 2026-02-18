export const prerender = false;

import type { APIRoute } from 'astro';
import { escapeHtml } from '../../lib/utils';
import { validateBodySize } from '../../lib/validate-body';

export const POST: APIRoute = async ({ request }) => {
  const sizeError = await validateBodySize(request);
  if (sizeError) return sizeError;

  const secret = import.meta.env.DASHBOARD_SECRET;
  const resendKey = import.meta.env.RESEND_API_KEY;
  const notificationEmail = import.meta.env.NOTIFICATION_EMAIL || 'info@afjltd.co.uk';

  // Auth check — notify is only called by internal scripts, DASHBOARD_SECRET only
  const authHeader = request.headers.get('x-dashboard-secret');
  if (!secret || authHeader !== secret) {
    return new Response(JSON.stringify({ error: 'Unauthorised' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!resendKey) {
    return new Response(
      JSON.stringify({ error: 'Resend API key not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  try {
    const body = await request.json();
    const { type, platform, title, dueDate } = body;

    if (!type || !platform || !title || !dueDate) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: type, platform, title, dueDate' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1A365D; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 20px;">AFJ Content Reminder</h1>
        </div>
        <div style="padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; color: #2D3748;">A <strong>${escapeHtml(type)}</strong> post for <strong>${escapeHtml(platform)}</strong> is due on <strong>${escapeHtml(dueDate)}</strong>:</p>
          <p style="font-size: 18px; color: #1A365D; font-weight: bold;">${escapeHtml(title)}</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 14px; color: #718096;">This is an automated reminder from the AFJ Content Calendar Dashboard.</p>
        </div>
      </div>
    `.trim();

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'AFJ Content Calendar <noreply@afjltd.co.uk>',
        to: [notificationEmail],
        subject: `AFJ Content Due: ${escapeHtml(title)}`,
        html: emailBody,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return new Response(
        JSON.stringify({ error: 'Failed to send notification' }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({
        success: true,
        message: `Reminder sent for "${escapeHtml(title)}" (${escapeHtml(platform)})`,
        emailId: data.id,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Notification send error:', message);
    return new Response(
      JSON.stringify({ error: 'Failed to send notification. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
