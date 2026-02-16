/**
 * LLM Provider Abstraction
 *
 * Single entry point for all AI features. Supports:
 * - Anthropic (claude-haiku-4-5-20251001) — default
 * - Groq (llama-3.3-70b-versatile) — swap-ready alternative
 *
 * Configuration via environment variables:
 *   LLM_PROVIDER   = 'anthropic' | 'groq'
 *   LLM_MODEL      = model identifier
 *   LLM_API_KEY    = API key for chosen provider
 *   LLM_MAX_TOKENS = default max tokens (default: 2048)
 */

const RETRY_DELAY_MS = 5000;

interface LLMProviderConfig {
  provider: 'anthropic' | 'groq';
  model: string;
  apiKey: string;
  maxTokens: number;
}

function getConfig(): LLMProviderConfig {
  return {
    provider: (import.meta.env.LLM_PROVIDER || 'anthropic') as 'anthropic' | 'groq',
    model: import.meta.env.LLM_MODEL || 'claude-haiku-4-5-20251001',
    apiKey: import.meta.env.LLM_API_KEY || '',
    maxTokens: parseInt(import.meta.env.LLM_MAX_TOKENS || '2048', 10),
  };
}

/**
 * Internal helper — sends a request to the configured LLM provider and returns
 * the text content. Handles retries, logging, and provider-specific formatting.
 */
async function callLLM(
  system: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  maxTokens: number,
  config: LLMProviderConfig,
): Promise<string> {
  let lastError = '';

  for (let attempt = 0; attempt < 2; attempt++) {
    const start = Date.now();

    try {
      let url: string;
      let headers: Record<string, string>;
      let body: string;

      if (config.provider === 'groq') {
        // Groq uses OpenAI-compatible chat completions format
        url = 'https://api.groq.com/openai/v1/chat/completions';
        headers = {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        };
        body = JSON.stringify({
          model: config.model,
          max_tokens: maxTokens,
          messages: [
            { role: 'system', content: system },
            ...messages,
          ],
        });
      } else {
        // Anthropic Messages API
        url = 'https://api.anthropic.com/v1/messages';
        headers = {
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        };
        body = JSON.stringify({
          model: config.model,
          max_tokens: maxTokens,
          system,
          messages,
        });
      }

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

        throw new Error(lastError);
      }

      const data = await response.json();

      // Parse response based on provider
      let content: string;
      let tokensIn = 0;
      let tokensOut = 0;

      if (config.provider === 'groq') {
        content = data.choices?.[0]?.message?.content ?? '';
        tokensIn = data.usage?.prompt_tokens ?? 0;
        tokensOut = data.usage?.completion_tokens ?? 0;
      } else {
        const textBlock = data.content?.find((b: any) => b.type === 'text');
        content = textBlock?.text ?? '';
        tokensIn = data.usage?.input_tokens ?? 0;
        tokensOut = data.usage?.output_tokens ?? 0;
      }

      console.log(JSON.stringify({
        event: 'llm_call',
        provider: config.provider,
        model: config.model,
        latencyMs: Date.now() - start,
        tokensIn,
        tokensOut,
        success: true,
        attempt: attempt + 1,
        timestamp: new Date().toISOString(),
      }));

      return content;
    } catch (err) {
      const latency = Date.now() - start;
      lastError = err instanceof Error ? err.message : 'Unknown fetch error';

      // Only log if not already logged above (avoid double-logging HTTP errors)
      if (!lastError.includes('API error')) {
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
      }

      // Retry on network errors (timeout, DNS, etc.) — but not on API-level errors already handled
      if (attempt === 0 && !lastError.includes('API error')) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        continue;
      }

      throw new Error(lastError);
    }
  }

  throw new Error(lastError);
}

/**
 * Generate text from an LLM provider (single-turn).
 *
 * @param system    - System prompt with instructions and context
 * @param userMessage - The user's message / request
 * @param maxTokens - Override default max tokens (optional)
 * @returns The generated text string
 * @throws Error if API key is missing or both attempts fail
 */
export async function generateText(
  system: string,
  userMessage: string,
  maxTokens?: number,
): Promise<string> {
  const config = getConfig();
  if (!config.apiKey) throw new Error('LLM_API_KEY not configured');

  return callLLM(
    system,
    [{ role: 'user', content: userMessage }],
    maxTokens ?? config.maxTokens,
    config,
  );
}

/**
 * Generate a chat response with full conversation history (multi-turn).
 *
 * @param system   - System prompt with instructions and context
 * @param messages - Conversation history (alternating user/assistant messages)
 * @param maxTokens - Override default max tokens (optional)
 * @returns The generated text string
 * @throws Error if API key is missing or both attempts fail
 */
export async function generateChat(
  system: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  maxTokens?: number,
): Promise<string> {
  const config = getConfig();
  if (!config.apiKey) throw new Error('LLM_API_KEY not configured');

  return callLLM(
    system,
    messages,
    maxTokens ?? config.maxTokens,
    config,
  );
}
