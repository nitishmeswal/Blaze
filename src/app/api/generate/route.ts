/**
 * POST /api/generate
 *
 * The brain's HTTP entry point. Streams the assistant turn as
 * server-sent events so the chat UI can show the explanation as
 * it's generated.
 *
 * Body shape: { messages: ChatMessage[], currentSpec: SiteSpec | null }
 *
 * Wire protocol (SSE):
 *
 *   event: delta
 *   data: {"content":"...partial tokens..."}
 *
 *   event: delta
 *   data: {"content":"...more..."}
 *
 *   event: done
 *   data: {
 *     "message": ChatMessage,
 *     "spec": SiteSpec,
 *     "model": "llama-3.3-70b-versatile",
 *     "latencyMs": 2300,
 *     "usage": { "promptTokens": 600, "completionTokens": 400 }
 *   }
 *
 *   event: error
 *   data: {"error":"..."}
 *
 * The route is intentionally thin — it composes:
 *   1. System prompt (built fresh per request, includes wired components).
 *   2. Conversation history flattened to provider-shaped ChatTurns.
 *   3. The current SiteSpec inlined as a user-role message so the
 *      model can see "where it left off".
 *
 * For providers without a `stream()` method, this route falls back
 * to `complete()` and emits a single `done` event with the full text.
 */
import { getProvider } from "@/builder/llm";
import { buildSystemPrompt } from "@/builder/prompts/system";
import { EMPTY_SITE_SPEC } from "@/builder/seedSpec";
import type { ChatMessage, GenerateRequest, SiteSpec } from "@/builder/types";
import type { ChatTurn, StreamEvent } from "@/builder/llm/types";
import { isSiteSpec, parsePayload } from "@/builder/validate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: GenerateRequest;
  try {
    body = (await req.json()) as GenerateRequest;
  } catch {
    return jsonError("Invalid JSON body", 400);
  }
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return jsonError("messages must be a non-empty array", 400);
  }
  // Validate client-supplied currentSpec — a crafted body should never
  // crash us. Fall back to EMPTY when the client sent a bad spec; the
  // model will get a sane starting point.
  const currentSpec: SiteSpec =
    body.currentSpec && isSiteSpec(body.currentSpec)
      ? body.currentSpec
      : EMPTY_SITE_SPEC;

  const provider = getProvider();
  const systemPrompt = buildSystemPrompt();

  const turns: ChatTurn[] = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: `Current SiteSpec:\n\`\`\`json\n${JSON.stringify(
        currentSpec,
        null,
        2
      )}\n\`\`\``,
    },
    ...body.messages.map<ChatTurn>((m) => ({
      role: m.role === "system" ? "user" : (m.role as "user" | "assistant"),
      content: m.content,
    })),
  ];

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, payload: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`)
        );
      };

      try {
        const events = providerEvents(provider, turns);
        let assembled = "";
        let finalModel = provider.model;
        let finalLatency = 0;
        let finalUsage:
          | { promptTokens: number; completionTokens: number }
          | undefined;
        let errored = false;

        for await (const event of events) {
          if (event.type === "delta") {
            assembled += event.content;
            send("delta", { content: event.content });
          } else if (event.type === "done") {
            assembled = event.content || assembled;
            finalModel = event.model;
            finalLatency = event.latencyMs;
            finalUsage = event.usage;
          } else if (event.type === "error") {
            send("error", { error: event.message });
            errored = true;
            break;
          }
        }

        if (errored) {
          controller.close();
          return;
        }

        const parsed = parsePayload(assembled);
        if (!parsed) {
          send("error", {
            error: `Model returned non-JSON or malformed JSON. First 200 chars: ${assembled.slice(
              0,
              200
            )}`,
          });
          controller.close();
          return;
        }

        const nextSpec = parsed.spec ?? currentSpec;
        if (!isSiteSpec(nextSpec)) {
          send("error", {
            error: "Model returned a spec that doesn't match the SiteSpec schema.",
          });
          controller.close();
          return;
        }

        const assistantMessage: ChatMessage = {
          id: cryptoRandomId(),
          role: "assistant",
          content: parsed.explanation || "(no explanation)",
          createdAt: new Date().toISOString(),
          ...(parsed.spec ? { specPatch: parsed.spec } : {}),
        };

        send("done", {
          message: assistantMessage,
          spec: nextSpec,
          model: finalModel,
          latencyMs: finalLatency,
          ...(finalUsage ? { usage: finalUsage } : {}),
        });
        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        send("error", { error: message });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-blaze-model": provider.model,
      "x-blaze-provider": provider.id,
    },
  });
}

/**
 * Bridge over the optional `stream()` method — providers without
 * streaming get adapted to a single `done` event sequence.
 */
async function* providerEvents(
  provider: ReturnType<typeof getProvider>,
  turns: ChatTurn[]
): AsyncIterable<StreamEvent> {
  if (typeof provider.stream === "function") {
    yield* provider.stream({
      messages: turns,
      json: true,
      temperature: 0.2,
      maxTokens: 4096,
    });
    return;
  }
  try {
    const result = await provider.complete({
      messages: turns,
      json: true,
      temperature: 0.2,
      maxTokens: 4096,
    });
    yield {
      type: "done",
      content: result.content,
      model: result.model,
      latencyMs: result.latencyMs,
      ...(result.usage ? { usage: result.usage } : {}),
    };
  } catch (err) {
    yield {
      type: "error",
      message: err instanceof Error ? err.message : String(err),
    };
  }
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function cryptoRandomId(): string {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
