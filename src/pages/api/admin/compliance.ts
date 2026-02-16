export const prerender = false;

import type { APIRoute } from 'astro';
import complianceData from '../../../data/compliance.json';
import { updateFileContent } from '../../../lib/github';
import { authenticateRequest } from '../../../lib/cf-auth';
import { validateBodySize } from '../../../lib/validate-body';

export const POST: APIRoute = async ({ request }) => {
  const sizeError = await validateBodySize(request);
  if (sizeError) return sizeError;

  const userEmail = await authenticateRequest(request);
  if (!userEmail) {
    return new Response(JSON.stringify({ error: 'Unauthorised' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items)) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: items' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Build updated compliance JSON
    const updated = {
      lastUpdated: new Date().toISOString().split('T')[0],
      items: complianceData.items.map((existing) => {
        const update = items.find((u: any) => u.id === existing.id);
        if (update) {
          return {
            ...existing,
            value: update.value || existing.value,
            detail: update.detail || existing.detail,
            status: update.status || existing.status,
          };
        }
        return existing;
      }),
    };

    const content = JSON.stringify(updated, null, 2) + '\n';
    await updateFileContent(
      'src/data/compliance.json',
      content,
      `chore: update compliance data (${updated.lastUpdated})`,
    );

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Compliance update error:', message);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to save compliance data. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
