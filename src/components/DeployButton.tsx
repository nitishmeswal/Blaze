"use client";

/**
 * DeployButton — the top-right "Deploy" action in the AppShell.
 *
 * Reads the current SiteSpec from `blaze.builder.v1` (shared with
 * /build + /studio), then opens a small modal offering two targets:
 *
 *   • Download project (.zip)   POSTs to /api/deploy?target=zip,
 *                              streams the resulting zip to a
 *                              browser-triggered download.
 *   • Deploy to Vercel          POSTs to /api/deploy?target=vercel,
 *                              shows the returned preview URL.
 *
 * Deliberately keeps state local to the component — no global store,
 * no router events. The modal closes on Escape and on backdrop click.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { isSiteSpec } from "@/builder/validate";
import type { SiteSpec } from "@/builder/types";
import { cn } from "@/lib/cn";

const STORAGE_KEY = "blaze.builder.v1";

interface PersistedState {
  v: 1;
  spec: SiteSpec;
}

interface DeployState {
  phase: "idle" | "zipping" | "deploying" | "success" | "error";
  /** Resulting URL after a successful Vercel deploy. */
  url?: string;
  /** Last error message (zip or vercel). */
  error?: string;
}

function readSpec(): SiteSpec | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    if (!parsed || !parsed.spec) return null;
    return isSiteSpec(parsed.spec) ? parsed.spec : null;
  } catch {
    return null;
  }
}

export function DeployButton() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<DeployState>({ phase: "idle" });
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  // Reset deploy state when modal closes so the next open is fresh.
  const closeModal = useCallback(() => {
    setOpen(false);
    // Don't blow away success/error mid-close so the click that
    // triggers close doesn't flash 'idle'.
    setTimeout(() => setState({ phase: "idle" }), 200);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeModal]);

  const handleZip = useCallback(async () => {
    const spec = readSpec();
    if (!spec) {
      setState({
        phase: "error",
        error:
          "No site spec found. Build something in Chat first, then try again.",
      });
      return;
    }
    setState({ phase: "zipping" });
    try {
      const res = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spec, target: "zip" }),
      });
      if (!res.ok) {
        const detail = (await safeJson(res)) as { error?: string } | null;
        throw new Error(detail?.error ?? `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const filename = extractFilename(res) ?? "blaze-site.zip";
      triggerDownload(blob, filename);
      setState({ phase: "success" });
    } catch (err) {
      setState({
        phase: "error",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }, []);

  const handleVercel = useCallback(async () => {
    const spec = readSpec();
    if (!spec) {
      setState({
        phase: "error",
        error:
          "No site spec found. Build something in Chat first, then try again.",
      });
      return;
    }
    setState({ phase: "deploying" });
    try {
      const res = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spec, target: "vercel" }),
      });
      const payload = (await safeJson(res)) as
        | { url?: string; error?: string }
        | null;
      if (!res.ok || !payload?.url) {
        throw new Error(payload?.error ?? `HTTP ${res.status}`);
      }
      setState({ phase: "success", url: payload.url });
    } catch (err) {
      setState({
        phase: "error",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }, []);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md bg-blaze-text px-2.5 py-1 text-xs font-semibold text-blaze-bg hover:bg-white"
      >
        Deploy
      </button>
      {open ? (
        <DeployModal
          state={state}
          onClose={closeModal}
          onZip={handleZip}
          onVercel={handleVercel}
        />
      ) : null}
    </>
  );
}

function DeployModal({
  state,
  onClose,
  onZip,
  onVercel,
}: {
  state: DeployState;
  onClose: () => void;
  onZip: () => void;
  onVercel: () => void;
}) {
  const busy = state.phase === "zipping" || state.phase === "deploying";

  // Mount via portal so the modal escapes the AppShell header's
  // backdrop-blur containing block (otherwise `position: fixed`
  // anchors to the header instead of the viewport).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-xl border border-blaze-line bg-blaze-bg shadow-2xl">
        <header className="flex items-center justify-between border-b border-blaze-line px-5 py-3">
          <h2 className="text-sm font-semibold tracking-tight text-blaze-text">
            Deploy your site
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="text-xs text-blaze-mutedDim hover:text-blaze-text disabled:cursor-not-allowed"
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        <div className="space-y-3 px-5 py-4 text-sm text-blaze-text">
          {state.phase === "idle" ? (
            <>
              <p className="text-blaze-muted">
                Pick how you want to ship. Both compile the current
                spec into a complete Next.js project.
              </p>
              <button
                type="button"
                onClick={onVercel}
                className={cn(
                  "block w-full rounded-lg border border-blaze-accent/40 bg-blaze-accent/15 px-4 py-3 text-left",
                  "hover:border-blaze-accent hover:bg-blaze-accent/25"
                )}
              >
                <div className="text-sm font-semibold text-blaze-text">
                  Deploy to Vercel
                </div>
                <div className="mt-0.5 text-xs text-blaze-muted">
                  POST → Vercel API → live preview URL in ~30s.
                </div>
              </button>
              <button
                type="button"
                onClick={onZip}
                className={cn(
                  "block w-full rounded-lg border border-blaze-line bg-blaze-surface px-4 py-3 text-left",
                  "hover:border-blaze-line2 hover:bg-blaze-line2/60"
                )}
              >
                <div className="text-sm font-semibold text-blaze-text">
                  Download project (.zip)
                </div>
                <div className="mt-0.5 text-xs text-blaze-muted">
                  Get the full Next.js source. Push anywhere, host
                  anywhere.
                </div>
              </button>
            </>
          ) : null}

          {state.phase === "zipping" ? (
            <Pending text="Bundling project…" />
          ) : null}
          {state.phase === "deploying" ? (
            <Pending text="Uploading to Vercel and waiting on a deploy ID…" />
          ) : null}

          {state.phase === "success" ? (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-emerald-300">
                Deploy started.
              </p>
              {state.url ? (
                <div className="space-y-1">
                  <p className="text-xs text-blaze-muted">
                    Vercel will keep building in the background. Open
                    the URL to see status / final site:
                  </p>
                  <a
                    href={state.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="block break-all rounded-md border border-blaze-line bg-blaze-surface px-3 py-2 text-xs font-mono text-blaze-accent hover:bg-blaze-line2/40"
                  >
                    {state.url}
                  </a>
                </div>
              ) : (
                <p className="text-xs text-blaze-muted">
                  Your download should have started.
                </p>
              )}
            </div>
          ) : null}

          {state.phase === "error" ? (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-rose-300">
                Deploy failed.
              </p>
              <pre className="max-h-40 overflow-auto rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
                {state.error ?? "Unknown error"}
              </pre>
            </div>
          ) : null}
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-blaze-line px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-md border border-blaze-line bg-blaze-surface px-3 py-1.5 text-xs text-blaze-muted hover:text-blaze-text disabled:cursor-not-allowed"
          >
            {state.phase === "idle" ? "Cancel" : "Close"}
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}

function Pending({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-blaze-line bg-blaze-surface px-3 py-3 text-xs text-blaze-muted">
      <span className="block h-3 w-3 animate-spin rounded-full border-2 border-blaze-line2 border-t-blaze-accent" />
      <span>{text}</span>
    </div>
  );
}

async function safeJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function extractFilename(res: Response): string | null {
  const cd = res.headers.get("Content-Disposition");
  if (!cd) return null;
  const m = /filename="([^"]+)"/.exec(cd);
  return m ? m[1] : null;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Give the browser a tick to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
