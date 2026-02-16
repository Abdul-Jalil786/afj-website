export const prerender = false;

import type { APIRoute } from 'astro';
import { auditLog } from '../../../lib/audit-log';
import { createOrUpdateFile, encodeBase64 } from '../../../lib/github';

export const POST: APIRoute = async ({ request }) => {
  const secret = import.meta.env.DASHBOARD_SECRET;

  // Auth: accept either DASHBOARD_SECRET header or Cloudflare Access JWT
  const authHeader = request.headers.get('x-dashboard-secret');
  const cfJwt = request.headers.get('Cf-Access-Jwt-Assertion');
  if ((!secret || authHeader !== secret) && !cfJwt) {
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

    const userEmail = request.headers.get('Cf-Access-Authenticated-User-Email') || 'api-client';
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
    return new Response(
      JSON.stringify({ error: 'Failed to create blog post', details: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
