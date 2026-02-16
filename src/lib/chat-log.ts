/**
 * Simple chat analytics logger.
 * Logs first user message per conversation to data/chat-log.jsonl.
 * Does NOT log IP addresses or full conversations (privacy).
 * Rotates at 2 MB — smaller than audit log since it's public-facing.
 */

import { appendFile, stat, rename, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

interface ChatLogEntry {
  timestamp: string;
  firstMessage: string;
  messageLength: number;
}

const LOG_DIR = join(process.cwd(), 'data');
const LOG_PATH = join(LOG_DIR, 'chat-log.jsonl');
const OLD_LOG_PATH = join(LOG_DIR, 'chat-log.old.jsonl');
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

export async function logChatMessage(firstMessage: string): Promise<void> {
  const entry: ChatLogEntry = {
    timestamp: new Date().toISOString(),
    firstMessage: firstMessage.substring(0, 200),
    messageLength: firstMessage.length,
  };

  try {
    await mkdir(LOG_DIR, { recursive: true });

    try {
      const stats = await stat(LOG_PATH);
      if (stats.size > MAX_SIZE_BYTES) {
        await rename(LOG_PATH, OLD_LOG_PATH).catch(() => {});
      }
    } catch {
      // File doesn't exist yet — fine
    }

    await appendFile(LOG_PATH, JSON.stringify(entry) + '\n', 'utf-8');
  } catch (err) {
    // Chat logging should never break the main operation
    console.error('Chat log write failed:', err instanceof Error ? err.message : err);
  }
}
