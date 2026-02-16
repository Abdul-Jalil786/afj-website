export const prerender = false;

import type { APIRoute } from 'astro';
import { auditLog } from '../../../lib/audit-log';
import { authenticateRequest } from '../../../lib/cf-auth';
import { createOrUpdateFile } from '../../../lib/github';
import { validateBodySize, LARGE_MAX_BYTES } from '../../../lib/validate-body';

export const POST: APIRoute = async ({ request }) => {
  // Input size validation (allow up to 200KB for blog content)
  const sizeError = await validateBodySize(request, LARGE_MAX_BYTES);
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
    const { title, slug, description, pubDate, tags, image, imageAlt, body: content } = body;

    if (!title || !slug || !description || !pubDate || !content) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: title, slug, description, pubDate, body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Build frontmatter
    const tagsArray = Array.isArray(tags) ? tags : (tags || '').split(',').map((t: string) => t.trim()).filter(Boolean);
    const frontmatter = [
      '---',
      `title: "${title.replace(/"/g, '\\"')}"`,
      `description: "${description.replace(/"/g, '\\"')}"`,
      `pubDate: ${pubDate}`,
      `author: "AFJ Limited"`,
      image ? `image: "${image}"` : null,
      imageAlt ? `imageAlt: "${imageAlt}"` : null,
      `tags: [${tagsArray.map((t: string) => `"${t}"`).join(', ')}]`,
      `draft: true`,
      '---',
    ].filter(Boolean).join('\n');

    const fileContent = `${frontmatter}\n\n${content}\n`;
    const filePath = `src/content/blog/${slug}.md`;

    const result = await createOrUpdateFile(filePath, {
      content: fileContent,
      message: `blog: add ${title}`,
    });

    await auditLog(userEmail, 'blog-create', { title, slug, path: filePath });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Blog post "${title}" created successfully`,
        url: result.htmlUrl,
        path: filePath,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Blog create error:', message);
    return new Response(
      JSON.stringify({ error: 'Failed to create blog post. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
