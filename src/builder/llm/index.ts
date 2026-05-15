/**
 * Provider factory.
 *
 * The brain is picked by env at request time so swapping models in dev
 * doesn't require a rebuild. Resolution order:
 *
 *   1. If BLAZE_LLM_PROVIDER is set, use that.
 *   2. Otherwise, auto-detect from available API keys:
 *        - GROQ_API_KEY    → groq
 *      (else)              → mock (deterministic fallback)
 *
 *   Supported provider ids:
 *     - groq        (default when GROQ_API_KEY is set)
 *     - ollama      (local Ollama server)
 *     - anthropic   (future)
 *     - openai      (future)
 *     - mock        (deterministic; for tests / no-key dev)
 */
import { GroqProvider } from "./groq";
import { MockProvider } from "./mock";
import { OllamaProvider } from "./ollama";
import type { LLMProvider } from "./types";

export type ProviderId = "groq" | "ollama" | "anthropic" | "openai" | "mock";

export function getProvider(): LLMProvider {
  const explicit = process.env.BLAZE_LLM_PROVIDER as ProviderId | undefined;
  const id: ProviderId = explicit ?? autoDetectProvider();

  switch (id) {
    case "groq": {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) {
        console.warn(
          "[builder] BLAZE_LLM_PROVIDER=groq but GROQ_API_KEY is missing — falling back to mock."
        );
        return new MockProvider();
      }
      return new GroqProvider({
        apiKey,
        baseUrl: process.env.BLAZE_GROQ_BASE_URL,
        model: process.env.BLAZE_GROQ_MODEL,
      });
    }
    case "ollama":
      return new OllamaProvider({
        baseUrl: process.env.BLAZE_OLLAMA_BASE_URL,
        model: process.env.BLAZE_OLLAMA_MODEL,
        keepAlive: process.env.BLAZE_OLLAMA_KEEP_ALIVE,
      });
    case "anthropic":
    case "openai":
      console.warn(
        `[builder] Provider '${id}' is not implemented yet — falling back to mock.`
      );
      return new MockProvider();
    case "mock":
    default:
      return new MockProvider();
  }
}

function autoDetectProvider(): ProviderId {
  if (process.env.GROQ_API_KEY) return "groq";
  return "mock";
}

export type { LLMProvider, CompletionParams, CompletionResult } from "./types";
