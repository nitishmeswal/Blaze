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
    };
  }
}
