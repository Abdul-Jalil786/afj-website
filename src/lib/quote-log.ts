/**
 * Append-only quote log for tracking all quote requests.
 * Logs to data/quote-log.jsonl as JSON lines (one JSON object per line).
 * When file exceeds 5MB, rotates to quote-log.old.jsonl.
 *
 * Privacy: only first 4 characters of postcodes are stored.
 * No IP addresses are logged.
 */

import { appendFile, stat, rename, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export interface QuoteLogEntry {
  id: string;
  timestamp: string;
  service: string;
  pickup: string;
  destination: string;
  passengers: string;
  date: string;
  time: string;
  returnType: 'one-way' | 'same-day' | 'different-day';
  quoteLow: number;
  quoteHigh: number;
  quoteTotal: number;
  source: 'website' | 'james-chat' | 'phone';
  converted: boolean;
  convertedAt: string | null;
  convertedValue: number | null;
  lostReason: string | null;
  customerName: string | null;
  notes: string | null;
}

const LOG_DIR = join(process.cwd(), 'data');
const LOG_PATH = join(LOG_DIR, 'quote-log.jsonl');
const OLD_LOG_PATH = join(LOG_DIR, 'quote-log.old.jsonl');
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/** Generate a unique quote ID: q_[timestamp]_[random4chars] */
export function generateQuoteId(): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).substring(2, 6);
  return `q_${ts}_${rand}`;
}

/** Truncate a postcode/city to first 4 chars for privacy. */
export function truncateLocation(input: string): string {
  return (input || '').trim().substring(0, 4).toUpperCase();
}

/**
 * Append a quote log entry. Fire-and-forget — never throws.
 */
export async function appendQuoteLog(entry: QuoteLogEntry): Promise<void> {
  try {
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

    await appendFile(LOG_PATH, JSON.stringify(entry) + '\n', 'utf-8');
  } catch (err) {
    console.error('Quote log write failed:', err instanceof Error ? err.message : err);
  }
}

/**
 * Read all quote log entries, optionally limited to the last N.
 */
export async function readQuoteLog(limit?: number): Promise<QuoteLogEntry[]> {
  try {
    const raw = await readFile(LOG_PATH, 'utf-8');
    const lines = raw.trim().split('\n').filter(Boolean);
    const entries = lines
      .map((line) => {
        try { return JSON.parse(line) as QuoteLogEntry; }
        catch { return null; }
      })
      .filter(Boolean) as QuoteLogEntry[];

    if (limit && limit > 0) {
      return entries.slice(-limit);
    }
    return entries;
  } catch {
    return [];
  }
}

/**
 * Update a specific quote log entry by ID.
 * Rewrites the entire file — acceptable for the expected volume (<5000 entries).
 */
export async function updateQuoteLogEntry(
  id: string,
  updates: Partial<QuoteLogEntry>,
): Promise<boolean> {
  try {
    const raw = await readFile(LOG_PATH, 'utf-8');
    const lines = raw.trim().split('\n').filter(Boolean);
    let found = false;

    const updated = lines.map((line) => {
      try {
        const entry = JSON.parse(line) as QuoteLogEntry;
        if (entry.id === id) {
          found = true;
          return JSON.stringify({ ...entry, ...updates });
        }
        return line;
      } catch {
        return line;
      }
    });

    if (found) {
      await writeFile(LOG_PATH, updated.join('\n') + '\n', 'utf-8');
    }
    return found;
  } catch {
    return false;
  }
}
