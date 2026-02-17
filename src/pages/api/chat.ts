export const prerender = false;

import type { APIRoute } from 'astro';
import { generateChat } from '../../lib/llm';
import { CHAT_ASSISTANT_SYSTEM_PROMPT } from '../../lib/prompts';
import { getJamesKnowledge } from '../../lib/james-knowledge';
import { estimateQuote } from '../../lib/quote-engine';
import { checkRateLimit, RATE_LIMITS } from '../../lib/rate-limit';
import { validateBodySize } from '../../lib/validate-body';
import { logChatMessage } from '../../lib/chat-log';
import { appendQuoteLog, generateQuoteId, truncateLocation } from '../../lib/quote-log';

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

// ---------------------------------------------------------------------------
// Quote-via-chat: detect [QUOTE_REQUEST:{...}] in LLM output, call quote engine
// ---------------------------------------------------------------------------

const QUOTE_RE = /\[QUOTE_REQUEST:(\{[^}]+\})\]/;

/** Map James's QUOTE_REQUEST JSON to the quote engine's expected format */
function mapQuoteRequest(data: any): { service: string; answers: Record<string, string> } {
  const serviceMap: Record<string, string> = {
    'private_hire': 'private-hire',
    'airport': 'airport',
    'airport_transfer': 'airport',
    'executive': 'executive',
    'executive_minibus': 'executive',
  };
  const service = serviceMap[data.service] || data.service;
  const answers: Record<string, string> = {};

  if (data.pickup) answers.pickupPostcode = String(data.pickup);
  if (data.destination) answers.destinationPostcode = String(data.destination);
  if (data.date) answers.date = String(data.date);
  if (data.time) answers.time = String(data.time);

  // Map passenger count to range key used by quote engine
  if (data.passengers != null) {
    const count = Number(data.passengers) || 1;
    if (count <= 8) answers.passengers = '1-8';
    else if (count <= 16) answers.passengers = '9-16';
    else answers.passengers = '17-24';
  }

  // Return journey
  if (data.return === true || data.return === 'yes') {
    answers.returnJourney = 'yes';
    if (data.returnDate && data.date && data.returnDate !== data.date) {
      answers.returnType = 'no'; // different-day
      answers.returnDate = String(data.returnDate);
    } else {
      answers.returnType = 'yes'; // same-day
    }
    if (data.returnTime) answers.returnPickupTime = String(data.returnTime);
  } else {
    answers.returnJourney = 'no';
  }

  // Airport-specific
  if (data.airport) answers.airport = String(data.airport);

  return { service, answers };
}

/** Scan LLM reply for QUOTE_REQUEST, call quote engine, replace with friendly result */
async function processQuoteRequest(reply: string): Promise<string> {
  const match = reply.match(QUOTE_RE);
  if (!match) return reply;

  try {
    const quoteData = JSON.parse(match[1]);
    const { service, answers } = mapQuoteRequest(quoteData);
    const estimate = await estimateQuote(service, answers);

    // Log the James-chat quote asynchronously
    const returnType: 'one-way' | 'same-day' | 'different-day' =
      !quoteData.return ? 'one-way'
        : (quoteData.returnDate && quoteData.date && quoteData.returnDate !== quoteData.date) ? 'different-day'
        : 'same-day';

    appendQuoteLog({
      id: generateQuoteId(),
      timestamp: new Date().toISOString(),
      service,
      pickup: truncateLocation(String(quoteData.pickup || '')),
      destination: truncateLocation(String(quoteData.destination || '')),
      passengers: answers.passengers || '',
      date: String(quoteData.date || ''),
      time: String(quoteData.time || ''),
      returnType,
      quoteLow: estimate.low,
      quoteHigh: estimate.high,
      quoteTotal: estimate.high, // chat quotes don't expose total
      source: 'james-chat',
      converted: false,
      convertedAt: null,
      convertedValue: null,
      lostReason: null,
      customerName: null,
      notes: null,
    }).catch(() => {});

    // Only expose the price range — never internal cost breakdowns
    const quoteReply = `Based on your journey details, the estimated cost would be around £${estimate.low} to £${estimate.high}. This is an estimate and the final price may vary. Would you like to proceed? You can contact us at info@afjltd.co.uk or call 0121 689 1000, or use our full quote wizard at /quote for more options!`;
    return reply.replace(QUOTE_RE, quoteReply);
  } catch (err) {
    console.error(JSON.stringify({
      event: 'chat_quote_error',
      error: err instanceof Error ? err.message : 'Unknown',
      timestamp: new Date().toISOString(),
    }));
    return reply.replace(
      QUOTE_RE,
      "I wasn't able to calculate an estimate for that journey. Please try our quote wizard at /quote or contact us directly at info@afjltd.co.uk.",
    );
  }
}

// ---------------------------------------------------------------------------
// Quote assistance instructions — appended to system prompt
// ---------------------------------------------------------------------------

const QUOTE_INSTRUCTIONS = `

QUOTE ASSISTANCE:
When a customer asks about prices or wants a quote, collect these details through conversation:
- Service type (private hire, airport transfer, executive minibus)
- Pickup location/postcode
- Destination location/postcode
- Date of travel
- Approximate time
- Number of passengers
- Return journey? (yes/no, same day or different day)
- If return: return time

Ask for these naturally in conversation — don't list them all at once. Start with "I can help you get an estimate! Where would you be travelling from and to?" then follow up with what's missing.

Once you have enough details, respond with EXACTLY this format on its own line:
[QUOTE_REQUEST:{"service":"private_hire","pickup":"B7 4QS","destination":"M1 1AD","date":"2026-03-01","time":"09:00","passengers":4,"return":true,"returnDate":"2026-03-01","returnTime":"17:00"}]

Do NOT make up prices. Do NOT estimate prices yourself. Always use the QUOTE_REQUEST format and wait for the system to provide the actual quote.

For SEND transport or NEPTS, do NOT offer quotes — these are contract-based. Say "SEND and patient transport are priced on a contract basis. Please contact us at info@afjltd.co.uk or fill in our contact form and our team will put together a proposal for you."

For fleet maintenance, vehicle conversions, or driver training, say "These are bespoke services — contact us directly for a tailored quote."`;

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

    // Call LLM — append quote instructions + auto-built knowledge to system prompt
    const systemPrompt = `${CHAT_ASSISTANT_SYSTEM_PROMPT}${QUOTE_INSTRUCTIONS}

YOUR KNOWLEDGE — This is everything on the AFJ website. Only use this information to answer questions. If something isn't covered here, say "I don't have that information, but our team can help — contact us at info@afjltd.co.uk":

${getJamesKnowledge()}`;

    const reply = await generateChat(
      systemPrompt,
      conversationHistory,
      MAX_RESPONSE_TOKENS,
    );

    // Process any QUOTE_REQUEST tag — call quote engine, replace with result
    const finalReply = await processQuoteRequest(reply || ERROR_REPLY);

    return new Response(
      JSON.stringify({ reply: finalReply }),
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
