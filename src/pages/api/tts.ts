export const prerender = false;

import type { APIRoute } from 'astro';
import { checkRateLimit, RATE_LIMITS } from '../../lib/rate-limit';
import { validateBodySize } from '../../lib/validate-body';
import { checkTtsUsage, recordTtsUsage } from '../../lib/tts-usage';

const JSON_HEADERS = { 'Content-Type': 'application/json' };
const MAX_TEXT_LENGTH = 1000;
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

export const POST: APIRoute = async ({ request }) => {
  console.log("TTS endpoint hit, OPENAI_API_KEY set:", !!process.env.OPENAI_API_KEY, "key prefix:", process.env.OPENAI_API_KEY?.substring(0, 10));

  // Rate limit: per-minute per IP (same as chat)
  const minCheck = checkRateLimit(request, 'ttsMin', RATE_LIMITS.chatPerMinute);
  if (!minCheck.allowed) {
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded' }),
      { status: 429, headers: JSON_HEADERS },
    );
  }

  // Rate limit: per-hour per IP
  const hrCheck = checkRateLimit(request, 'ttsHr', RATE_LIMITS.chatPerHour);
  if (!hrCheck.allowed) {
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded' }),
      { status: 429, headers: JSON_HEADERS },
    );
  }

  // Rate limit: global hourly
  if (!checkGlobalLimit()) {
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded' }),
      { status: 429, headers: JSON_HEADERS },
    );
  }

  // Body size validation
  const sizeError = await validateBodySize(request);
  if (sizeError) return sizeError;

  const apiKey = import.meta.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'TTS not configured' }),
      { status: 503, headers: JSON_HEADERS },
    );
  }

  try {
    const body = await request.json();
    const { text } = body;

    // Validate text
    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: JSON_HEADERS },
      );
    }

    const cleanText = text.trim();
    if (cleanText.length === 0 || cleanText.length > MAX_TEXT_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Text must be 1-${MAX_TEXT_LENGTH} characters` }),
        { status: 400, headers: JSON_HEADERS },
      );
    }

    // Check daily usage limit (50,000 chars/day)
    const withinLimit = await checkTtsUsage(cleanText.length);
    if (!withinLimit) {
      return new Response(
        JSON.stringify({ error: 'Daily TTS limit reached', fallback: true }),
        { status: 429, headers: JSON_HEADERS },
      );
    }

    // Call OpenAI TTS API
    const start = Date.now();
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: cleanText,
        voice: 'ash',
        response_format: 'mp3',
        speed: 1.0,
      }),
    });

    const latency = Date.now() - start;

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = (errData as any).error?.message || response.statusText;

      console.error(JSON.stringify({
        event: 'tts_error',
        status: response.status,
        error: errMsg,
        latencyMs: latency,
        textLength: cleanText.length,
        timestamp: new Date().toISOString(),
      }));

      return new Response(
        JSON.stringify({ error: 'TTS generation failed', fallback: true }),
        { status: 502, headers: JSON_HEADERS },
      );
    }

    // Record usage
    await recordTtsUsage(cleanText.length).catch(() => {});

    console.log(JSON.stringify({
      event: 'tts_call',
      latencyMs: latency,
      textLength: cleanText.length,
      success: true,
      timestamp: new Date().toISOString(),
    }));

    // Stream the audio back to client
    const audioData = await response.arrayBuffer();
    return new Response(audioData, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (err) {
    console.error(JSON.stringify({
      event: 'tts_error',
      error: err instanceof Error ? err.message : 'Unknown',
      timestamp: new Date().toISOString(),
    }));

    return new Response(
      JSON.stringify({ error: 'TTS generation failed', fallback: true }),
      { status: 500, headers: JSON_HEADERS },
    );
  }
};
