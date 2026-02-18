export const prerender = false;

import type { APIRoute } from 'astro';
import { escapeHtml } from '../../../lib/utils';
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '../../../lib/rate-limit';
import { validateBodySize } from '../../../lib/validate-body';

const VALID_PREFERENCES = ['phone', 'email', 'whatsapp'] as const;

const PREFERENCE_LABELS: Record<string, string> = {
  phone: 'call you',
  email: 'email you',
  whatsapp: 'WhatsApp you',
};

export const POST: APIRoute = async ({ request }) => {
  const rateCheck = checkRateLimit(request, 'quoteRequest', RATE_LIMITS.quoteRequest);
  if (!rateCheck.allowed) return rateLimitResponse(rateCheck.resetAt);

  const sizeError = await validateBodySize(request);
  if (sizeError) return sizeError;

  const web3formsKey = import.meta.env.WEB3FORMS_API_KEY;
  const resendKey = import.meta.env.RESEND_API_KEY;
  const notificationEmail = import.meta.env.NOTIFICATION_EMAIL || 'info@afjltd.co.uk';

  try {
    const body = await request.json();
    const { name, email, phone, contactPreference, message, service, estimate, answersSummary } = body;

    if (!name || !email) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: name, email' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const preference = VALID_PREFERENCES.includes(contactPreference) ? contactPreference : 'phone';

    // 1. Submit to Web3Forms (backup/archive)
    if (web3formsKey) {
      const formPayload = {
        access_key: web3formsKey,
        subject: 'New Quote Request — AFJ Limited',
        from_name: 'AFJ Website Quote Wizard',
        name: name || '',
        email,
        phone: phone || '',
        contact_preference: preference,
        service: service || '',
        estimate: estimate || '',
        journey_details: answersSummary || '',
        message: message || '',
      };

      await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formPayload),
      }).catch((err) => {
        console.error('Web3Forms backup error:', err);
      });
    }

    // 2. Send team notification email via Resend
    if (resendKey) {
      const journeyRows = (answersSummary || '')
        .split('\n')
        .filter((l: string) => l.trim())
        .map((l: string) => `<tr><td style="padding: 6px 0; color: #4A5568; font-size: 14px;">${escapeHtml(l)}</td></tr>`)
        .join('');

      const notifyHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1A365D; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 20px;">New Quote Request</h1>
          </div>
          <div style="padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr><td style="padding: 8px 0; color: #718096; width: 140px;">Name</td><td style="padding: 8px 0; color: #2D3748; font-weight: 600;">${escapeHtml(name)}</td></tr>
              <tr><td style="padding: 8px 0; color: #718096;">Email</td><td style="padding: 8px 0; color: #2D3748; font-weight: 600;">${escapeHtml(email)}</td></tr>
              <tr><td style="padding: 8px 0; color: #718096;">Phone</td><td style="padding: 8px 0; color: #2D3748; font-weight: 600;">${escapeHtml(phone || 'Not provided')}</td></tr>
              <tr><td style="padding: 8px 0; color: #718096;">Contact Preference</td><td style="padding: 8px 0; color: #2D3748; font-weight: 600;">${escapeHtml(preference.charAt(0).toUpperCase() + preference.slice(1))}</td></tr>
              <tr><td style="padding: 8px 0; color: #718096;">Service</td><td style="padding: 8px 0; color: #2D3748; font-weight: 600;">${escapeHtml(service || 'Not specified')}</td></tr>
              <tr><td style="padding: 8px 0; color: #718096;">Estimate</td><td style="padding: 8px 0; color: #2D3748; font-weight: 600;">${escapeHtml(estimate || 'N/A')}</td></tr>
            </table>
            ${journeyRows ? `
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
            <p style="font-size: 14px; color: #718096; margin-bottom: 8px;">Journey Details:</p>
            <table style="width: 100%; border-collapse: collapse;">${journeyRows}</table>
            ` : ''}
            ${message ? `
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
            <p style="font-size: 14px; color: #718096; margin-bottom: 4px;">Additional Details:</p>
            <p style="font-size: 14px; color: #2D3748; white-space: pre-wrap;">${escapeHtml(message)}</p>
            ` : ''}
          </div>
        </div>
      `.trim();

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'AFJ Website <onboarding@resend.dev>',
          to: [notificationEmail],
          subject: `Quote Request from ${escapeHtml(name)}`,
          html: notifyHtml,
        }),
      }).catch((err) => {
        console.error('Team notification email error:', err);
      });
    }

    // 3. Send customer confirmation email via Resend
    if (resendKey && email) {
      const firstName = (name || '').split(' ')[0] || 'there';
      const contactAction = PREFERENCE_LABELS[preference] || 'contact you';

      const customerHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1A365D; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <img src="https://www.afjltd.co.uk/images/logo/afj-logo-final.png" alt="AFJ Limited" style="height: 40px; margin-bottom: 8px;" />
            <h1 style="margin: 0; font-size: 20px;">Thank You for Your Quote Request</h1>
          </div>
          <div style="padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; color: #2D3748;">Hi ${escapeHtml(firstName)},</p>
            <p style="font-size: 14px; color: #4A5568; line-height: 1.6;">
              Thank you for requesting a quote from AFJ Limited. We have received your request and a member of our team will <strong>${contactAction}</strong> within <strong>24 hours</strong> during working days.
            </p>
            ${service || estimate ? `
            <div style="background: #F0FFF4; border: 1px solid #C6F6D5; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="font-size: 13px; color: #718096; margin: 0 0 4px;">Your quote summary</p>
              ${service ? `<p style="font-size: 14px; color: #2D3748; margin: 0 0 4px;"><strong>Service:</strong> ${escapeHtml(service)}</p>` : ''}
              ${estimate ? `<p style="font-size: 14px; color: #2D3748; margin: 0;"><strong>Estimated range:</strong> ${escapeHtml(estimate)}</p>` : ''}
            </div>
            ` : ''}
            <p style="font-size: 14px; color: #4A5568; line-height: 1.6;">
              In the meantime, you can reach us directly:
            </p>
            <ul style="font-size: 14px; color: #4A5568; line-height: 1.8; padding-left: 20px;">
              <li>Phone: <a href="tel:01216891000" style="color: #38A169;">0121 689 1000</a></li>
              <li>Email: <a href="mailto:info@afjltd.co.uk" style="color: #38A169;">info@afjltd.co.uk</a></li>
            </ul>
            <div style="text-align: center; margin: 24px 0 16px;">
              <p style="font-size: 13px; color: #718096; margin-bottom: 12px;">Stay connected with us</p>
              <a href="https://uk.linkedin.com/company/afj-ltd" style="display: inline-block; background: #0A66C2; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 600; margin: 0 4px;">Follow on LinkedIn</a>
              <a href="https://www.facebook.com/AFJTravel/" style="display: inline-block; background: #1877F2; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 600; margin: 0 4px;">Follow on Facebook</a>
            </div>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 12px; color: #A0AEC0; text-align: center;">
              AFJ Limited &middot; AFJ Business Center, 2-18 Forster Street, Nechells, Birmingham B7 4JD<br />
              <a href="https://www.afjltd.co.uk" style="color: #38A169;">www.afjltd.co.uk</a>
            </p>
          </div>
        </div>
      `.trim();

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'AFJ Limited <onboarding@resend.dev>',
          to: [email],
          subject: 'Your Quote Request — AFJ Limited',
          html: customerHtml,
        }),
      }).catch((err) => {
        console.error('Customer confirmation email error:', err);
      });
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Quote request error:', message);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to submit your quote request. Please try again or call us on 0121 689 1000.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
