/**
 * TTS daily usage tracker.
 * Tracks characters sent to OpenAI TTS per day.
 * Falls back to browser TTS if daily limit (50,000 chars) is exceeded.
 * Stores usage in src/data/tts-usage.json.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

interface TtsUsageData {
  date: string;
  charsUsed: number;
}

const DATA_DIR = join(process.cwd(), 'data');
const USAGE_PATH = join(DATA_DIR, 'tts-usage.json');
const DAILY_CHAR_LIMIT = 50_000;

let cached: TtsUsageData | null = null;

function todayStr(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

async function loadUsage(): Promise<TtsUsageData> {
  const today = todayStr();

  // Use cache if same day
  if (cached && cached.date === today) return cached;

  try {
    const raw = await readFile(USAGE_PATH, 'utf-8');
    const data: TtsUsageData = JSON.parse(raw);
    if (data.date === today) {
      cached = data;
      return data;
    }
  } catch {
    // File doesn't exist or is invalid — start fresh
  }

  // New day or no file
  const fresh: TtsUsageData = { date: today, charsUsed: 0 };
  cached = fresh;
  return fresh;
}

async function saveUsage(data: TtsUsageData): Promise<void> {
  try {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(USAGE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    cached = data;
  } catch (err) {
    console.error('TTS usage write failed:', err instanceof Error ? err.message : err);
  }
}

/**
 * Check if TTS usage is within the daily limit.
 * @param charCount - Number of characters about to be sent
 * @returns true if within limit, false if exceeded
 */
export async function checkTtsUsage(charCount: number): Promise<boolean> {
  const usage = await loadUsage();
  return (usage.charsUsed + charCount) <= DAILY_CHAR_LIMIT;
}

/**
 * Record TTS character usage for the day.
 * Call this AFTER a successful TTS API call.
 * @param charCount - Number of characters sent
 */
export async function recordTtsUsage(charCount: number): Promise<void> {
  const usage = await loadUsage();
  usage.charsUsed += charCount;
  await saveUsage(usage);
}
