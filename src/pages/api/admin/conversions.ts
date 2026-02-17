export const prerender = false;

import type { APIRoute } from 'astro';
import { authenticateRequest } from '../../../lib/cf-auth';
import { validateBodySize } from '../../../lib/validate-body';
import { readQuoteLog, updateQuoteLogEntry, appendQuoteLog, generateQuoteId, truncateLocation } from '../../../lib/quote-log';
import { auditLog } from '../../../lib/audit-log';
import departments from '../../../data/departments.json';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

function getUserDepartment(email: string): string {
  for (const [key, dept] of Object.entries(departments)) {
    if ((dept as any).emails?.includes(email)) return key;
  }
  return 'unknown';
}

/**
 * GET /api/admin/conversions — returns quote log entries with optional filters.
 * Query params: from, to, service, source, status, limit
 */
export const GET: APIRoute = async ({ request }) => {
  const userEmail = await authenticateRequest(request);
  if (!userEmail) {
    return new Response(JSON.stringify({ error: 'Unauthorised' }), { status: 401, headers: JSON_HEADERS });
  }

  if (userEmail !== 'api-client') {
    const dept = getUserDepartment(userEmail);
    if (dept !== 'management') {
      return new Response(JSON.stringify({ error: 'Management access required' }), { status: 403, headers: JSON_HEADERS });
    }
  }

  const url = new URL(request.url);
  const fromDate = url.searchParams.get('from');
  const toDate = url.searchParams.get('to');
  const serviceFilter = url.searchParams.get('service');
  const sourceFilter = url.searchParams.get('source');
  const statusFilter = url.searchParams.get('status');
  const limitParam = url.searchParams.get('limit');

  let entries = await readQuoteLog();

  // Apply filters
  if (fromDate) {
    entries = entries.filter((e) => e.timestamp >= fromDate);
  }
  if (toDate) {
    entries = entries.filter((e) => e.timestamp <= toDate + 'T23:59:59.999Z');
  }
  if (serviceFilter) {
    entries = entries.filter((e) => e.service === serviceFilter);
  }
  if (sourceFilter) {
    entries = entries.filter((e) => e.source === sourceFilter);
  }
  if (statusFilter === 'converted') {
    entries = entries.filter((e) => e.converted);
  } else if (statusFilter === 'lost') {
    entries = entries.filter((e) => e.lostReason !== null);
  } else if (statusFilter === 'pending') {
    entries = entries.filter((e) => !e.converted && e.lostReason === null);
  }

  if (limitParam) {
    const limit = parseInt(limitParam, 10);
    if (limit > 0) entries = entries.slice(-limit);
  }

  // Compute metrics
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString();

  const allEntries = await readQuoteLog();
  const weekEntries = allEntries.filter((e) => e.timestamp >= weekAgo);
  const monthEntries = allEntries.filter((e) => e.timestamp >= monthAgo);

  function computeMetrics(data: typeof allEntries) {
    const total = data.length;
    const converted = data.filter((e) => e.converted).length;
    const lost = data.filter((e) => e.lostReason !== null).length;
    const pending = total - converted - lost;
    const rate = total > 0 ? Math.round((converted / total) * 100) : 0;
    const avgQuote = total > 0 ? Math.round(data.reduce((s, e) => s + e.quoteTotal, 0) / total) : 0;
    const convertedEntries = data.filter((e) => e.converted && e.convertedValue);
    const avgBooking = convertedEntries.length > 0
      ? Math.round(convertedEntries.reduce((s, e) => s + (e.convertedValue || 0), 0) / convertedEntries.length)
      : 0;
    return { total, converted, lost, pending, rate, avgQuote, avgBooking };
  }

  // Top routes
  const routeCounts: Record<string, number> = {};
  for (const e of allEntries) {
    const key = `${e.pickup} → ${e.destination}`;
    routeCounts[key] = (routeCounts[key] || 0) + 1;
  }
  const topRoutes = Object.entries(routeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([route, count]) => ({ route, count }));

  // Busiest days
  const dayCounts: Record<string, number> = {};
  for (const e of allEntries) {
    if (e.date) {
      const day = new Date(e.date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long' });
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    }
  }
  const busiestDays = Object.entries(dayCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([day, count]) => ({ day, count }));

  // Conversion by service
  const serviceStats: Record<string, { total: number; converted: number }> = {};
  for (const e of allEntries) {
    if (!serviceStats[e.service]) serviceStats[e.service] = { total: 0, converted: 0 };
    serviceStats[e.service].total++;
    if (e.converted) serviceStats[e.service].converted++;
  }

  // Conversion by passenger band
  const paxStats: Record<string, { total: number; converted: number }> = {};
  for (const e of allEntries) {
    if (!paxStats[e.passengers]) paxStats[e.passengers] = { total: 0, converted: 0 };
    paxStats[e.passengers].total++;
    if (e.converted) paxStats[e.passengers].converted++;
  }

  // Source breakdown
  const sourceCounts: Record<string, number> = {};
  for (const e of allEntries) {
    sourceCounts[e.source] = (sourceCounts[e.source] || 0) + 1;
  }

  return new Response(JSON.stringify({
    success: true,
    entries: entries.reverse(), // newest first
    metrics: {
      week: computeMetrics(weekEntries),
      month: computeMetrics(monthEntries),
      all: computeMetrics(allEntries),
      topRoutes,
      busiestDays,
      serviceStats,
      paxStats,
      sourceCounts,
    },
  }), { status: 200, headers: JSON_HEADERS });
};

/**
 * PUT /api/admin/conversions — update a quote (mark converted/lost).
 */
export const PUT: APIRoute = async ({ request }) => {
  const sizeError = await validateBodySize(request);
  if (sizeError) return sizeError;

  const userEmail = await authenticateRequest(request);
  if (!userEmail) {
    return new Response(JSON.stringify({ error: 'Unauthorised' }), { status: 401, headers: JSON_HEADERS });
  }

  if (userEmail !== 'api-client') {
    const dept = getUserDepartment(userEmail);
    if (dept !== 'management') {
      return new Response(JSON.stringify({ error: 'Management access required' }), { status: 403, headers: JSON_HEADERS });
    }
  }

  try {
    const body = await request.json();
    const { id, action, convertedValue, customerName, notes, lostReason } = body;

    if (!id || !action) {
      return new Response(JSON.stringify({ error: 'Missing id or action' }), { status: 400, headers: JSON_HEADERS });
    }

    let updates: Record<string, unknown> = {};

    if (action === 'convert') {
      updates = {
        converted: true,
        convertedAt: new Date().toISOString(),
        convertedValue: convertedValue ? Number(convertedValue) : null,
        customerName: customerName || null,
        notes: notes || null,
      };
    } else if (action === 'lost') {
      updates = {
        lostReason: lostReason || 'No response',
        notes: notes || null,
      };
    } else {
      return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: JSON_HEADERS });
    }

    const found = await updateQuoteLogEntry(id, updates as any);
    if (!found) {
      return new Response(JSON.stringify({ error: 'Quote not found' }), { status: 404, headers: JSON_HEADERS });
    }

    auditLog(userEmail, `quote_${action}`, { quoteId: id, ...updates }).catch(() => {});

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: JSON_HEADERS });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: JSON_HEADERS },
    );
  }
};

/**
 * POST /api/admin/conversions — manual phone booking entry.
 */
export const POST: APIRoute = async ({ request }) => {
  const sizeError = await validateBodySize(request);
  if (sizeError) return sizeError;

  const userEmail = await authenticateRequest(request);
  if (!userEmail) {
    return new Response(JSON.stringify({ error: 'Unauthorised' }), { status: 401, headers: JSON_HEADERS });
  }

  if (userEmail !== 'api-client') {
    const dept = getUserDepartment(userEmail);
    if (dept !== 'management') {
      return new Response(JSON.stringify({ error: 'Management access required' }), { status: 403, headers: JSON_HEADERS });
    }
  }

  try {
    const body = await request.json();
    const { service, pickup, destination, passengers, date, time, returnType, quotedPrice, bookingValue, customerName, notes } = body;

    if (!service || !pickup || !destination) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: JSON_HEADERS });
    }

    const entry = {
      id: generateQuoteId(),
      timestamp: new Date().toISOString(),
      service: String(service),
      pickup: truncateLocation(String(pickup)),
      destination: truncateLocation(String(destination)),
      passengers: String(passengers || '1-8'),
      date: String(date || ''),
      time: String(time || ''),
      returnType: (returnType || 'one-way') as 'one-way' | 'same-day' | 'different-day',
      quoteLow: Number(quotedPrice) || 0,
      quoteHigh: Number(quotedPrice) || 0,
      quoteTotal: Number(quotedPrice) || 0,
      source: 'phone' as const,
      converted: true,
      convertedAt: new Date().toISOString(),
      convertedValue: Number(bookingValue) || Number(quotedPrice) || 0,
      lostReason: null,
      customerName: customerName ? String(customerName) : null,
      notes: notes ? String(notes) : null,
    };

    await appendQuoteLog(entry);
    auditLog(userEmail, 'quote_phone_booking', { quoteId: entry.id, service, bookingValue }).catch(() => {});

    return new Response(JSON.stringify({ success: true, id: entry.id }), { status: 200, headers: JSON_HEADERS });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: JSON_HEADERS },
    );
  }
};
