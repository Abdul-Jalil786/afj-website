/**
 * Shared GitHub API utility — centralises all GitHub Contents API operations.
 * Used by blog/create, ai/page-edit, admin/approval, admin/page-apply,
 * admin/pricing, and admin/compliance endpoints.
 */

interface GitHubConfig {
  token: string;
  repo: string;
}

interface FileContent {
  content: string;
  sha: string;
}

interface WriteFileOptions {
  content: string;
  message: string;
  sha?: string;
  branch?: string;
}

interface DeleteFileOptions {
  message: string;
  sha: string;
  branch?: string;
}

interface DirectoryEntry {
  name: string;
  path: string;
  type: 'file' | 'dir';
  sha: string;
}

function getConfig(): GitHubConfig {
  const token = import.meta.env.GITHUB_TOKEN;
  const repo = import.meta.env.GITHUB_REPO;
  if (!token || !repo) {
    throw new Error('GitHub credentials not configured');
  }
  return { token, repo };
}

function headers(token: string, writable = false): Record<string, string> {
  const h: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
  };
  if (writable) h['Content-Type'] = 'application/json';
  return h;
}

function apiUrl(repo: string, path: string): string {
  return `https://api.github.com/repos/${repo}/contents/${path}`;
}

export function encodeBase64(text: string): string {
  return Buffer.from(text).toString('base64');
}

export function decodeBase64(encoded: string): string {
  return Buffer.from(encoded, 'base64').toString('utf-8');
}

/**
 * Read a file from the repo. Returns decoded content + SHA.
 */
export async function getFileContent(path: string): Promise<FileContent> {
  const { token, repo } = getConfig();
  const res = await fetch(apiUrl(repo, path), { headers: headers(token) });
  if (!res.ok) {
    throw new Error(`GitHub: could not read ${path} (${res.status})`);
  }
  const data = await res.json();
  return {
    content: decodeBase64((data as any).content),
    sha: (data as any).sha,
  };
}

/**
 * Create or update a file. Omit `sha` for new files.
 * Content should be the raw string — it will be base64-encoded internally.
 */
export async function createOrUpdateFile(
  path: string,
  opts: WriteFileOptions,
): Promise<{ success: boolean; htmlUrl?: string }> {
  const { token, repo } = getConfig();
  const body: Record<string, string> = {
    message: opts.message,
    content: encodeBase64(opts.content),
    branch: opts.branch || 'main',
  };
  if (opts.sha) body.sha = opts.sha;

  const res = await fetch(apiUrl(repo, path), {
    method: 'PUT',
    headers: headers(token, true),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(`GitHub API error: ${(errData as any).message || res.statusText}`);
  }

  const data = await res.json();
  return { success: true, htmlUrl: (data as any).content?.html_url };
}

/**
 * Delete a file from the repo.
 */
export async function deleteFile(
  path: string,
  opts: DeleteFileOptions,
): Promise<boolean> {
  const { token, repo } = getConfig();
  const res = await fetch(apiUrl(repo, path), {
    method: 'DELETE',
    headers: headers(token, true),
    body: JSON.stringify({
      message: opts.message,
      sha: opts.sha,
      branch: opts.branch || 'main',
    }),
  });
  return res.ok;
}

/**
 * List files in a directory. Returns 404 as empty array (directory may not exist yet).
 */
export async function listDirectory(path: string): Promise<DirectoryEntry[]> {
  const { token, repo } = getConfig();
  const res = await fetch(apiUrl(repo, path), { headers: headers(token) });
  if (res.status === 404) return [];
  if (!res.ok) {
    throw new Error(`GitHub: could not list ${path} (${res.status})`);
  }
  const data = await res.json();
  return (data as any[]).map((f) => ({
    name: f.name,
    path: f.path,
    type: f.type,
    sha: f.sha,
  }));
}

/**
 * Read-then-update pattern: fetches current SHA then writes new content.
 * Convenience wrapper for pricing/compliance-style updates.
 */
export async function updateFileContent(
  path: string,
  content: string,
  message: string,
): Promise<{ success: boolean }> {
  let sha = '';
  try {
    const existing = await getFileContent(path);
    sha = existing.sha;
  } catch {
    // File may not exist yet — create without SHA
  }
  await createOrUpdateFile(path, { content, message, sha });
  return { success: true };
}
