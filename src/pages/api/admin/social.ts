/**
 * GET  /api/admin/social              — list all social drafts
 * GET  /api/admin/social?id=X         — get single draft
 * POST /api/admin/social              — generate draft / AI rewrite
 * PUT  /api/admin/social              — update draft (approve, edit, reject, delete)
 *
 * Auth: CF JWT or DASHBOARD_SECRET
 */

export const prerender = false;

import type { APIRoute } from 'astro';
import { authenticateRequest } from '../../../lib/cf-auth';
import {
  getSocialDrafts,
  getSocialDraftById,
  generateManualDraft,
  generateBlogSocialDrafts,
  rewriteDraft,
  updateSocialDraft,
  deleteSocialDraft,
} from '../../../lib/social-drafter';
import { createNotification } from '../../../lib/notifications';

export const GET: APIRoute = async ({ request, url }) => {
  const user = await authenticateRequest(request);
  if (!user) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }

  const id = url.searchParams.get('id');
  if (id) {
    const draft = await getSocialDraftById(id);
    if (!draft) {
      return new Response(JSON.stringify({ success: false, error: 'Draft not found' }), {
        status: 404, headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ success: true, data: draft }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  }

  const drafts = await getSocialDrafts();
  const platform = url.searchParams.get('platform');
  const status = url.searchParams.get('status');

  let filtered = drafts;
  if (platform) filtered = filtered.filter(d => d.platform === platform);
  if (status) filtered = filtered.filter(d => d.status === status);

  // Sort newest first
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return new Response(JSON.stringify({ success: true, data: filtered }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
};

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

  const { action } = body;

  // Generate manual draft
  if (action === 'generate') {
    const { platform, topic, brief } = body;
    if (!platform || !topic) {
      return new Response(JSON.stringify({ success: false, error: 'platform and topic required' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      const draft = await generateManualDraft({ platform, topic, brief });
      return new Response(JSON.stringify({ success: true, data: draft }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ success: false, error: 'AI generation failed. Try again.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }
  }

  // Generate blog social drafts
  if (action === 'generate-blog') {
    const { blogTitle, blogSlug, blogContent } = body;
    if (!blogTitle || !blogSlug) {
      return new Response(JSON.stringify({ success: false, error: 'blogTitle and blogSlug required' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      const drafts = await generateBlogSocialDrafts({ blogTitle, blogSlug, blogContent: blogContent || '' });
      return new Response(JSON.stringify({ success: true, data: drafts }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ success: false, error: 'Social draft generation failed.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }
  }

  // AI rewrite
  if (action === 'rewrite') {
    const { id, instruction } = body;
    if (!id || !instruction) {
      return new Response(JSON.stringify({ success: false, error: 'id and instruction required' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      const newContent = await rewriteDraft(id, instruction);
      return new Response(JSON.stringify({ success: true, data: { newContent: newContent.trim() } }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ success: false, error: 'AI rewrite failed. Try again.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }
  }

  return new Response(JSON.stringify({ success: false, error: 'Invalid action' }), {
    status: 400, headers: { 'Content-Type': 'application/json' },
  });
};

export const PUT: APIRoute = async ({ request }) => {
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

  const { id, action } = body;
  if (!id) {
    return new Response(JSON.stringify({ success: false, error: 'id required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  if (action === 'approve') {
    const draft = await updateSocialDraft(id, { status: 'approved' });
    if (!draft) {
      return new Response(JSON.stringify({ success: false, error: 'Draft not found' }), {
        status: 404, headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ success: true, data: draft }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  }

  if (action === 'reject') {
    const draft = await updateSocialDraft(id, { status: 'rejected' });
    if (!draft) {
      return new Response(JSON.stringify({ success: false, error: 'Draft not found' }), {
        status: 404, headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ success: true, data: draft }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  }

  if (action === 'edit') {
    const { editedContent } = body;
    const draft = await updateSocialDraft(id, { editedContent });
    if (!draft) {
      return new Response(JSON.stringify({ success: false, error: 'Draft not found' }), {
        status: 404, headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ success: true, data: draft }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  }

  if (action === 'mark-published') {
    const draft = await updateSocialDraft(id, {
      status: 'published',
      publishedAt: new Date().toISOString(),
    });
    if (!draft) {
      return new Response(JSON.stringify({ success: false, error: 'Draft not found' }), {
        status: 404, headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ success: true, data: draft }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  }

  if (action === 'delete') {
    const ok = await deleteSocialDraft(id);
    if (!ok) {
      return new Response(JSON.stringify({ success: false, error: 'Draft not found' }), {
        status: 404, headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: false, error: 'Invalid action' }), {
    status: 400, headers: { 'Content-Type': 'application/json' },
  });
};
