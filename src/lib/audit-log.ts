/**
 * Simple append-only audit log for admin actions.
 * Logs to data/audit-log.json as JSON lines (one object per line).
 * Each entry records who performed the action, what they did, and when.
 */

import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';

interface AuditEntry {
  timestamp: string;
  user: string;
  action: string;
  details: Record<string, unknown>;
}

const LOG_PATH = join(process.cwd(), 'data', 'audit-log.json');

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
    await mkdir(dirname(LOG_PATH), { recursive: true });

    // Read existing entries (or start fresh)
    let entries: AuditEntry[] = [];
    try {
      const raw = await readFile(LOG_PATH, 'utf-8');
      entries = JSON.parse(raw);
      if (!Array.isArray(entries)) entries = [];
    } catch {
      // File doesn't exist or is invalid — start fresh
      entries = [];
    }

    entries.push(entry);

    await writeFile(LOG_PATH, JSON.stringify(entries, null, 2), 'utf-8');
  } catch (err) {
    // Audit logging should never break the main operation
    console.error('Audit log write failed:', err instanceof Error ? err.message : err);
  }
}
