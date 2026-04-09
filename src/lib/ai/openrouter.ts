// ============================================================================
// STRATIQ — OpenRouter AI Client (ZDR-Compliant)
// ============================================================================

import { AIError } from '@/lib/types';
import type { AICallOptions } from '@/lib/types';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_MODEL = 'anthropic/claude-3.5-sonnet';
const REQUEST_TIMEOUT_MS = 60_000;

function getApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new AIError(
      'OPENROUTER_API_KEY environment variable is not set',
      'CONFIG_ERROR',
    );
  }
  return key;
}

function getModel(): string {
  return process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
}

// ---------------------------------------------------------------------------
// Internal: raw chat completion
// ---------------------------------------------------------------------------

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterChoice {
  message: { content: string };
  finish_reason: string;
}

interface OpenRouterResponse {
  id: string;
  choices: OpenRouterChoice[];
  error?: { message: string; code?: number };
}

async function chatCompletion(
  messages: OpenRouterMessage[],
  options: AICallOptions = {},
): Promise<string> {
  const apiKey = getApiKey();
  const model = getModel();

  const body = {
    model,
    messages,
    temperature: options.temperature ?? 0.3,
    max_tokens: options.maxTokens ?? 4096,
    // ZDR compliance — deny data collection by all providers
    provider: {
      data_collection: 'deny' as const,
    },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://stratiq.nodeops.app',
        'X-Title': 'STRATIQ',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => 'unknown');
      throw new AIError(
        `OpenRouter API returned ${response.status}: ${text}`,
        'API_ERROR',
        response.status,
      );
    }

    const data: OpenRouterResponse = await response.json();

    if (data.error) {
      throw new AIError(
        data.error.message || 'Unknown OpenRouter error',
        'UPSTREAM_ERROR',
        data.error.code,
      );
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new AIError(
        'OpenRouter returned an empty response',
        'EMPTY_RESPONSE',
      );
    }

    return content;
  } catch (error: unknown) {
    if (error instanceof AIError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new AIError(
        `OpenRouter request timed out after ${REQUEST_TIMEOUT_MS / 1000}s`,
        'TIMEOUT',
      );
    }

    throw new AIError(
      error instanceof Error ? error.message : 'Unknown error calling OpenRouter',
      'NETWORK_ERROR',
      undefined,
      error,
    );
  } finally {
    clearTimeout(timeout);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Send a system + user prompt to OpenRouter and return the raw text response.
 */
export async function callAI(
  systemPrompt: string,
  userPrompt: string,
  options?: AICallOptions,
): Promise<string> {
  return chatCompletion(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    options,
  );
}

/**
 * Send a system + user prompt and parse the response as JSON.
 *
 * The AI is expected to return valid JSON (optionally wrapped in a markdown
 * code fence). If parsing fails the raw text is included in the error for
 * debugging.
 */
export async function callAIJson<T>(
  systemPrompt: string,
  userPrompt: string,
  options?: AICallOptions,
): Promise<T> {
  const raw = await callAI(systemPrompt, userPrompt, options);

  // Strip optional markdown code fences (```json ... ``` or ``` ... ```)
  const cleaned = raw
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch (parseError) {
    throw new AIError(
      `Failed to parse AI response as JSON. Raw response starts with: "${raw.slice(0, 200)}"`,
      'JSON_PARSE_ERROR',
      undefined,
      parseError,
    );
  }
}
