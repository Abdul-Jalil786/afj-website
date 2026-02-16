/**
 * Append-only audit log for admin actions.
 * Logs to data/audit-log.jsonl as JSON lines (one JSON object per line).
 * When file exceeds 5MB, rotates to audit-log.old.jsonl.
 */

import { appendFile, stat, rename, mkdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';

interface AuditEntry {
  timestamp: string;
  user: string;
  action: string;
  details: Record<string, unknown>;
}

const LOG_DIR = join(process.cwd(), 'data');
const LOG_PATH = join(LOG_DIR, 'audit-log.jsonl');
const OLD_LOG_PATH = join(LOG_DIR, 'audit-log.old.jsonl');
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function auditLog(
  user: string,
  action: string,
  details: Record<string, unknown> = {},
): Promise<void> {
  const entry: AuditEntry = {
    timestamp: new Date().toISOString(),
    user,
    action,
    details,
  };

  try {
    // Ensure data/ directory exists
    await mkdir(LOG_DIR, { recursive: true });

    // Check file size for rotation
    try {
      const stats = await stat(LOG_PATH);
      if (stats.size > MAX_SIZE_BYTES) {
        await rename(LOG_PATH, OLD_LOG_PATH).catch(() => {});
      }
    } catch {
      // File doesn't exist yet — that's fine
    }

    // Append as a single JSON line
    await appendFile(LOG_PATH, JSON.stringify(entry) + '\n', 'utf-8');
  } catch (err) {
    // Audit logging should never break the main operation
    console.error('Audit log write failed:', err instanceof Error ? err.message : err);
  }
}

/**
 * Read the last N audit log entries (default 100).
 */
export async function readAuditLog(limit: number = 100): Promise<AuditEntry[]> {
  try {
    const raw = await readFile(LOG_PATH, 'utf-8');
    const lines = raw.trim().split('\n').filter(Boolean);
    const entries = lines
      .map((line) => {
        try { return JSON.parse(line) as AuditEntry; }
        catch { return null; }
      })
      .filter(Boolean) as AuditEntry[];

    // Return the last N entries (most recent last)
    return entries.slice(-limit);
  } catch {
    return [];
  }
}
