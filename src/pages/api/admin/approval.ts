export const prerender = false;

import type { APIRoute } from 'astro';
import departments from '../../../data/departments.json';
import { auditLog } from '../../../lib/audit-log';
import { authenticateRequest } from '../../../lib/cf-auth';
import { escapeHtml } from '../../../lib/utils';
import { validateBodySize } from '../../../lib/validate-body';
import {
  listDirectory,
  getFileContent,
  createOrUpdateFile,
  deleteFile,
} from '../../../lib/github';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

function getDepartment(email: string) {
  for (const [key, dept] of Object.entries(departments)) {
    if ((dept as any).emails.includes(email)) {
      return { key, name: (dept as any).name, canApprove: (dept as any).canApprove };
    }
  }
  // Unrecognised email — no department match, no approval rights
  return { key: 'unknown', name: 'Unknown', canApprove: false };
}

async function sendEmail(to: string, subject: string, bodyHtml: string) {
  const resendKey = import.meta.env.RESEND_API_KEY || process.env.RESEND_KEY || '';
  if (!resendKey) return;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'AFJ Admin <noreply@afjltd.co.uk>',
      to: [to],
      subject,
      html: bodyHtml,
    }),
  });
}

function emailTemplate(heading: string, message: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1A365D; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 20px;">${heading}</h1>
      </div>
      <div style="padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
        ${message}
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 14px; color: #718096;">AFJ Admin Dashboard</p>
      </div>
    </div>
  `.trim();
}

// ---------------------------------------------------------------------------
// GET — list pending items
// ---------------------------------------------------------------------------
export const GET: APIRoute = async ({ request }) => {
  const userEmail = await authenticateRequest(request);
  if (!userEmail) {
    return new Response(JSON.stringify({ error: 'Unauthorised' }), { status: 401, headers: JSON_HEADERS });
  }

  try {
    const files = await listDirectory('pending');
    const items = [];

    for (const file of files) {
      if (!file.name.endsWith('.json')) continue;
      try {
        const fileData = await getFileContent(file.path);
        const content = JSON.parse(fileData.content);
        content._sha = fileData.sha;
        content._path = file.path;
        items.push(content);
      } catch {
        continue;
      }
    }

    // Filter: management sees all, others see only their own
    const { canApprove } = getDepartment(userEmail);
    const filtered = canApprove ? items : items.filter((i: any) => i.author === userEmail);

    return new Response(JSON.stringify({ success: true, items: filtered }), { status: 200, headers: JSON_HEADERS });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: JSON_HEADERS });
  }
};

// ---------------------------------------------------------------------------
// POST — submit content for approval
// ---------------------------------------------------------------------------
export const POST: APIRoute = async ({ request }) => {
  const sizeError = await validateBodySize(request);
  if (sizeError) return sizeError;

  const userEmail = await authenticateRequest(request);
  if (!userEmail) {
    return new Response(JSON.stringify({ error: 'Unauthorised' }), { status: 401, headers: JSON_HEADERS });
  }

  try {
    const body = await request.json();
    const { type, title, content, metadata } = body;

    if (!type || !title || !content) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: type, title, content' }),
        { status: 400, headers: JSON_HEADERS },
      );
    }

    const { name: departmentName } = getDepartment(userEmail);
    const timestamp = new Date().toISOString();
    const id = `${Date.now()}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`;

    const pendingItem = {
      id,
      type, // 'blog' or 'page-edit'
      status: 'pending',
      title,
      author: userEmail,
      department: departmentName,
      timestamp,
      content,
      metadata: metadata || {},
    };

    const filePath = `pending/${id}.json`;
    await createOrUpdateFile(filePath, {
      content: JSON.stringify(pendingItem, null, 2),
      message: `pending: ${type} from ${departmentName} — ${title}`,
    });

    // Send notification email to management
    const notificationEmail = import.meta.env.NOTIFICATION_EMAIL || 'info@afjltd.co.uk';
    await sendEmail(
      notificationEmail,
      `New content pending approval: ${escapeHtml(title)}`,
      emailTemplate('New Content Pending Approval', `
        <p style="font-size: 16px; color: #2D3748;">New content pending approval from <strong>${escapeHtml(userEmail)}</strong> in <strong>${escapeHtml(departmentName)}</strong>:</p>
        <p style="font-size: 18px; color: #1A365D; font-weight: bold;">${escapeHtml(title)}</p>
        <p style="font-size: 14px; color: #718096;">Type: ${type === 'blog' ? 'Blog Post' : 'Page Edit'}</p>
        <p style="font-size: 14px; color: #718096;">Submitted: ${new Date(timestamp).toLocaleString('en-GB')}</p>
        <p style="margin-top: 16px;"><a href="https://www.afjltd.co.uk/admin/approvals" style="background: #38A169; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">Review Now</a></p>
      `),
    );

    await auditLog(userEmail, 'approval-submit', { id, type, title });

    return new Response(
      JSON.stringify({ success: true, message: 'Content submitted for approval', id }),
      { status: 201, headers: JSON_HEADERS },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: JSON_HEADERS });
  }
};

// ---------------------------------------------------------------------------
// PUT — approve or reject
// ---------------------------------------------------------------------------
export const PUT: APIRoute = async ({ request }) => {
  const sizeError = await validateBodySize(request);
  if (sizeError) return sizeError;

  const userEmail = await authenticateRequest(request);
  if (!userEmail) {
    return new Response(JSON.stringify({ error: 'Unauthorised' }), { status: 401, headers: JSON_HEADERS });
  }

  const { canApprove } = getDepartment(userEmail);
  if (!canApprove) {
    return new Response(JSON.stringify({ error: 'You do not have approval permissions' }), { status: 403, headers: JSON_HEADERS });
  }

  try {
    const body = await request.json();
    const { action, filePath, fileSha, item, reason } = body;

    if (!action || !filePath || !fileSha || !item) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: action, filePath, fileSha, item' }),
        { status: 400, headers: JSON_HEADERS },
      );
    }

    if (action === 'approve') {
      // Publish the content
      if (item.type === 'blog') {
        const draft = item.content;
        const frontmatterMatch = draft.match(/^---\n([\s\S]*?)\n---/);
        let title = item.title;
        let description = '';
        let pubDate = new Date().toISOString().split('T')[0];
        let image = '';
        let imageAlt = '';
        let tags: string[] = [];
        let blogBody = draft;

        if (frontmatterMatch) {
          const fm = frontmatterMatch[1];
          const titleMatch = fm.match(/title:\s*"(.+?)"/);
          const descMatch = fm.match(/description:\s*"(.+?)"/);
          const dateMatch = fm.match(/pubDate:\s*(\S+)/);
          const imageMatch = fm.match(/image:\s*"(.+?)"/);
          const altMatch = fm.match(/imageAlt:\s*"(.+?)"/);
          const tagsMatch = fm.match(/tags:\s*\[(.+?)\]/);

          if (titleMatch) title = titleMatch[1];
          if (descMatch) description = descMatch[1];
          if (dateMatch) pubDate = dateMatch[1];
          if (imageMatch) image = imageMatch[1];
          if (altMatch) imageAlt = altMatch[1];
          if (tagsMatch) tags = tagsMatch[1].replace(/"/g, '').split(',').map((t: string) => t.trim());

          blogBody = draft.replace(/^---[\s\S]*?---\s*/, '').trim();
        }

        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const frontmatter = [
          '---',
          `title: "${title.replace(/"/g, '\\"')}"`,
          `description: "${description.replace(/"/g, '\\"')}"`,
          `pubDate: ${pubDate}`,
          `author: "AFJ Limited"`,
          image ? `image: "${image}"` : null,
          imageAlt ? `imageAlt: "${imageAlt}"` : null,
          `tags: [${tags.map((t: string) => `"${t}"`).join(', ')}]`,
          `draft: false`,
          '---',
        ].filter(Boolean).join('\n');

        const fileContent = `${frontmatter}\n\n${blogBody}\n`;
        const blogPath = `src/content/blog/${slug}.md`;

        await createOrUpdateFile(blogPath, {
          content: fileContent,
          message: `blog: publish ${title} (approved by ${userEmail})`,
        });
      }

      // Delete the pending file
      await deleteFile(filePath, {
        message: `approved: ${item.title} by ${userEmail}`,
        sha: fileSha,
      });

      // Notify the author
      if (item.author && item.author !== userEmail) {
        await sendEmail(
          item.author,
          `Your content has been approved: ${escapeHtml(item.title)}`,
          emailTemplate('Content Approved', `
            <p style="font-size: 16px; color: #2D3748;">Your content <strong>"${escapeHtml(item.title)}"</strong> has been approved and published.</p>
            <p style="font-size: 14px; color: #718096;">Approved by: ${escapeHtml(userEmail)}</p>
          `),
        );
      }

      await auditLog(userEmail, 'approval-approve', { title: item.title, type: item.type, author: item.author });

      return new Response(
        JSON.stringify({ success: true, message: `Approved and published: ${item.title}` }),
        { status: 200, headers: JSON_HEADERS },
      );
    }

    if (action === 'reject') {
      const rejectedItem = { ...item, status: 'rejected', rejectedBy: userEmail, rejectionReason: reason || '', rejectedAt: new Date().toISOString() };

      await createOrUpdateFile(filePath, {
        content: JSON.stringify(rejectedItem, null, 2),
        message: `rejected: ${item.title} by ${userEmail}`,
        sha: fileSha,
      });

      // Notify the author
      if (item.author && item.author !== userEmail) {
        const reasonText = reason ? `<p style="font-size: 14px; color: #E53E3E; margin-top: 8px;">Feedback: ${escapeHtml(reason)}</p>` : '';
        await sendEmail(
          item.author,
          `Your content needs revision: ${escapeHtml(item.title)}`,
          emailTemplate('Content Needs Revision', `
            <p style="font-size: 16px; color: #2D3748;">Your content <strong>"${escapeHtml(item.title)}"</strong> needs revision.</p>
            ${reasonText}
            <p style="font-size: 14px; color: #718096;">Reviewed by: ${escapeHtml(userEmail)}</p>
            <p style="margin-top: 16px;"><a href="https://www.afjltd.co.uk/admin/content" style="background: #1A365D; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">Edit in Dashboard</a></p>
          `),
        );
      }

      await auditLog(userEmail, 'approval-reject', { title: item.title, type: item.type, author: item.author, reason: reason || '' });

      return new Response(
        JSON.stringify({ success: true, message: `Rejected: ${item.title}` }),
        { status: 200, headers: JSON_HEADERS },
      );
    }

    return new Response(JSON.stringify({ error: 'Invalid action. Use "approve" or "reject".' }), { status: 400, headers: JSON_HEADERS });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: JSON_HEADERS });
  }
};
