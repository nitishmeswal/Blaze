/**
 * Ollama provider.
 *
 * Talks to a local Ollama server (default http://localhost:11434).
 * Configurable via env:
 *   - BLAZE_OLLAMA_BASE_URL    (default http://localhost:11434)
 *   - BLAZE_OLLAMA_MODEL       (default qwen2.5-coder:14b)
 *   - BLAZE_OLLAMA_KEEP_ALIVE  (default "5m" — keeps model warm)
 *
 * We use the /api/chat endpoint (supports a `format: "json"` option
 * for structured output, which we lean on when the caller passes
 * `json: true`).
 */
import type {
  CompletionParams,
  CompletionResult,
  LLMProvider,
} from "./types";

const DEFAULT_BASE_URL = "http://localhost:11434";
const DEFAULT_MODEL = "qwen2.5-coder:14b";
const DEFAULT_KEEP_ALIVE = "5m";

export interface OllamaConfig {
  baseUrl?: string;
  model?: string;
  keepAlive?: string;
}

interface OllamaChatRequest {
  model: string;
  messages: { role: string; content: string }[];
  stream: false;
  keep_alive: string;
  format?: "json";
  options?: {
    temperature?: number;
    num_predict?: number;
  };
}

interface OllamaChatResponse {
  model: string;
  message: { role: string; content: string };
  done: boolean;
  total_duration?: number;
}

export class OllamaProvider implements LLMProvider {
  readonly id = "ollama" as const;
  readonly model: string;
  private readonly baseUrl: string;
  private readonly keepAlive: string;

  constructor(config: OllamaConfig = {}) {
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    this.model = config.model ?? DEFAULT_MODEL;
    this.keepAlive = config.keepAlive ?? DEFAULT_KEEP_ALIVE;
  }

  async complete(params: CompletionParams): Promise<CompletionResult> {
    const body: OllamaChatRequest = {
      model: this.model,
      messages: params.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      stream: false,
      keep_alive: this.keepAlive,
      options: {
        temperature: params.temperature ?? 0.2,
        ...(params.maxTokens ? { num_predict: params.maxTokens } : {}),
      },
    };
    if (params.json) body.format = "json";

    const started = Date.now();
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (err) {
      throw new Error(
        `[ollama] Cannot reach ${this.baseUrl}. Is the Ollama server running? ` +
          `Run \`ollama serve\` and \`ollama pull ${this.model}\`. ` +
          `Original error: ${err instanceof Error ? err.message : String(err)}`
      );
    }
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `[ollama] ${res.status} ${res.statusText} from ${this.baseUrl}/api/chat. ${text}`
      );
    }
    const json = (await res.json()) as OllamaChatResponse;
    return {
      content: json.message?.content ?? "",
      model: json.model ?? this.model,
      latencyMs: Date.now() - started,
    };
  }
}
