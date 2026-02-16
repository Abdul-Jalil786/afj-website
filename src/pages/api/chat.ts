export const prerender = false;

import type { APIRoute } from 'astro';
import { generateChat } from '../../lib/llm';
import { CHAT_ASSISTANT_SYSTEM_PROMPT } from '../../lib/prompts';
import { getJamesKnowledge } from '../../lib/james-knowledge';
import { checkRateLimit, RATE_LIMITS } from '../../lib/rate-limit';
import { validateBodySize } from '../../lib/validate-body';
import { logChatMessage } from '../../lib/chat-log';

const JSON_HEADERS = { 'Content-Type': 'application/json' };
const MAX_MESSAGE_LENGTH = 500;
const MAX_HISTORY_ITEMS = 20;
const HISTORY_SENT_TO_LLM = 10;
const MAX_RESPONSE_TOKENS = 300;
const GLOBAL_HOURLY_LIMIT = 200;

// Global hourly counter (all users combined)
let globalCount = 0;
let globalResetAt = Date.now() + 60 * 60 * 1000;

function checkGlobalLimit(): boolean {
  const now = Date.now();
  if (now > globalResetAt) {
    globalCount = 0;
    globalResetAt = now + 60 * 60 * 1000;
  }
  globalCount++;
  return globalCount <= GLOBAL_HOURLY_LIMIT;
}

function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '');
}

const RATE_LIMIT_REPLY = "I'm quite busy right now. Please try again in a moment, or contact us directly at info@afjltd.co.uk";
const ERROR_REPLY = "I'm having a bit of trouble right now. Please try again in a moment, or contact us at info@afjltd.co.uk";

export const POST: APIRoute = async ({ request }) => {
  // Rate limit: per-minute per IP
  const minCheck = checkRateLimit(request, 'chatMin', RATE_LIMITS.chatPerMinute);
  if (!minCheck.allowed) {
    return new Response(
      JSON.stringify({ reply: RATE_LIMIT_REPLY }),
      { status: 429, headers: JSON_HEADERS },
    );
  }

  // Rate limit: per-hour per IP
  const hrCheck = checkRateLimit(request, 'chatHr', RATE_LIMITS.chatPerHour);
  if (!hrCheck.allowed) {
    return new Response(
      JSON.stringify({ reply: RATE_LIMIT_REPLY }),
      { status: 429, headers: JSON_HEADERS },
    );
  }

  // Rate limit: global hourly
  if (!checkGlobalLimit()) {
    return new Response(
      JSON.stringify({ reply: RATE_LIMIT_REPLY }),
      { status: 429, headers: JSON_HEADERS },
    );
  }

  // Body size validation
  const sizeError = await validateBodySize(request);
  if (sizeError) return sizeError;

  try {
    const body = await request.json();
    const { message, history } = body;

    // Validate message
    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ reply: 'Please type a message to get started.' }),
        { status: 400, headers: JSON_HEADERS },
      );
    }

    const cleanMessage = stripHtml(message).trim();

    if (cleanMessage.length === 0) {
      return new Response(
        JSON.stringify({ reply: 'Please type a message to get started.' }),
        { status: 400, headers: JSON_HEADERS },
      );
    }

    if (cleanMessage.length > MAX_MESSAGE_LENGTH) {
      return new Response(
        JSON.stringify({ reply: `Please keep your message under ${MAX_MESSAGE_LENGTH} characters.` }),
        { status: 400, headers: JSON_HEADERS },
      );
    }

    // Validate history
    if (history && (!Array.isArray(history) || history.length > MAX_HISTORY_ITEMS)) {
      return new Response(
        JSON.stringify({ reply: 'Something went wrong. Please refresh and try again.' }),
        { status: 400, headers: JSON_HEADERS },
      );
    }

    // Build conversation messages for LLM
    const conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    if (Array.isArray(history)) {
      // Take last N messages to send to LLM
      const trimmed = history.slice(-HISTORY_SENT_TO_LLM);
      for (const msg of trimmed) {
        if (
          msg &&
          typeof msg === 'object' &&
          (msg.role === 'user' || msg.role === 'assistant') &&
          typeof msg.content === 'string'
        ) {
          conversationHistory.push({
            role: msg.role,
            content: msg.content.substring(0, 1000),
          });
        }
      }
    }

    // Add current message
    conversationHistory.push({ role: 'user', content: cleanMessage });

    // Log first message only (no IP, no full conversation)
    if (!history || history.length === 0) {
      logChatMessage(cleanMessage).catch(() => {});
    }

    // Call LLM — append auto-built knowledge to system prompt
    const systemPrompt = `${CHAT_ASSISTANT_SYSTEM_PROMPT}

YOUR KNOWLEDGE — This is everything on the AFJ website. Only use this information to answer questions. If something isn't covered here, say "I don't have that information, but our team can help — contact us at info@afjltd.co.uk":

${getJamesKnowledge()}`;

    const reply = await generateChat(
      systemPrompt,
      conversationHistory,
      MAX_RESPONSE_TOKENS,
    );

    return new Response(
      JSON.stringify({ reply: reply || ERROR_REPLY }),
      { status: 200, headers: JSON_HEADERS },
    );
  } catch (err) {
    console.error(JSON.stringify({
      event: 'chat_error',
      error: err instanceof Error ? err.message : 'Unknown',
      timestamp: new Date().toISOString(),
    }));

    return new Response(
      JSON.stringify({ reply: ERROR_REPLY }),
      { status: 200, headers: JSON_HEADERS },
    );
  }
};
