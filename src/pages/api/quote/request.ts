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
  const resendKey = import.meta.env.RESEND_API_KEY || process.env.RESEND_KEY || '';
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

      const notifyRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'AFJ Website <noreply@afjltd.co.uk>',
          to: [notificationEmail],
          subject: `Quote Request from ${escapeHtml(name)}`,
          html: notifyHtml,
        }),
      }).catch((err) => {
        console.error('Team notification email network error:', err);
        return null;
      });
      if (notifyRes && !notifyRes.ok) {
        const errBody = await notifyRes.text().catch(() => '');
        console.error('Team notification email failed:', notifyRes.status, errBody);
      }
    }

    // 3. Send customer confirmation email via Resend
    if (resendKey && email) {
      const contactAction = PREFERENCE_LABELS[preference] || 'contact you';

      const customerJourneyRows = (answersSummary || '')
        .split('\n')
        .filter((l: string) => l.trim())
        .map((l: string) => {
          const parts = l.split(':');
          const label = parts[0]?.trim() || '';
          const value = parts.slice(1).join(':').trim() || '';
          if (label && value) {
            return `<tr><td style="padding: 6px 12px 6px 0; color: #718096; font-size: 14px; white-space: nowrap; vertical-align: top;">${escapeHtml(label)}</td><td style="padding: 6px 0; color: #2D3748; font-size: 14px; font-weight: 600;">${escapeHtml(value)}</td></tr>`;
          }
          return `<tr><td colspan="2" style="padding: 6px 0; color: #2D3748; font-size: 14px;">${escapeHtml(l)}</td></tr>`;
        })
        .join('');

      const customerHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <div style="background: #1A365D; color: white; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
            <img src="https://www.afjltd.co.uk/images/logo/afj-logo-final.png" alt="AFJ Limited" style="height: 48px; margin-bottom: 12px;" />
            <h1 style="margin: 0; font-size: 22px; font-weight: 700;">Your Quote from AFJ Limited</h1>
          </div>
          <div style="padding: 28px 24px; border: 1px solid #e2e8f0; border-top: none;">

            <p style="font-size: 16px; color: #2D3748; margin: 0 0 16px;">Dear ${escapeHtml(name || 'Customer')},</p>
            <p style="font-size: 14px; color: #4A5568; line-height: 1.7; margin: 0 0 20px;">
              Thank you for requesting a quote from AFJ Limited. We have received your details and a member of our team will <strong>${contactAction}</strong> within <strong>24 hours</strong> during working days to discuss your requirements and confirm your booking.
            </p>

            ${estimate ? `
            <div style="background: #F0FFF4; border: 1px solid #C6F6D5; border-radius: 8px; padding: 20px; margin: 0 0 20px; text-align: center;">
              <p style="font-size: 13px; color: #718096; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.5px;">Estimated Price</p>
              <p style="font-size: 24px; color: #276749; font-weight: 700; margin: 0;">${escapeHtml(estimate)}</p>
            </div>
            ` : ''}

            ${customerJourneyRows ? `
            <div style="background: #F7FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px 20px; margin: 0 0 20px;">
              <p style="font-size: 13px; color: #718096; margin: 0 0 10px; text-transform: uppercase; letter-spacing: 0.5px;">Journey Details</p>
              <table style="width: 100%; border-collapse: collapse;">${customerJourneyRows}</table>
            </div>
            ` : ''}

            <div style="background: #EBF8FF; border: 1px solid #BEE3F8; border-radius: 8px; padding: 16px 20px; margin: 0 0 20px;">
              <p style="font-size: 13px; color: #718096; margin: 0 0 10px; text-transform: uppercase; letter-spacing: 0.5px;">What's Included</p>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #2D3748;">
                <tr><td style="padding: 4px 0;">&#10003; Professional DBS-checked driver</td></tr>
                <tr><td style="padding: 4px 0;">&#10003; Fuel</td></tr>
                <tr><td style="padding: 4px 0;">&#10003; Vehicle insurance</td></tr>
                <tr><td style="padding: 4px 0;">&#10003; Door-to-door service</td></tr>
              </table>
            </div>

            <div style="background: #FFFFF0; border: 1px solid #FEFCBF; border-radius: 8px; padding: 16px 20px; margin: 0 0 24px;">
              <p style="font-size: 13px; color: #718096; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.5px;">About AFJ Limited</p>
              <p style="font-size: 14px; color: #4A5568; line-height: 1.7; margin: 0;">
                AFJ Limited is one of the largest SEND transport providers in the West Midlands and North West, trusted by over 4,000 parents every day to transport their children. From school runs to airport transfers, we are proud to keep communities moving safely, every single day.
              </p>
            </div>

            <div style="background: #F7FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px 20px; margin: 0 0 20px;">
              <p style="font-size: 14px; color: #2D3748; font-weight: 600; margin: 0 0 8px;">Questions? We're here to help.</p>
              <p style="font-size: 14px; color: #4A5568; margin: 0; line-height: 1.7;">
                Phone: <a href="tel:01216891000" style="color: #38A169; text-decoration: none; font-weight: 600;">0121 689 1000</a><br />
                Email: <a href="mailto:info@afjltd.co.uk" style="color: #38A169; text-decoration: none; font-weight: 600;">info@afjltd.co.uk</a>
              </p>
            </div>

            <div style="text-align: center; margin: 0 0 20px;">
              <p style="font-size: 13px; color: #718096; margin: 0 0 12px;">Follow us for transport updates, safety news, and community stories</p>
              <a href="https://uk.linkedin.com/company/afj-ltd" style="display: inline-block; background: #0A66C2; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 600; margin: 0 4px;">Follow on LinkedIn</a>
              <a href="https://www.facebook.com/AFJTravel/" style="display: inline-block; background: #1877F2; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 600; margin: 0 4px;">Follow on Facebook</a>
            </div>

          </div>
          <div style="padding: 16px 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; background: #F7FAFC;">
            <p style="font-size: 12px; color: #A0AEC0; text-align: center; margin: 0;">
              AFJ Limited &middot; AFJ Business Center, 2-18 Forster Street, Nechells, Birmingham B7 4JD<br />
              <a href="https://www.afjltd.co.uk" style="color: #38A169; text-decoration: none;">www.afjltd.co.uk</a>
            </p>
          </div>
        </div>
      `.trim();

      const custRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'AFJ Limited <noreply@afjltd.co.uk>',
          to: [email],
          subject: 'Your Quote Request — AFJ Limited',
          html: customerHtml,
        }),
      }).catch((err) => {
        console.error('Customer confirmation email network error:', err);
        return null;
      });
      if (custRes && !custRes.ok) {
        const errBody = await custRes.text().catch(() => '');
        console.error('Customer confirmation email failed:', custRes.status, errBody);
      }
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
