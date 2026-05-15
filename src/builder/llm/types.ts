/**
 * LLM provider abstraction.
 *
 * We start with an Ollama-backed local model. Anthropic / OpenAI /
 * other providers slot in behind the same interface so swapping
 * brains is one env var (`BLAZE_LLM_PROVIDER`) — no caller change.
 */

export interface ChatTurn {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CompletionParams {
  /** Chat history, oldest first. Always ends with a user / system turn. */
  messages: ChatTurn[];
  /** 0..1, where 0 is greedy. Default 0.2 for code-gen. */
  temperature?: number;
  /** Hard cap on the response length in tokens. */
  maxTokens?: number;
  /**
   * If true, the provider is asked to return STRICT JSON only (no prose
   * wrapper). Providers that support a "json mode" use it; others fall
   * back to prompt engineering + post-parse retry.
   */
  json?: boolean;
}

export interface CompletionResult {
  /** Raw text the model returned. JSON parsing happens at the call site. */
  content: string;
  /** Provider-reported model id, e.g. `qwen2.5-coder:32b`. */
  model: string;
  /** Wall-clock ms the request took. Useful for the chat UI's spinner copy. */
  latencyMs: number;
  /** Token usage when the provider reports it. */
  usage?: { promptTokens: number; completionTokens: number };
}

/**
 * Streaming event surfaced to the route + UI.
 *  - `delta`: a chunk of completion content (model id and seq fixed once known)
 *  - `done`:  final event, includes the assembled full content + usage + latency
 *  - `error`: terminal error event, no further events follow
 */
export type StreamEvent =
  | { type: "delta"; content: string }
  | {
      type: "done";
      content: string;
      model: string;
      latencyMs: number;
      usage?: { promptTokens: number; completionTokens: number };
    }
  | { type: "error"; message: string };

export interface LLMProvider {
  /** Stable identifier, e.g. `"ollama"`, `"anthropic"`, `"openai"`. */
  readonly id: string;
  /** Model id as understood by the provider. */
  readonly model: string;
  complete(params: CompletionParams): Promise<CompletionResult>;
  /**
   * Optional streaming variant. Yields a sequence of StreamEvents.
   * Providers without streaming support omit this; callers fall
   * back to `complete()` and wrap the result as a single "done".
   */
  stream?(params: CompletionParams): AsyncIterable<StreamEvent>;
}
