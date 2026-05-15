/**
 * Groq provider.
 *
 * Groq Cloud serves open models at ~600+ tokens/sec on free-tier limits
 * — perfect brain for the Blaze builder during dev. Their API is
 * OpenAI-compatible, so this class doubles as a generic OpenAI-shape
 * client (any compatible endpoint slots in via baseUrl).
 *
 * Configurable via env:
 *   - GROQ_API_KEY              (required)
 *   - BLAZE_GROQ_BASE_URL       (default https://api.groq.com/openai/v1)
 *   - BLAZE_GROQ_MODEL          (default llama-3.3-70b-versatile)
 *
 * Endpoint: POST {baseUrl}/chat/completions
 *   - response_format: { type: "json_object" } enabled when caller
 *     asks for json output — Groq supports this for OpenAI parity.
 */
import type {
  CompletionParams,
  CompletionResult,
  LLMProvider,
  StreamEvent,
} from "./types";

const DEFAULT_BASE_URL = "https://api.groq.com/openai/v1";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

export interface GroqConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

interface OpenAIChatRequest {
  model: string;
  messages: { role: string; content: string }[];
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: "json_object" };
  stream?: boolean;
  stream_options?: { include_usage: boolean };
}

interface OpenAIChatResponse {
  id?: string;
  model: string;
  choices: {
    index: number;
    message: { role: string; content: string };
    finish_reason: string | null;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class GroqProvider implements LLMProvider {
  readonly id = "groq" as const;
  readonly model: string;
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(config: GroqConfig) {
    if (!config.apiKey) {
      throw new Error(
        "GroqProvider requires an api key. Set GROQ_API_KEY in your environment."
      );
    }
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    this.model = config.model ?? DEFAULT_MODEL;
  }

  async complete(params: CompletionParams): Promise<CompletionResult> {
    const body: OpenAIChatRequest = {
      model: this.model,
      messages: params.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: params.temperature ?? 0.2,
      ...(params.maxTokens ? { max_tokens: params.maxTokens } : {}),
      ...(params.json ? { response_format: { type: "json_object" as const } } : {}),
    };

    const started = Date.now();
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      throw new Error(
        `[groq] Cannot reach ${this.baseUrl}. ` +
          `${err instanceof Error ? err.message : String(err)}`
      );
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      // Surface Groq's error JSON inline so the chat UI can show it.
      throw new Error(`[groq] ${res.status} ${res.statusText}: ${text || "(empty body)"}`);
    }

    const json = (await res.json()) as OpenAIChatResponse;
    const content = json.choices?.[0]?.message?.content ?? "";
    return {
      content,
      model: json.model ?? this.model,
      latencyMs: Date.now() - started,
      ...(json.usage
        ? {
            usage: {
              promptTokens: json.usage.prompt_tokens,
              completionTokens: json.usage.completion_tokens,
            },
          }
        : {}),
    };
  }

  /**
   * Stream tokens via OpenAI-compatible SSE. Each `data:` line is a
   * JSON chunk with `choices[0].delta.content` carrying the next slice
   * of the assistant message. The terminal sentinel is `data: [DONE]`.
   * We surface a `done` event with the assembled text + usage at the end.
   */
  async *stream(params: CompletionParams): AsyncIterable<StreamEvent> {
    const body: OpenAIChatRequest = {
      model: this.model,
      messages: params.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: params.temperature ?? 0.2,
      ...(params.maxTokens ? { max_tokens: params.maxTokens } : {}),
      ...(params.json ? { response_format: { type: "json_object" as const } } : {}),
      stream: true,
      stream_options: { include_usage: true },
    };

    const started = Date.now();
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      yield {
        type: "error",
        message: `[groq] Cannot reach ${this.baseUrl}. ${
          err instanceof Error ? err.message : String(err)
        }`,
      };
      return;
    }

    if (!res.ok || !res.body) {
      const text = await res.text().catch(() => "");
      yield {
        type: "error",
        message: `[groq] ${res.status} ${res.statusText}: ${text || "(empty body)"}`,
      };
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    let assembled = "";
    let modelId = this.model;
    let usage: { promptTokens: number; completionTokens: number } | undefined;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      // SSE frames are separated by blank lines (\n\n). Process complete frames.
      let nl: number;
      while ((nl = buf.indexOf("\n\n")) !== -1) {
        const frame = buf.slice(0, nl);
        buf = buf.slice(nl + 2);
        // A frame may contain multiple `event:` / `data:` lines.
        for (const line of frame.split("\n")) {
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (!data || data === "[DONE]") continue;
          try {
            const chunk = JSON.parse(data) as OpenAIStreamChunk;
            if (chunk.model) modelId = chunk.model;
            if (chunk.usage) {
              usage = {
                promptTokens: chunk.usage.prompt_tokens,
                completionTokens: chunk.usage.completion_tokens,
              };
            }
            const delta = chunk.choices?.[0]?.delta?.content;
            if (typeof delta === "string" && delta.length > 0) {
              assembled += delta;
              yield { type: "delta", content: delta };
            }
          } catch {
            // Skip malformed chunks rather than tear down the stream —
            // matches OpenAI SDK behaviour.
          }
        }
      }
    }

    yield {
      type: "done",
      content: assembled,
      model: modelId,
      latencyMs: Date.now() - started,
      ...(usage ? { usage } : {}),
    };
  }
}

interface OpenAIStreamChunk {
  model?: string;
  choices?: {
    index: number;
    delta: { role?: string; content?: string };
    finish_reason: string | null;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
