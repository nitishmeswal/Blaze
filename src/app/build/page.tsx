"use client";

/**
 * /build — the Blaze builder shell.
 *
 * Layout:
 *   ┌────────────────────────┬──────────────────────────────────────┐
 *   │  Chat (left, 380px)    │  Live preview iframe (right, fluid)  │
 *   │  history + composer    │  /build/preview                      │
 *   └────────────────────────┴──────────────────────────────────────┘
 *
 * Phase 2:
 *   - SSE streaming from /api/generate. As tokens arrive, we
 *     extract a partial `"explanation"` via regex and show it in
 *     a placeholder bubble so the user sees the answer crawl in.
 *   - localStorage persistence so reload doesn't wipe the chat.
 *   - Footer surfaces model / latency / tokens for the last turn.
 *
 * Phase 3 layers the Figma-like 3D placement canvas over the iframe.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EMPTY_SITE_SPEC } from "@/builder/seedSpec";
import { isSiteSpec } from "@/builder/validate";
import type { ChatMessage, GenerateRequest, SiteSpec } from "@/builder/types";

const PREVIEW_URL = "/build/preview";
const STORAGE_KEY = "blaze.builder.v1";

/** Persisted shape — bump version + migrate when schema changes. */
interface PersistedState {
  v: 1;
  spec: SiteSpec;
  messages: ChatMessage[];
}

interface TurnMetrics {
  model: string;
  latencyMs: number;
  usage?: { promptTokens: number; completionTokens: number };
}

function randomId(): string {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const GREETING: ChatMessage = {
  id: "greeting",
  role: "assistant",
  content:
    "Hi — describe the site you want and I'll build it. Try: \"Show me an example\" to see the demo.",
  createdAt: new Date(0).toISOString(),
};

export default function BuildPage() {
  const [spec, setSpec] = useState<SiteSpec>(EMPTY_SITE_SPEC);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [streamingText, setStreamingText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [lastMetrics, setLastMetrics] = useState<TurnMetrics | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const previewReady = useRef(false);
  const [brain, setBrain] = useState<{ provider: string; model: string } | null>(
    null
  );

  // Restore from localStorage on first mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PersistedState;
        if (parsed.v === 1 && isSiteSpec(parsed.spec) && Array.isArray(parsed.messages)) {
          setSpec(parsed.spec);
          setMessages(parsed.messages.length > 0 ? parsed.messages : [GREETING]);
        }
      }
    } catch {
      // Corrupt storage — ignore and start fresh.
    }
    setHydrated(true);
  }, []);

  // Persist on every change after the initial hydrate.
  useEffect(() => {
    if (!hydrated) return;
    try {
      const state: PersistedState = { v: 1, spec, messages };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Quota or private-mode — silently ignore.
    }
  }, [hydrated, spec, messages]);

  useEffect(() => {
    let alive = true;
    fetch("/api/status")
      .then((r) => r.json())
      .then((d: { provider: string; model: string }) => {
        if (alive) setBrain(d);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  /** Push the current spec to the iframe whenever it changes (or the iframe says it's ready). */
  const pushSpec = useCallback((nextSpec: SiteSpec) => {
    iframeRef.current?.contentWindow?.postMessage(
      { kind: "blaze:set-spec", spec: nextSpec },
      "*"
    );
  }, []);

  useEffect(() => {
    function onMessage(ev: MessageEvent) {
      const data = ev.data as { kind?: string } | undefined;
      if (data?.kind === "blaze:preview-ready") {
        previewReady.current = true;
        pushSpec(spec);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [spec, pushSpec]);

  useEffect(() => {
    if (previewReady.current) pushSpec(spec);
  }, [spec, pushSpec]);

  const submit = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || pending) return;
    const userMsg: ChatMessage = {
      id: randomId(),
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setPending(true);
    setStreamingText("");
    setError(null);

    const requestBody: GenerateRequest = {
      messages: [...messages, userMsg],
      currentSpec: spec,
    };

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      if (!res.ok || !res.body) {
        const t = await res.text().catch(() => "");
        setError(t || `${res.status} ${res.statusText}`);
        return;
      }

      const events = readSSE(res.body);
      let assembled = "";
      for await (const ev of events) {
        if (ev.event === "delta") {
          const payload = ev.data as { content?: string };
          if (typeof payload.content === "string") {
            assembled += payload.content;
            const partial = extractExplanation(assembled);
            if (partial) setStreamingText(partial);
          }
        } else if (ev.event === "done") {
          const payload = ev.data as {
            message: ChatMessage;
            spec: SiteSpec;
            model: string;
            latencyMs: number;
            usage?: { promptTokens: number; completionTokens: number };
          };
          setMessages((m) => [...m, payload.message]);
          if (payload.spec) setSpec(payload.spec);
          setLastMetrics({
            model: payload.model,
            latencyMs: payload.latencyMs,
            ...(payload.usage ? { usage: payload.usage } : {}),
          });
        } else if (ev.event === "error") {
          const payload = ev.data as { error?: string };
          setError(payload.error ?? "Stream error");
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPending(false);
      setStreamingText("");
    }
  }, [input, pending, messages, spec]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        void submit();
      }
    },
    [submit]
  );

  const reset = useCallback(() => {
    setMessages([GREETING]);
    setSpec(EMPTY_SITE_SPEC);
    setError(null);
    setLastMetrics(null);
    setStreamingText("");
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  const visibleMessages = useMemo(
    () => messages.filter((m) => m.role !== "system"),
    [messages]
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-blaze-bg text-blaze-text">
      <aside className="flex h-full w-[380px] shrink-0 flex-col border-r border-blaze-line bg-blaze-surface">
        <header className="flex items-center gap-2 border-b border-blaze-line px-4 py-3 text-sm">
          <span className="inline-block h-2 w-2 rounded-sm bg-blaze-accent shadow-[0_0_8px_#ff5a1f]" />
          <span className="font-semibold tracking-tight">Blaze Builder</span>
          <span className="ml-auto text-xs text-blaze-muted">
            {brain ? `${brain.provider} · ${brain.model}` : "starting…"}
          </span>
        </header>
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 text-sm">
          {visibleMessages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
          {pending &&
            (streamingText ? (
              <StreamingBubble text={streamingText} />
            ) : (
              <ThinkingBubble />
            ))}
          {error && <ErrorBubble error={error} />}
        </div>
        <div className="border-t border-blaze-line p-3">
          <div className="rounded-md border border-blaze-line bg-blaze-bg focus-within:border-blaze-accent">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Describe a section, a colour change, or paste a screenshot URL…"
              rows={3}
              className="block w-full resize-none bg-transparent px-3 py-2 text-sm leading-relaxed outline-none placeholder:text-blaze-muted"
              disabled={pending}
            />
            <div className="flex items-center justify-between border-t border-blaze-line px-3 py-1.5 text-[10px] uppercase tracking-widest text-blaze-muted">
              <span>
                {pending
                  ? "streaming…"
                  : "enter to send · shift+enter for newline"}
              </span>
              <button
                type="button"
                onClick={() => void submit()}
                disabled={pending || !input.trim()}
                className="rounded bg-blaze-accent px-2 py-1 text-[10px] font-semibold uppercase text-black hover:bg-blaze-accent2 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Send
              </button>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2 text-[10px] uppercase tracking-widest text-blaze-muted">
            <Metrics m={lastMetrics} />
            <button
              type="button"
              onClick={reset}
              className="text-blaze-muted underline-offset-2 hover:text-blaze-text hover:underline"
              title="Clear chat and saved spec"
            >
              reset
            </button>
          </div>
        </div>
      </aside>
      <main className="relative h-full flex-1 bg-black">
        <iframe
          ref={iframeRef}
          src={PREVIEW_URL}
          title="Site preview"
          className="block h-full w-full border-0"
        />
      </main>
    </div>
  );
}

/**
 * Extract the explanation field's currently-emitted text from a
 * partial JSON buffer. Returns the captured substring with simple
 * `\n` / `\"` un-escaping so the user sees something readable as
 * tokens flow in.
 */
function extractExplanation(buffer: string): string | null {
  // Strip an opening fence if the model started with ```json
  const stripped = buffer.replace(/^\s*```(?:json)?\s*/i, "");
  const m = stripped.match(/"explanation"\s*:\s*"((?:[^"\\]|\\.)*)/);
  if (!m) return null;
  return m[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');
}

/**
 * Minimal SSE reader. Yields { event, data } pairs as the response
 * body streams in. Buffers across chunks so we don't split frames.
 */
async function* readSSE(
  body: ReadableStream<Uint8Array>
): AsyncIterable<{ event: string; data: unknown }> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf("\n\n")) !== -1) {
      const frame = buf.slice(0, nl);
      buf = buf.slice(nl + 2);
      let event = "message";
      let dataLine = "";
      for (const line of frame.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) dataLine += line.slice(5).trim();
      }
      if (!dataLine) continue;
      try {
        yield { event, data: JSON.parse(dataLine) as unknown };
      } catch {
        // Skip unparseable frames.
      }
    }
  }
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className={
          isUser
            ? "max-w-[85%] rounded-lg bg-blaze-accent/15 px-3 py-2 text-blaze-text"
            : "max-w-[85%] rounded-lg bg-blaze-line/40 px-3 py-2 text-blaze-text"
        }
      >
        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        {message.specPatch && (
          <p className="mt-1 text-[10px] uppercase tracking-widest text-blaze-muted">
            Updated preview — {message.specPatch.sections.length} sections
          </p>
        )}
      </div>
    </div>
  );
}

function StreamingBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-lg bg-blaze-line/40 px-3 py-2 text-blaze-text">
        <p className="whitespace-pre-wrap leading-relaxed">
          {text}
          <span className="inline-block h-3 w-1 translate-y-0.5 animate-pulse bg-blaze-accent" />
        </p>
      </div>
    </div>
  );
}

function ThinkingBubble() {
  return (
    <div className="flex justify-start">
      <div className="rounded-lg bg-blaze-line/40 px-3 py-2 text-blaze-muted">
        <span className="inline-flex gap-1">
          <Dot delay="0ms" />
          <Dot delay="150ms" />
          <Dot delay="300ms" />
        </span>
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-blaze-muted"
      style={{ animationDelay: delay }}
    />
  );
}

function ErrorBubble({ error }: { error: string }) {
  return (
    <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
      <p className="font-semibold uppercase tracking-widest text-red-400">Error</p>
      <p className="mt-1 whitespace-pre-wrap break-all">{error}</p>
    </div>
  );
}

function Metrics({ m }: { m: TurnMetrics | null }) {
  if (!m) return <span className="opacity-60">no turn yet</span>;
  const tokens = m.usage
    ? `${m.usage.promptTokens}↑${m.usage.completionTokens}↓`
    : "—";
  return (
    <span className="truncate" title={m.model}>
      {(m.latencyMs / 1000).toFixed(2)}s · {tokens}
    </span>
  );
}
