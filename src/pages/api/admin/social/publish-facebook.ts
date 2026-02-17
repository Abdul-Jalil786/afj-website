/**
 * POST /api/admin/social/publish-facebook
 *
 * Publishes an approved social draft to Facebook via the Graph API.
 * Requires FACEBOOK_PAGE_ID and FACEBOOK_ACCESS_TOKEN environment variables.
 * If tokens are missing, returns a helpful setup message instead of failing.
 *
 * Auth: CF JWT or DASHBOARD_SECRET
 */

export const prerender = false;

import type { APIRoute } from 'astro';
import { authenticateRequest } from '../../../../lib/cf-auth';
import { updateSocialDraft, getSocialDraftById } from '../../../../lib/social-drafter';

export const POST: APIRoute = async ({ request }) => {
  const user = await authenticateRequest(request);
  if (!user) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'Invalid JSON' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const { id } = body;
  if (!id) {
    return new Response(JSON.stringify({ success: false, error: 'id required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const draft = await getSocialDraftById(id);
  if (!draft) {
    return new Response(JSON.stringify({ success: false, error: 'Draft not found' }), {
      status: 404, headers: { 'Content-Type': 'application/json' },
    });
  }

  if (draft.platform !== 'facebook') {
    return new Response(JSON.stringify({ success: false, error: 'Draft is not a Facebook post' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const pageId = import.meta.env.FACEBOOK_PAGE_ID;
  const accessToken = import.meta.env.FACEBOOK_ACCESS_TOKEN;

  if (!pageId || !accessToken) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Facebook API not configured',
      setup: {
        message: 'To enable Facebook publishing, set these environment variables:',
        variables: [
          'FACEBOOK_PAGE_ID — Your Facebook Page ID',
          'FACEBOOK_ACCESS_TOKEN — Page Access Token with pages_manage_posts permission',
        ],
        docs: 'https://developers.facebook.com/docs/pages-api/posts/',
      },
    }), {
      status: 422, headers: { 'Content-Type': 'application/json' },
    });
  }

  const postContent = draft.editedContent || draft.content;
  const siteUrl = (import.meta.env.SITE_URL || 'https://www.afjltd.co.uk').replace(/\/$/, '');
  const blogUrl = draft.blogSlug ? `${siteUrl}/blog/${draft.blogSlug}` : null;

  // Build Graph API payload
  const params: Record<string, string> = {
    message: postContent,
    access_token: accessToken,
  };

  if (blogUrl) {
    params.link = blogUrl;
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const errMsg = (errData as any).error?.message || `HTTP ${res.status}`;
      console.error(`Facebook API error:`, errMsg);
      return new Response(JSON.stringify({
        success: false,
        error: `Facebook API error: ${errMsg}`,
      }), {
        status: 502, headers: { 'Content-Type': 'application/json' },
      });
    }

    // Mark as published
    await updateSocialDraft(id, {
      status: 'published',
      publishedAt: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ success: true, data: { message: 'Published to Facebook' } }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Facebook publish error:', err instanceof Error ? err.message : err);
    return new Response(JSON.stringify({ success: false, error: 'Failed to connect to Facebook API' }), {
      status: 502, headers: { 'Content-Type': 'application/json' },
    });
  }
};
