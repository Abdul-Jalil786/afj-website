export const prerender = false;

import type { APIRoute } from 'astro';
import { escapeHtml, sanitiseForEmailHeader, isValidEmail } from '../../../lib/utils';
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '../../../lib/rate-limit';
import { validateBodySize } from '../../../lib/validate-body';

export const POST: APIRoute = async ({ request }) => {
  // Rate limit: 5 requests per IP per 15 minutes
  const rateCheck = checkRateLimit(request, 'contact', RATE_LIMITS.contact);
  if (!rateCheck.allowed) return rateLimitResponse(rateCheck.resetAt);

  const sizeError = await validateBodySize(request);
  if (sizeError) return sizeError;

  const web3formsKey = import.meta.env.WEB3FORMS_API_KEY;
  const resendKey = import.meta.env.RESEND_API_KEY || process.env.RESEND_KEY || '';
  const notificationEmail = import.meta.env.NOTIFICATION_EMAIL || 'info@afjltd.co.uk';

  try {
    const body = await request.json();
    const { name, email, phone, message, botcheck } = body;

    // Honeypot: silently drop bot submissions
    if (botcheck) {
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (!email || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, message' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (!isValidEmail(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // 1. Submit to Web3Forms
    if (web3formsKey) {
      const formPayload = {
        access_key: web3formsKey,
        subject: 'New Contact Form Submission — AFJ Limited',
        from_name: 'AFJ Website Contact Form',
        name: name || '',
        email,
        phone: phone || '',
        message,
      };

      const w3Res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formPayload),
      });

      if (!w3Res.ok) {
        const errData = await w3Res.json().catch(() => ({}));
        console.error('Web3Forms error:', JSON.stringify(errData));
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to submit form. Please try again.' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } },
        );
      }
    }

    // 2. Send notification to AFJ team
    if (resendKey) {
      const notifyHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1A365D; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 20px;">New Website Enquiry</h1>
          </div>
          <div style="padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr><td style="padding: 8px 0; color: #718096; width: 100px;">Name</td><td style="padding: 8px 0; color: #2D3748; font-weight: 600;">${escapeHtml(name || 'Not provided')}</td></tr>
              <tr><td style="padding: 8px 0; color: #718096;">Email</td><td style="padding: 8px 0; color: #2D3748; font-weight: 600;">${escapeHtml(email)}</td></tr>
              <tr><td style="padding: 8px 0; color: #718096;">Phone</td><td style="padding: 8px 0; color: #2D3748; font-weight: 600;">${escapeHtml(phone || 'Not provided')}</td></tr>
            </table>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
            <p style="font-size: 14px; color: #718096; margin-bottom: 4px;">Message:</p>
            <p style="font-size: 14px; color: #2D3748; white-space: pre-wrap;">${escapeHtml(message)}</p>
          </div>
        </div>
      `.trim();

      const notifyRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'AFJ Website <noreply@afjltd.co.uk>',
          to: [notificationEmail],
          subject: `New Enquiry from ${sanitiseForEmailHeader(name || email)}`,
          html: notifyHtml,
        }),
      }).catch((err) => {
        console.error('Notification email network error:', err);
        return null;
      });
      if (notifyRes && !notifyRes.ok) {
        const errBody = await notifyRes.text().catch(() => '');
        console.error('Notification email failed:', notifyRes.status, errBody);
      }
    }

    // 3. Send auto-response to the customer
    if (resendKey && email) {
      const firstName = (name || '').split(' ')[0] || 'there';

      const autoResponseHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1A365D; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <img src="https://www.afjltd.co.uk/images/logo/afj-logo-final.png" alt="AFJ Limited" style="height: 40px; margin-bottom: 8px;" />
            <h1 style="margin: 0; font-size: 20px;">Thank You for Your Enquiry</h1>
          </div>
          <div style="padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; color: #2D3748;">Hi ${escapeHtml(firstName)},</p>
            <p style="font-size: 14px; color: #4A5568; line-height: 1.6;">
              Thank you for contacting AFJ Limited. We have received your enquiry and a member of our team will respond within <strong>24 hours</strong> during working days.
            </p>
            <p style="font-size: 14px; color: #4A5568; line-height: 1.6;">
              In the meantime, if you need an instant estimate for any of our services, you can use our online quote tool:
            </p>
            <div style="text-align: center; margin: 24px 0;">
              <a href="https://www.afjltd.co.uk/quote" style="display: inline-block; background: #38A169; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">Get an Instant Quote</a>
            </div>
            <p style="font-size: 14px; color: #4A5568; line-height: 1.6;">
              You can also reach us directly:
            </p>
            <ul style="font-size: 14px; color: #4A5568; line-height: 1.8; padding-left: 20px;">
              <li>Phone: <a href="tel:01216891000" style="color: #38A169;">0121 689 1000</a></li>
              <li>Email: <a href="mailto:info@afjltd.co.uk" style="color: #38A169;">info@afjltd.co.uk</a></li>
            </ul>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 12px; color: #A0AEC0; text-align: center;">
              AFJ Limited &middot; AFJ Business Center, 2-18 Forster Street, Nechells, Birmingham B7 4JD<br />
              <a href="https://www.afjltd.co.uk" style="color: #38A169;">www.afjltd.co.uk</a>
            </p>
          </div>
        </div>
      `.trim();

      const autoRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'AFJ Limited <noreply@afjltd.co.uk>',
          to: [email],
          subject: 'Thank you for contacting AFJ Limited',
          html: autoResponseHtml,
        }),
      }).catch((err) => {
        console.error('Auto-response email network error:', err);
        return null;
      });
      if (autoRes && !autoRes.ok) {
        const errBody = await autoRes.text().catch(() => '');
        console.error('Auto-response email failed:', autoRes.status, errBody);
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Contact submit error:', message);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to submit your message. Please try again or call us on 0121 689 1000.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
