/**
 * POST /api/generate
 *
 * The brain's HTTP entry point.
 *
 * Body shape: { messages: ChatMessage[], currentSpec: SiteSpec | null }
 * Response:   { message: ChatMessage, spec: SiteSpec }
 *
 * The route is intentionally thin — it composes:
 *   1. System prompt (built once, includes the full kit registry).
 *   2. Conversation history flattened to provider-shaped ChatTurns.
 *   3. The current SiteSpec inlined as a user-role message so the
 *      model can see "where it left off".
 *
 * Errors are returned as JSON `{ error: string }` with a 4xx/5xx
 * status so the client can render them inline in the chat.
 */
import { NextResponse } from "next/server";
import { getProvider } from "@/builder/llm";
import { buildSystemPrompt } from "@/builder/prompts/system";
import { EMPTY_SITE_SPEC } from "@/builder/seedSpec";
import type {
  ChatMessage,
  GenerateRequest,
  GenerateResponse,
  SiteSpec,
} from "@/builder/types";
import { SITE_SPEC_VERSION } from "@/builder/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface AssistantPayload {
  explanation: string;
  spec: SiteSpec | null;
}

export async function POST(req: Request) {
  let body: GenerateRequest;
  try {
    body = (await req.json()) as GenerateRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json(
      { error: "messages must be a non-empty array" },
      { status: 400 }
    );
  }

  const provider = getProvider();
  const systemPrompt = buildSystemPrompt();
  const currentSpec = body.currentSpec ?? EMPTY_SITE_SPEC;

  const turns = [
    { role: "system" as const, content: systemPrompt },
    {
      role: "user" as const,
      content: `Current SiteSpec:\n\`\`\`json\n${JSON.stringify(
        currentSpec,
        null,
        2
      )}\n\`\`\``,
    },
    ...body.messages.map((m) => ({
      role: m.role === "system" ? ("user" as const) : (m.role as "user" | "assistant"),
      content: m.content,
    })),
  ];

  let raw: string;
  let modelId: string;
  try {
    const result = await provider.complete({
      messages: turns,
      json: true,
      temperature: 0.2,
      maxTokens: 4096,
    });
    raw = result.content;
    modelId = result.model;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const parsed = parsePayload(raw);
  if (!parsed) {
    return NextResponse.json(
      {
        error: `Model returned non-JSON or malformed JSON. First 200 chars: ${raw.slice(
          0,
          200
        )}`,
      },
      { status: 502 }
    );
  }

  const nextSpec = parsed.spec ?? currentSpec;
  if (!isSiteSpec(nextSpec)) {
    return NextResponse.json(
      { error: "Model returned a spec that doesn't match the SiteSpec schema." },
      { status: 502 }
    );
  }

  const assistantMessage: ChatMessage = {
    id: cryptoRandomId(),
    role: "assistant",
    content: parsed.explanation || "(no explanation)",
    createdAt: new Date().toISOString(),
    ...(parsed.spec ? { specPatch: parsed.spec } : {}),
  };

  const response: GenerateResponse = {
    message: assistantMessage,
    spec: nextSpec,
  };
  return NextResponse.json(response, {
    headers: { "x-blaze-model": modelId },
  });
}

function parsePayload(raw: string): AssistantPayload | null {
  // Strip an optional ```json … ``` fence — small models sometimes
  // emit one even when asked for raw JSON.
  const stripped = raw
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
  try {
    const obj = JSON.parse(stripped) as AssistantPayload;
    if (typeof obj.explanation !== "string") return null;
    if (obj.spec !== null && (typeof obj.spec !== "object" || !obj.spec)) {
      return null;
    }
    return obj;
  } catch {
    return null;
  }
}

function isSiteSpec(s: unknown): s is SiteSpec {
  if (!s || typeof s !== "object") return false;
  const spec = s as Partial<SiteSpec>;
  if (spec.version !== SITE_SPEC_VERSION) return false;
  if (!spec.meta || typeof spec.meta.title !== "string") return false;
  if (!Array.isArray(spec.sections)) return false;
  return spec.sections.every(
    (sec) =>
      typeof sec.id === "string" &&
      typeof sec.componentId === "string" &&
      sec.props !== null &&
      typeof sec.props === "object"
  );
}

function cryptoRandomId(): string {
  // Node 18+ / edge runtime both expose globalThis.crypto.
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
