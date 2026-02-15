export const prerender = false;

import type { APIRoute } from 'astro';
import complianceData from '../../../data/compliance.json';

export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      success: true,
      data: complianceData,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
      },
    },
  );
};
