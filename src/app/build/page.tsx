"use client";

/**
 * /build — the Blaze builder shell.
 *
 *   ┌─────────────────────────────────────────────────────────────┐
 *   │ AppShell topbar: Chat / Studio / Preview · Share · Deploy   │
 *   ├──────────────────────────┬──────────────────────────────────┤
 *   │ Chat (left, ~360px)      │ Live iframe (right, fluid)       │
 *   │  - history bubbles       │  /build/preview                  │
 *   │  - streaming bubble      │  + viewport / refresh chrome     │
 *   │  - composer + metrics    │                                  │
 *   └──────────────────────────┴──────────────────────────────────┘
 *
 * Behaviour preserved from Phase 2:
 *   - SSE streaming (`extractExplanation` from a partial JSON buffer).
 *   - localStorage persistence under `blaze.builder.v1`.
 *   - Provider/model badge surfaced via `/api/status`.
 *
 * Behaviour added by the UI redesign:
 *   - Reads `?prompt=…` from the URL on first paint and, if present,
 *     auto-submits it. This is what makes the landing-page form feel
 *     one-step ("press Build → already streaming").
 *   - Shell + chrome look consistent with `/studio`.
 */
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { EMPTY_SITE_SPEC } from "@/builder/seedSpec";
import { isSiteSpec } from "@/builder/validate";
import type { ChatMessage, GenerateRequest, SiteSpec } from "@/builder/types";

const PREVIEW_URL = "/build/preview";
const STORAGE_KEY = "blaze.builder.v1";

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
    "Hi — describe the site you want and I'll build it. Try \"Show me an example\" for a demo, or describe a hero / palette / brand.",
  createdAt: new Date(0).toISOString(),
};

export default function BuildPage() {
  return (
    // useSearchParams() requires a Suspense boundary in app router.
    <Suspense fallback={<BuildShell />}>
      <BuildInner />
    </Suspense>
  );
}

function BuildShell({ children }: { children?: React.ReactNode } = {}) {
  return (
    <AppShell fixedBody projectName="Untitled Blaze site">
      {children ?? <div className="h-full w-full bg-blaze-bg" />}
    </AppShell>
  );
}

function BuildInner() {
  const params = useSearchParams();

  const [spec, setSpec] = useState<SiteSpec>(EMPTY_SITE_SPEC);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [streamingText, setStreamingText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [lastMetrics, setLastMetrics] = useState<TurnMetrics | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [brain, setBrain] = useState<{ provider: string; model: string } | null>(
    null
  );

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const previewReady = useRef(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const autoSubmitted = useRef(false);

  // ─── Persistence ──────────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PersistedState;
        if (
          parsed.v === 1 &&
          isSiteSpec(parsed.spec) &&
          Array.isArray(parsed.messages)
        ) {
          setSpec(parsed.spec);
          setMessages(parsed.messages.length > 0 ? parsed.messages : [GREETING]);
        }
      }
    } catch {
      // corrupt storage — start fresh
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const state: PersistedState = { v: 1, spec, messages };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // quota / private mode
    }
  }, [hydrated, spec, messages]);

  // ─── Provider info ────────────────────────────────────────────────
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

  // ─── Preview channel ──────────────────────────────────────────────
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

  // ─── Submission ───────────────────────────────────────────────────
  const submitText = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
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
        // Use the *updated* messages list — closure over `messages`
        // would race with the setState above.
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
    },
    [messages, spec]
  );

  const submit = useCallback(() => void submitText(input), [submitText, input]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        submit();
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

  // ─── ?prompt= auto-submit from the landing page ───────────────────
  useEffect(() => {
    if (!hydrated || autoSubmitted.current) return;
    const p = params?.get("prompt");
    if (p && p.trim().length > 0) {
      autoSubmitted.current = true;
      // Replace URL so a reload doesn't double-submit.
      window.history.replaceState(null, "", "/build");
      void submitText(p);
    }
  }, [hydrated, params, submitText]);

  // ─── Auto-scroll chat to bottom on new messages / stream ─────────
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, streamingText, pending]);

  const visibleMessages = useMemo(
    () => messages.filter((m) => m.role !== "system"),
    [messages]
  );

  const right = (
    <div className="flex items-center gap-2">
      <BrainPill brain={brain} />
      <MetricsPill m={lastMetrics} />
    </div>
  );

  return (
    <AppShell fixedBody projectName="Untitled Blaze site" right={right}>
      <div className="flex h-full w-full">
        {/* ─── Chat column ────────────────────────────────── */}
        <aside className="flex h-full w-[380px] shrink-0 flex-col border-r border-blaze-line bg-blaze-surface">
          <div
            ref={scrollerRef}
            className="scrollbar-thin flex-1 space-y-3 overflow-y-auto px-4 py-5 text-sm"
          >
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

          <Composer
            input={input}
            pending={pending}
            onChange={setInput}
            onKeyDown={onKeyDown}
            onSubmit={submit}
            onReset={reset}
          />
        </aside>

        {/* ─── Preview column ─────────────────────────────── */}
        <section className="relative flex h-full flex-1 flex-col bg-blaze-bg">
          <PreviewChrome
            iframeRef={iframeRef}
            onRefresh={() => {
              if (iframeRef.current) {
                previewReady.current = false;
                iframeRef.current.src = PREVIEW_URL;
              }
            }}
          />
          <div className="relative flex-1 overflow-hidden bg-black">
            <iframe
              ref={iframeRef}
              src={PREVIEW_URL}
              title="Site preview"
              className="absolute inset-0 h-full w-full border-0"
            />
          </div>
        </section>
      </div>
    </AppShell>
  );
}

// ── Subcomponents ─────────────────────────────────────────────────

function Composer({
  input,
  pending,
  onChange,
  onKeyDown,
  onSubmit,
  onReset,
}: {
  input: string;
  pending: boolean;
  onChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSubmit: () => void;
  onReset: () => void;
}) {
  return (
    <div className="border-t border-blaze-line bg-blaze-surface2/40 px-3 py-3">
      <div className="rounded-xl border border-blaze-line bg-blaze-bg transition-colors focus-within:border-blaze-accent/60">
        <textarea
          value={input}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Describe a section, a colour change, paste a screenshot URL…"
          rows={3}
          className="block w-full resize-none bg-transparent px-3 py-2.5 text-sm leading-relaxed outline-none placeholder:text-blaze-mutedDim"
          disabled={pending}
        />
        <div className="flex items-center justify-between border-t border-blaze-line px-3 py-1.5 text-[10px] uppercase tracking-widest text-blaze-mutedDim">
          <span>
            {pending ? "streaming…" : "enter to send · shift+enter for newline"}
          </span>
          <button
            type="button"
            onClick={onSubmit}
            disabled={pending || !input.trim()}
            className="rounded-md bg-blaze-accent px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-black hover:bg-blaze-accent2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-end text-[10px] uppercase tracking-widest text-blaze-mutedDim">
        <button
          type="button"
          onClick={onReset}
          className="underline-offset-2 hover:text-blaze-text hover:underline"
          title="Clear chat and saved spec"
        >
          reset
        </button>
      </div>
    </div>
  );
}

function PreviewChrome({
  iframeRef,
  onRefresh,
}: {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  onRefresh: () => void;
}) {
  void iframeRef;
  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-blaze-line bg-blaze-bg px-3 py-2 text-[11px] text-blaze-muted">
      <button
        type="button"
        onClick={onRefresh}
        title="Reload preview"
        className="rounded-md border border-blaze-line bg-blaze-surface px-2 py-1 text-blaze-muted hover:border-blaze-line2 hover:text-blaze-text"
      >
        ↻
      </button>
      <div className="flex-1 truncate rounded-md border border-blaze-line bg-blaze-surface px-2 py-1 font-mono text-[10px] text-blaze-mutedDim">
        blaze.app{PREVIEW_URL}
      </div>
    </div>
  );
}

function BrainPill({
  brain,
}: {
  brain: { provider: string; model: string } | null;
}) {
  if (!brain)
    return (
      <span className="hidden items-center gap-1 rounded-full border border-blaze-line bg-blaze-surface px-2 py-0.5 text-[10px] uppercase tracking-widest text-blaze-mutedDim sm:inline-flex">
        starting…
      </span>
    );
  return (
    <span className="hidden items-center gap-1 rounded-full border border-blaze-line bg-blaze-surface px-2 py-0.5 text-[10px] uppercase tracking-widest text-blaze-muted sm:inline-flex">
      <span className="h-1.5 w-1.5 rounded-full bg-blaze-success" />
      {brain.provider} · {brain.model}
    </span>
  );
}

function MetricsPill({ m }: { m: TurnMetrics | null }) {
  if (!m) return null;
  const tokens = m.usage
    ? `${m.usage.promptTokens}↑${m.usage.completionTokens}↓`
    : "—";
  return (
    <span
      className="hidden rounded-full border border-blaze-line bg-blaze-surface px-2 py-0.5 font-mono text-[10px] text-blaze-muted sm:inline-flex"
      title={m.model}
    >
      {(m.latencyMs / 1000).toFixed(2)}s · {tokens}
    </span>
  );
}

/** Streaming-friendly partial JSON extractor. */
function extractExplanation(buffer: string): string | null {
  const stripped = buffer.replace(/^\s*```(?:json)?\s*/i, "");
  const m = stripped.match(/"explanation"\s*:\s*"((?:[^"\\]|\\.)*)/);
  if (!m) return null;
  return m[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');
}

/** Minimal SSE reader. */
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
        // skip
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
            ? "max-w-[85%] rounded-2xl rounded-br-md border border-blaze-accent/30 bg-blaze-accent/10 px-3.5 py-2.5 text-[13px] text-blaze-text"
            : "max-w-[85%] rounded-2xl rounded-bl-md border border-blaze-line bg-blaze-surface2/70 px-3.5 py-2.5 text-[13px] text-blaze-text"
        }
      >
        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        {message.specPatch && (
          <p className="mt-1.5 text-[10px] uppercase tracking-widest text-blaze-mutedDim">
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
      <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-blaze-line bg-blaze-surface2/70 px-3.5 py-2.5 text-[13px] text-blaze-text">
        <p className="whitespace-pre-wrap leading-relaxed">
          {text}
          <span className="ml-0.5 inline-block h-3 w-1 translate-y-0.5 animate-pulse bg-blaze-accent align-baseline" />
        </p>
      </div>
    </div>
  );
}

function ThinkingBubble() {
  return (
    <div className="flex justify-start">
      <div className="rounded-2xl rounded-bl-md border border-blaze-line bg-blaze-surface2/70 px-3.5 py-2.5">
        <span className="inline-flex items-center gap-1">
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
      className="inline-block h-1.5 w-1.5 animate-blaze-pulse rounded-full bg-blaze-muted"
      style={{ animationDelay: delay }}
    />
  );
}

function ErrorBubble({ error }: { error: string }) {
  return (
    <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
      <p className="font-semibold uppercase tracking-widest text-red-400">
        Error
      </p>
      <p className="mt-1 whitespace-pre-wrap break-all">{error}</p>
    </div>
  );
}
