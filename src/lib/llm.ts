/**
 * LLM Provider Abstraction
 *
 * Single entry point for all AI features. Supports:
 * - Anthropic (claude-haiku-4-5-20251001) — default
 * - Groq (llama-3.3-70b-versatile) — swap-ready alternative
 *
 * Configuration via environment variables:
 *   LLM_PROVIDER  = 'anthropic' | 'groq'
 *   LLM_MODEL     = model identifier
 *   LLM_API_KEY   = API key for chosen provider
 *   LLM_MAX_TOKENS = default max tokens (default: 2048)
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LLMConfig {
  provider: 'anthropic' | 'groq';
  model: string;
  apiKey: string;
  maxTokens: number;
}

export interface LLMMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface LLMRequest {
  system: string;
  messages: LLMMessage[];
  maxTokens?: number;
}

export interface LLMResponse {
  success: boolean;
  content?: string;
  tokensUsed?: { input: number; output: number };
  error?: string;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export function getConfig(): LLMConfig {
  const provider = (import.meta.env.LLM_PROVIDER || 'anthropic') as LLMConfig['provider'];
  const model = import.meta.env.LLM_MODEL || 'claude-haiku-4-5-20251001';
  const apiKey = import.meta.env.LLM_API_KEY || '';
  const maxTokens = parseInt(import.meta.env.LLM_MAX_TOKENS || '2048', 10);

  return { provider, model, apiKey, maxTokens };
}

// ---------------------------------------------------------------------------
// Provider-specific request builders
// ---------------------------------------------------------------------------

function buildAnthropicRequest(config: LLMConfig, req: LLMRequest) {
  return {
    url: 'https://api.anthropic.com/v1/messages',
    headers: {
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: req.maxTokens ?? config.maxTokens,
      system: req.system,
      messages: req.messages,
    }),
  };
}

function buildGroqRequest(config: LLMConfig, req: LLMRequest) {
  // Groq uses OpenAI-compatible chat completions format
  const messages = [
    { role: 'system' as const, content: req.system },
    ...req.messages,
  ];

  return {
    url: 'https://api.groq.com/openai/v1/chat/completions',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: req.maxTokens ?? config.maxTokens,
      messages,
    }),
  };
}

// ---------------------------------------------------------------------------
// Response parsers
// ---------------------------------------------------------------------------

function parseAnthropicResponse(data: any): LLMResponse {
  const textBlock = data.content?.find((b: any) => b.type === 'text');
  if (!textBlock) {
    return { success: false, error: 'No text content in Anthropic response' };
  }

  return {
    success: true,
    content: textBlock.text,
    tokensUsed: {
      input: data.usage?.input_tokens ?? 0,
      output: data.usage?.output_tokens ?? 0,
    },
  };
}

function parseGroqResponse(data: any): LLMResponse {
  const message = data.choices?.[0]?.message;
  if (!message) {
    return { success: false, error: 'No message in Groq response' };
  }

  return {
    success: true,
    content: message.content,
    tokensUsed: {
      input: data.usage?.prompt_tokens ?? 0,
      output: data.usage?.completion_tokens ?? 0,
    },
  };
}

// ---------------------------------------------------------------------------
// Core: generateText
// ---------------------------------------------------------------------------

const RETRY_DELAY_MS = 5000;

export async function generateText(request: LLMRequest): Promise<LLMResponse> {
  const config = getConfig();

  if (!config.apiKey) {
    return { success: false, error: 'LLM_API_KEY not configured' };
  }

  const build = config.provider === 'groq' ? buildGroqRequest : buildAnthropicRequest;
  const parse = config.provider === 'groq' ? parseGroqResponse : parseAnthropicResponse;
  const { url, headers, body } = build(config, request);

  let lastError = '';

  // Attempt + 1 retry on timeout/5xx
  for (let attempt = 0; attempt < 2; attempt++) {
    const start = Date.now();

    try {
      const response = await fetch(url, { method: 'POST', headers, body });
      const latency = Date.now() - start;

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = (errorData as any).error?.message || response.statusText;
        lastError = `${config.provider} API error (${response.status}): ${errorMsg}`;

        console.error(JSON.stringify({
          event: 'llm_call',
          provider: config.provider,
          model: config.model,
          latencyMs: latency,
          status: response.status,
          success: false,
          error: lastError,
          attempt: attempt + 1,
          timestamp: new Date().toISOString(),
        }));

        // Retry on 5xx or 429 (rate limit)
        if (attempt === 0 && (response.status >= 500 || response.status === 429)) {
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
          continue;
        }

        return { success: false, error: lastError };
      }

      const data = await response.json();
      const result = parse(data);
      const latencyFinal = Date.now() - start;

      console.log(JSON.stringify({
        event: 'llm_call',
        provider: config.provider,
        model: config.model,
        latencyMs: latencyFinal,
        tokensIn: result.tokensUsed?.input ?? 0,
        tokensOut: result.tokensUsed?.output ?? 0,
        success: result.success,
        attempt: attempt + 1,
        timestamp: new Date().toISOString(),
      }));

      return result;
    } catch (err) {
      const latency = Date.now() - start;
      lastError = err instanceof Error ? err.message : 'Unknown fetch error';

      console.error(JSON.stringify({
        event: 'llm_call',
        provider: config.provider,
        model: config.model,
        latencyMs: latency,
        success: false,
        error: lastError,
        attempt: attempt + 1,
        timestamp: new Date().toISOString(),
      }));

      // Retry on network errors (timeout, DNS, etc.)
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        continue;
      }
    }
  }

  return { success: false, error: lastError };
}
