/**
 * POST /api/admin/social/publish-linkedin
 *
 * Publishes an approved social draft to LinkedIn via the UGC Post API.
 * Requires LINKEDIN_ORG_ID and LINKEDIN_ACCESS_TOKEN environment variables.
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

  if (draft.platform !== 'linkedin') {
    return new Response(JSON.stringify({ success: false, error: 'Draft is not a LinkedIn post' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const orgId = import.meta.env.LINKEDIN_ORG_ID;
  const accessToken = import.meta.env.LINKEDIN_ACCESS_TOKEN;

  if (!orgId || !accessToken) {
    return new Response(JSON.stringify({
      success: false,
      error: 'LinkedIn API not configured',
      setup: {
        message: 'To enable LinkedIn publishing, set these environment variables:',
        variables: [
          'LINKEDIN_ORG_ID — Your LinkedIn organisation page ID',
          'LINKEDIN_ACCESS_TOKEN — OAuth 2.0 access token with w_organization_social scope',
        ],
        docs: 'https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/ugc-post-api',
      },
    }), {
      status: 422, headers: { 'Content-Type': 'application/json' },
    });
  }

  const postContent = draft.editedContent || draft.content;
  const siteUrl = (import.meta.env.SITE_URL || 'https://www.afjltd.co.uk').replace(/\/$/, '');
  const blogUrl = draft.blogSlug ? `${siteUrl}/blog/${draft.blogSlug}` : null;

  // Build UGC Post payload
  const ugcPost: any = {
    author: `urn:li:organization:${orgId}`,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text: postContent },
        shareMediaCategory: blogUrl ? 'ARTICLE' : 'NONE',
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  };

  // Add article link if from blog
  if (blogUrl) {
    ugcPost.specificContent['com.linkedin.ugc.ShareContent'].media = [{
      status: 'READY',
      originalUrl: blogUrl,
    }];
  }

  try {
    const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(ugcPost),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`LinkedIn API error (${res.status}):`, errText);
      return new Response(JSON.stringify({
        success: false,
        error: `LinkedIn API returned ${res.status}. Check your access token and permissions.`,
      }), {
        status: 502, headers: { 'Content-Type': 'application/json' },
      });
    }

    // Mark as published
    await updateSocialDraft(id, {
      status: 'published',
      publishedAt: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ success: true, data: { message: 'Published to LinkedIn' } }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('LinkedIn publish error:', err instanceof Error ? err.message : err);
    return new Response(JSON.stringify({ success: false, error: 'Failed to connect to LinkedIn API' }), {
      status: 502, headers: { 'Content-Type': 'application/json' },
    });
  }
};
