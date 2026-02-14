export const prerender = false;

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const secret = import.meta.env.DASHBOARD_SECRET;
  const githubToken = import.meta.env.GITHUB_TOKEN;
  const githubRepo = import.meta.env.GITHUB_REPO;

  // Auth check
  const authHeader = request.headers.get('x-dashboard-secret');
  if (!secret || authHeader !== secret) {
    return new Response(JSON.stringify({ error: 'Unauthorised' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!githubToken || !githubRepo) {
    return new Response(
      JSON.stringify({ error: 'GitHub credentials not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
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
    const encoded = Buffer.from(fileContent).toString('base64');

    // Create file via GitHub API
    const response = await fetch(
      `https://api.github.com/repos/${githubRepo}/contents/${filePath}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `blog: add ${title}`,
          content: encoded,
          branch: 'main',
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      return new Response(
        JSON.stringify({ error: 'GitHub API error', details: errorData.message }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({
        success: true,
        message: `Blog post "${title}" created successfully`,
        url: data.content?.html_url,
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
