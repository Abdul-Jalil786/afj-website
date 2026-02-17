/**
 * GET  /api/admin/blog-drafts         — list all drafts
 * GET  /api/admin/blog-drafts?id=X    — get single draft
 * POST /api/admin/blog-drafts         — generate new draft / apply AI edit
 * PUT  /api/admin/blog-drafts         — update draft (accept edit, revert, publish)
 *
 * Auth: CF JWT or DASHBOARD_SECRET
 */

export const prerender = false;

import type { APIRoute } from 'astro';
import { authenticateRequest } from '../../../lib/cf-auth';
import {
  getDrafts,
  getDraftById,
  generateDraft,
  editDraft,
  applyEdit,
  revertDraft,
  updateDraft,
} from '../../../lib/blog-drafter';
import { createNotification } from '../../../lib/notifications';
import { createOrUpdateFile } from '../../../lib/github';

export const GET: APIRoute = async ({ request, url }) => {
  const user = await authenticateRequest(request);
  if (!user) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const id = url.searchParams.get('id');
  if (id) {
    const draft = await getDraftById(id);
    if (!draft) {
      return new Response(JSON.stringify({ success: false, error: 'Draft not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ success: true, data: draft }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const drafts = await getDrafts();
  return new Response(JSON.stringify({ success: true, data: drafts }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const user = await authenticateRequest(request);
  if (!user) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { action } = body;

  // Generate new draft
  if (action === 'generate') {
    const { topic, keyword, brief } = body;
    if (!topic || !keyword) {
      return new Response(JSON.stringify({ success: false, error: 'topic and keyword are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      const draft = await generateDraft({ topic, keyword, brief, source: 'admin' });
      return new Response(JSON.stringify({ success: true, data: draft }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ success: false, error: 'AI drafting failed. Try again.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }
  }

  // AI edit
  if (action === 'ai-edit') {
    const { id, instruction } = body;
    if (!id || !instruction) {
      return new Response(JSON.stringify({ success: false, error: 'id and instruction required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const draft = await getDraftById(id);
    if (!draft) {
      return new Response(JSON.stringify({ success: false, error: 'Draft not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      const newContent = await editDraft(draft.content, instruction);
      return new Response(JSON.stringify({ success: true, data: { newContent } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ success: false, error: 'AI editing failed. Try again.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }
  }

  return new Response(JSON.stringify({ success: false, error: 'Invalid action' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PUT: APIRoute = async ({ request }) => {
  const user = await authenticateRequest(request);
  if (!user) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { action, id } = body;

  if (!id) {
    return new Response(JSON.stringify({ success: false, error: 'id is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Accept an AI edit
  if (action === 'accept-edit') {
    const { instruction, newContent } = body;
    const draft = await applyEdit(id, instruction, newContent);
    if (!draft) {
      return new Response(JSON.stringify({ success: false, error: 'Draft not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ success: true, data: draft }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Revert to a previous version
  if (action === 'revert') {
    const { historyIndex } = body;
    const draft = await revertDraft(id, historyIndex);
    if (!draft) {
      return new Response(JSON.stringify({ success: false, error: 'Draft not found or invalid index' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ success: true, data: draft }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Update content directly (manual edit)
  if (action === 'update-content') {
    const { content } = body;
    const draft = await updateDraft(id, { content });
    if (!draft) {
      return new Response(JSON.stringify({ success: false, error: 'Draft not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ success: true, data: draft }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Publish
  if (action === 'publish') {
    const draft = await getDraftById(id);
    if (!draft) {
      return new Response(JSON.stringify({ success: false, error: 'Draft not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const slug = draft.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const pubDate = new Date().toISOString().split('T')[0];
    const description = draft.content.replace(/[#*\[\]]/g, '').trim().slice(0, 160);

    const frontmatter = `---
title: "${draft.title.replace(/"/g, '\\"')}"
description: "${description.replace(/"/g, '\\"')}"
pubDate: ${pubDate}
image: "/images/blog/default-blog.webp"
imageAlt: "${draft.title.replace(/"/g, '\\"')}"
tags: ["${draft.keyword.split(',')[0]?.trim() || 'transport'}"]
---`;

    const fullContent = `${frontmatter}\n\n${draft.content}`;
    const filePath = `src/content/blog/${slug}.md`;

    try {
      await createOrUpdateFile(filePath, {
        content: fullContent,
        message: `blog: publish "${draft.title}"`,
      });

      await updateDraft(id, {
        status: 'published',
        publishedAt: new Date().toISOString(),
        publishedSlug: slug,
      });

      createNotification({
        type: 'blog-draft',
        title: `Blog published: ${draft.title}`,
        summary: `The blog post "${draft.title}" is now live at /blog/${slug}. It will be available after the next deploy.`,
        actionUrl: `/blog/${slug}`,
        priority: 'low',
      }).catch(() => {});

      return new Response(
        JSON.stringify({ success: true, data: { slug, url: `/blog/${slug}` } }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    } catch (err) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to publish. GitHub API error.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }
  }

  return new Response(JSON.stringify({ success: false, error: 'Invalid action' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
};
