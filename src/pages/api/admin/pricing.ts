export const prerender = false;

import type { APIRoute } from 'astro';
import quoteRules from '../../../data/quote-rules.json';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

/**
 * GET /api/admin/pricing — returns current pricing config from quote-rules.json.
 */
export const GET: APIRoute = async ({ request }) => {
  const secret = import.meta.env.DASHBOARD_SECRET;
  const authHeader = request.headers.get('x-dashboard-secret');
  const cfJwt = request.headers.get('Cf-Access-Jwt-Assertion');
  if ((!secret || authHeader !== secret) && !cfJwt) {
    return new Response(JSON.stringify({ error: 'Unauthorised' }), { status: 401, headers: JSON_HEADERS });
  }

  return new Response(JSON.stringify({ success: true, config: quoteRules }), {
    status: 200,
    headers: JSON_HEADERS,
  });
};

/**
 * POST /api/admin/pricing — updates pricing config in quote-rules.json via GitHub API.
 * Expects a JSON body with the fields to merge into the existing config.
 */
export const POST: APIRoute = async ({ request }) => {
  const secret = import.meta.env.DASHBOARD_SECRET;
  const authHeader = request.headers.get('x-dashboard-secret');
  const cfJwt = request.headers.get('Cf-Access-Jwt-Assertion');
  if ((!secret || authHeader !== secret) && !cfJwt) {
    return new Response(JSON.stringify({ error: 'Unauthorised' }), { status: 401, headers: JSON_HEADERS });
  }

  try {
    const body = await request.json();

    // Merge updates into existing config (only touch fields the admin can edit)
    const updated = { ...quoteRules } as Record<string, any>;

    // Core pricing
    if (body.costPerMile != null) updated.costPerMile = Number(body.costPerMile);
    if (body.chargeOutRatePerHour != null) updated.chargeOutRatePerHour = Number(body.chargeOutRatePerHour);
    if (body.driverWagePerHour != null) updated.driverWagePerHour = Number(body.driverWagePerHour);

    // Thresholds
    if (body.deadheadThresholdMiles != null) updated.deadheadThresholdMiles = Number(body.deadheadThresholdMiles);
    if (body.minGapForSplitReturnHours != null) updated.minGapForSplitReturnHours = Number(body.minGapForSplitReturnHours);

    // Minimum booking floors
    if (body.minimumBooking) {
      updated.minimumBooking = {
        ...updated.minimumBooking,
        ...body.minimumBooking,
      };
    }

    // Passenger multipliers (private-hire)
    if (body.passengerMultipliers) {
      updated.pricing = { ...updated.pricing };
      updated.pricing['private-hire'] = {
        ...updated.pricing['private-hire'],
        passengerMultipliers: body.passengerMultipliers,
      };
    }

    // Surcharges
    if (body.surcharges) {
      updated.surcharges = body.surcharges;
    }

    // Bank holidays
    if (body.bankHolidays) {
      updated.bankHolidays = body.bankHolidays;
    }

    // DVSA
    if (body.dvsa) {
      updated.dvsa = { ...updated.dvsa, ...body.dvsa };
    }

    // Push to GitHub via API
    const githubToken = import.meta.env.GITHUB_TOKEN;
    const githubRepo = import.meta.env.GITHUB_REPO;

    if (!githubToken || !githubRepo) {
      return new Response(
        JSON.stringify({ error: 'GitHub credentials not configured' }),
        { status: 500, headers: JSON_HEADERS },
      );
    }

    const filePath = 'src/data/quote-rules.json';
    const content = JSON.stringify(updated, null, 2) + '\n';
    const encoded = Buffer.from(content).toString('base64');

    // Get current file SHA
    const getRes = await fetch(`https://api.github.com/repos/${githubRepo}/contents/${filePath}`, {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    let sha = '';
    if (getRes.ok) {
      const fileData = await getRes.json();
      sha = (fileData as any).sha;
    }

    // Update file
    const putRes = await fetch(`https://api.github.com/repos/${githubRepo}/contents/${filePath}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `chore: update pricing config via admin portal`,
        content: encoded,
        sha,
      }),
    });

    if (!putRes.ok) {
      const errData = await putRes.json().catch(() => ({}));
      throw new Error(`GitHub API error: ${(errData as any).message || putRes.statusText}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: JSON_HEADERS },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Pricing update error:', message);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to save pricing config. Please try again.' }),
      { status: 500, headers: JSON_HEADERS },
    );
  }
};
