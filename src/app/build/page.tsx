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
 * Phase 1:
 *   - Send/receive flow against /api/generate
 *   - Iframe preview driven by postMessage
 *   - In-memory state (no persistence)
 *
 * Phase 2 will swap the mock provider for Ollama; UI doesn't change.
 * Phase 3 layers the Figma-like 3D placement canvas over the iframe.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EMPTY_SITE_SPEC } from "@/builder/seedSpec";
import type {
  ChatMessage,
  GenerateRequest,
  GenerateResponse,
  SiteSpec,
} from "@/builder/types";

const PREVIEW_URL = "/build/preview";

function randomId(): string {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function BuildPage() {
  const [spec, setSpec] = useState<SiteSpec>(EMPTY_SITE_SPEC);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: randomId(),
      role: "assistant",
      content:
        "Hi — describe the site you want and I'll build it. Try: \"Show me an example\" to see the demo.",
      createdAt: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const previewReady = useRef(false);
  const [brain, setBrain] = useState<{ provider: string; model: string } | null>(
    null
  );

  useEffect(() => {
    let alive = true;
    fetch("/api/status")
      .then((r) => r.json())
      .then((d: { provider: string; model: string }) => {
        if (alive) setBrain(d);
      })
      .catch(() => {
        // Best-effort label only — silent fail is fine.
      });
    return () => {
      alive = false;
    };
  }, []);

  /** Push the current spec to the iframe whenever it changes (or the iframe says it's ready). */
  const pushSpec = useCallback(
    (nextSpec: SiteSpec) => {
      iframeRef.current?.contentWindow?.postMessage(
        { kind: "blaze:set-spec", spec: nextSpec },
        "*"
      );
    },
    []
  );

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
      const data = (await res.json()) as GenerateResponse | { error: string };
      if (!res.ok || "error" in data) {
        const msg = "error" in data ? data.error : `${res.status} ${res.statusText}`;
        setError(msg);
        return;
      }
      setMessages((m) => [...m, data.message]);
      if (data.spec) setSpec(data.spec);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPending(false);
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
          {pending && <ThinkingBubble />}
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
              <span>{pending ? "thinking…" : "enter to send · shift+enter for newline"}</span>
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
      <p className="mt-1">{error}</p>
    </div>
  );
}
