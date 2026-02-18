export const prerender = false;

import type { APIRoute } from 'astro';
import quoteRules from '../../../data/quote-rules.json';
import departments from '../../../data/departments.json';
import { updateFileContent } from '../../../lib/github';
import { authenticateRequest } from '../../../lib/cf-auth';
import { validateBodySize } from '../../../lib/validate-body';

const PRICING_ROLES = ['management'];

function getUserDepartment(email: string): string {
  for (const [key, dept] of Object.entries(departments)) {
    if ((dept as any).emails.includes(email)) return key;
  }
  return 'unknown';
}

const JSON_HEADERS = { 'Content-Type': 'application/json' };

/**
 * GET /api/admin/pricing — returns current pricing config from quote-rules.json.
 */
export const GET: APIRoute = async ({ request }) => {
  const userEmail = await authenticateRequest(request);
  if (!userEmail) {
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
  const sizeError = await validateBodySize(request);
  if (sizeError) return sizeError;

  const userEmail = await authenticateRequest(request);
  if (!userEmail) {
    return new Response(JSON.stringify({ error: 'Unauthorised' }), { status: 401, headers: JSON_HEADERS });
  }

  // Role check: only management can update pricing
  if (userEmail !== 'api-client') {
    const dept = getUserDepartment(userEmail);
    if (!PRICING_ROLES.includes(dept)) {
      return new Response(
        JSON.stringify({ error: 'You do not have permission to update pricing' }),
        { status: 403, headers: JSON_HEADERS },
      );
    }
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

    // Airport rates matrix
    if (body.airportRates) {
      updated.airportRates = body.airportRates;
    }

    // Airport pricing parameters (multipliers, meet & greet, return multiplier, etc.)
    if (body.airportPricing) {
      updated.pricing = { ...updated.pricing };
      (updated.pricing as any).airport = {
        ...(updated.pricing as any).airport,
        ...body.airportPricing,
      };
    }

    const content = JSON.stringify(updated, null, 2) + '\n';
    await updateFileContent(
      'src/data/quote-rules.json',
      content,
      'chore: update pricing config via admin portal',
    );

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
