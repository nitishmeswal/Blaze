"use client";

/**
 * /studio — the Figma-style 3D placement canvas.
 *
 *  ┌────────────────────────┬────────────────────────────────────┐
 *  │ Inspector (left, 320)  │  Live preview iframe + overlay     │
 *  │  - model picker        │  /build/preview                    │
 *  │  - section list        │   ↑ transparent <div> for clicks   │
 *  │  - selected placement  │     and marker handles             │
 *  │    inspector           │                                    │
 *  └────────────────────────┴────────────────────────────────────┘
 *
 * Why "real preview + overlay" instead of an abstract canvas?
 *   - The user wants to position a 3D model on the ACTUAL rendered
 *     page (not a Figma mockup that diverges from the deployed
 *     output). The iframe shows the same SiteRenderer that ships in
 *     `/build/preview`, so what you see here = what gets deployed.
 *   - The overlay receives clicks, converts them to section-local
 *     coordinates (using rects the iframe posts back), and writes a
 *     ThreeDPlacement into the section. SiteRenderer's ThreeDLayer
 *     then mounts the model in-iframe so it appears immediately.
 *
 * State lives in localStorage under the same `blaze.builder.v1` key
 * the /build page uses, so authoring in studio carries over to chat
 * (and vice versa).
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { EMPTY_SITE_SPEC } from "@/builder/seedSpec";
import { isSiteSpec } from "@/builder/validate";
import type { SectionInvocation, SiteSpec, ThreeDPlacement } from "@/builder/types";
import { MODEL_OPTIONS, makeDefaultPlacement } from "@/builder/threeD/models";

const PREVIEW_URL = "/build/preview";
const STORAGE_KEY = "blaze.builder.v1";

interface PersistedState {
  v: 1;
  spec: SiteSpec;
  // /build page also persists messages; we don't touch them here.
  messages?: unknown;
}

interface SectionRect {
  id: string;
  top: number;
  bottom: number;
  width: number;
  height: number;
}

interface SectionRectsMessage {
  kind: "blaze:section-rects";
  rects: SectionRect[];
  scrollY: number;
  viewportWidth: number;
  viewportHeight: number;
}

interface SectionClickMessage {
  kind: "blaze:section-click";
  sectionId: string;
  localX: number;
  localY: number;
  width: number;
  height: number;
}

interface ScrollMessage {
  kind: "blaze:scroll";
  scrollY: number;
}

interface PreviewReadyMessage {
  kind: "blaze:preview-ready";
}

type PreviewMessage =
  | SectionRectsMessage
  | SectionClickMessage
  | ScrollMessage
  | PreviewReadyMessage;

function isPreviewMessage(data: unknown): data is PreviewMessage {
  if (!data || typeof data !== "object") return false;
  const k = (data as { kind?: unknown }).kind;
  return (
    k === "blaze:section-rects" ||
    k === "blaze:section-click" ||
    k === "blaze:scroll" ||
    k === "blaze:preview-ready"
  );
}

export default function StudioPage() {
  const [spec, setSpec] = useState<SiteSpec>(EMPTY_SITE_SPEC);
  const [hydrated, setHydrated] = useState(false);
  const [rects, setRects] = useState<SectionRect[]>([]);
  const [scrollY, setScrollY] = useState(0);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const [selectedModel, setSelectedModel] = useState<string>("sphere");
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [placementMode, setPlacementMode] = useState<"select" | "place">("select");

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const previewReady = useRef(false);
  // Stable refs for callbacks — the postMessage listener captures these
  // by reference so it always sees the latest mode / model / spec without
  // re-binding the listener (which would otherwise drop messages during
  // re-renders).
  const placementModeRef = useRef<"select" | "place">("select");
  const selectedModelRef = useRef<string>("sphere");

  // ─── Persistence ──────────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PersistedState;
        if (parsed.v === 1 && isSiteSpec(parsed.spec)) {
          setSpec(parsed.spec);
        }
      }
    } catch {
      // ignore corrupt storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      // Read-modify-write so we don't clobber /build's message history.
      const raw = localStorage.getItem(STORAGE_KEY);
      const existing = raw ? (JSON.parse(raw) as PersistedState) : null;
      const next: PersistedState = {
        v: 1,
        spec,
        messages: existing?.messages ?? [],
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // quota / private mode
    }
  }, [hydrated, spec]);

  // ─── Preview channel ──────────────────────────────────────────────
  const sendSpec = useCallback((s: SiteSpec) => {
    const w = iframeRef.current?.contentWindow;
    if (!w) return;
    w.postMessage({ kind: "blaze:set-spec", spec: s }, "*");
  }, []);

  // Push spec on every change once the preview is ready.
  useEffect(() => {
    if (previewReady.current) sendSpec(spec);
  }, [spec, sendSpec]);

  // Keep refs in sync with state on every render so the listener sees
  // the latest values.
  useEffect(() => {
    placementModeRef.current = placementMode;
  }, [placementMode]);
  useEffect(() => {
    selectedModelRef.current = selectedModel;
  }, [selectedModel]);

  // Receive ready / rects / clicks from the iframe. Listener binds once
  // and reads through refs so we don't churn message subscriptions.
  useEffect(() => {
    function onMessage(ev: MessageEvent) {
      if (!isPreviewMessage(ev.data)) return;
      const data = ev.data;
      if (data.kind === "blaze:preview-ready") {
        previewReady.current = true;
        // Push the LATEST spec, not the one captured at bind time.
        // We read it from localStorage to avoid a stale closure.
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw) as PersistedState;
            if (parsed.v === 1 && isSiteSpec(parsed.spec)) {
              sendSpec(parsed.spec);
            }
          }
        } catch {
          // ignore
        }
        // Tell the iframe we're in studio mode so it forwards clicks.
        iframeRef.current?.contentWindow?.postMessage(
          { kind: "blaze:studio-mode", active: true },
          "*"
        );
        return;
      }
      if (data.kind === "blaze:section-rects") {
        setRects(data.rects);
        setScrollY(data.scrollY);
        setViewport({ w: data.viewportWidth, h: data.viewportHeight });
        return;
      }
      if (data.kind === "blaze:scroll") {
        setScrollY(data.scrollY);
        return;
      }
      if (data.kind === "blaze:section-click") {
        if (placementModeRef.current === "select") {
          setSelectedSectionId(data.sectionId);
          return;
        }
        const anchor = { x: data.localX, y: data.localY, z: 0 };
        const placement = makeDefaultPlacement(
          selectedModelRef.current,
          anchor
        );
        setSpec((prev) => ({
          ...prev,
          sections: prev.sections.map((s) =>
            s.id === data.sectionId ? { ...s, threeD: placement } : s
          ),
        }));
        setSelectedSectionId(data.sectionId);
        setPlacementMode("select");
        return;
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [sendSpec]);

  // ─── Mutations ────────────────────────────────────────────────────
  const updateSection = useCallback(
    (id: string, mut: (s: SectionInvocation) => SectionInvocation) => {
      setSpec((prev) => ({
        ...prev,
        sections: prev.sections.map((s) => (s.id === id ? mut(s) : s)),
      }));
    },
    []
  );

  const updatePlacement = useCallback(
    (id: string, patch: Partial<ThreeDPlacement>) => {
      updateSection(id, (s) =>
        s.threeD ? { ...s, threeD: { ...s.threeD, ...patch } } : s
      );
    },
    [updateSection]
  );

  const updatePlacementAnchor = useCallback(
    (id: string, anchor: { x: number; y: number; z: number }) => {
      updateSection(id, (s) =>
        s.threeD ? { ...s, threeD: { ...s.threeD, anchor } } : s
      );
    },
    [updateSection]
  );

  const removePlacement = useCallback(
    (id: string) => {
      updateSection(id, (s) => {
        const next: SectionInvocation = { ...s };
        delete (next as { threeD?: unknown }).threeD;
        return next;
      });
    },
    [updateSection]
  );

  const selectedSection = useMemo(
    () => spec.sections.find((s) => s.id === selectedSectionId) ?? null,
    [spec.sections, selectedSectionId]
  );

  // ─── Overlay rendering ────────────────────────────────────────────
  // The overlay sits exactly on top of the iframe and draws boxes
  // around each section + handles for any placement.
  return (
    <div className="flex h-screen w-full overflow-hidden bg-blaze-bg text-blaze-text">
      <aside className="flex w-80 flex-col border-r border-blaze-line/60 bg-blaze-bg/90">
        <header className="border-b border-blaze-line/60 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-sm font-semibold">Blaze Studio</h1>
            <Link
              href="/build"
              className="text-xs text-blaze-muted hover:text-blaze-text"
            >
              ← chat
            </Link>
          </div>
          <p className="mt-1 text-[11px] text-blaze-muted">
            Drop 3D models on the live preview. Placements save to the same
            spec your /build chat is editing.
          </p>
        </header>

        <section className="border-b border-blaze-line/60 px-4 py-3">
          <h2 className="text-[11px] uppercase tracking-widest text-blaze-muted">
            mode
          </h2>
          <div className="mt-2 grid grid-cols-2 gap-1">
            <button
              type="button"
              className={modeBtn(placementMode === "select")}
              onClick={() => setPlacementMode("select")}
            >
              select
            </button>
            <button
              type="button"
              className={modeBtn(placementMode === "place")}
              onClick={() => setPlacementMode("place")}
              title="Click anywhere on the preview to drop the selected model"
            >
              place
            </button>
          </div>
        </section>

        <section className="border-b border-blaze-line/60 px-4 py-3">
          <h2 className="text-[11px] uppercase tracking-widest text-blaze-muted">
            model to drop
          </h2>
          <div className="mt-2 flex flex-col gap-1">
            {MODEL_OPTIONS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedModel(m.id)}
                className={`rounded-md border px-2 py-1.5 text-left text-xs transition-colors ${
                  selectedModel === m.id
                    ? "border-blaze-accent/60 bg-blaze-accent/10 text-blaze-text"
                    : "border-blaze-line/60 bg-transparent text-blaze-muted hover:border-blaze-line hover:text-blaze-text"
                }`}
              >
                <div className="font-medium">{m.label}</div>
                <div className="text-[10px] opacity-70">{m.description}</div>
              </button>
            ))}
          </div>
        </section>

        <section className="flex-1 overflow-auto px-4 py-3">
          <h2 className="text-[11px] uppercase tracking-widest text-blaze-muted">
            sections
          </h2>
          <ul className="mt-2 flex flex-col gap-1">
            {spec.sections.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setSelectedSectionId(s.id)}
                  className={`flex w-full items-center justify-between rounded-md border px-2 py-1.5 text-left text-xs transition-colors ${
                    selectedSectionId === s.id
                      ? "border-blaze-accent/60 bg-blaze-accent/10"
                      : "border-blaze-line/60 hover:border-blaze-line"
                  }`}
                >
                  <span className="truncate">
                    <span className="font-medium">{s.id}</span>{" "}
                    <span className="text-blaze-muted">· {s.componentId}</span>
                  </span>
                  {s.threeD ? (
                    <span className="ml-2 rounded bg-blaze-accent/20 px-1.5 py-0.5 text-[10px] text-blaze-accent">
                      3D
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
            {spec.sections.length === 0 ? (
              <li className="rounded-md border border-dashed border-blaze-line/60 px-2 py-3 text-center text-[11px] text-blaze-muted">
                No sections yet — head to /build and prompt for a page first.
              </li>
            ) : null}
          </ul>
        </section>

        {selectedSection ? (
          <PlacementInspector
            section={selectedSection}
            onUpdate={(patch) => updatePlacement(selectedSection.id, patch)}
            onUpdateAnchor={(a) => updatePlacementAnchor(selectedSection.id, a)}
            onRemove={() => removePlacement(selectedSection.id)}
          />
        ) : null}
      </aside>

      <main className="relative flex-1 overflow-hidden">
        <iframe
          ref={iframeRef}
          src={PREVIEW_URL}
          title="Blaze preview"
          className="absolute inset-0 h-full w-full border-0 bg-black"
        />
        {/* Overlay — drawn on top of the iframe. pointer-events: none
            for the bulk; section boxes + handles are pointer-events:auto
            for selection but never block clicks on the iframe content. */}
        <PreviewOverlay
          rects={rects}
          scrollY={scrollY}
          viewport={viewport}
          spec={spec}
          selectedSectionId={selectedSectionId}
          mode={placementMode}
        />
      </main>
    </div>
  );
}

function PlacementInspector({
  section,
  onUpdate,
  onUpdateAnchor,
  onRemove,
}: {
  section: SectionInvocation;
  onUpdate: (patch: Partial<ThreeDPlacement>) => void;
  onUpdateAnchor: (a: { x: number; y: number; z: number }) => void;
  onRemove: () => void;
}) {
  const p = section.threeD;
  return (
    <div className="border-t border-blaze-line/60 bg-blaze-bg/95 px-4 py-3">
      <h2 className="text-[11px] uppercase tracking-widest text-blaze-muted">
        placement · {section.id}
      </h2>
      {!p ? (
        <p className="mt-2 text-xs text-blaze-muted">
          No 3D layer on this section yet. Switch to{" "}
          <strong className="text-blaze-text">place</strong> mode and click on
          the section in the preview to drop one.
        </p>
      ) : (
        <div className="mt-2 flex flex-col gap-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-blaze-muted">model</span>
            <span className="font-mono">
              {p.model.kind === "gltf" ? "gltf" : p.model.componentId}
            </span>
          </div>
          <CoordRow
            label="anchor"
            value={p.anchor ?? { x: 0, y: 0, z: 0 }}
            onChange={onUpdateAnchor}
          />
          {p.model.kind === "gltf" ? (
            <label className="flex flex-col gap-1">
              <span className="text-blaze-muted">URL</span>
              <input
                type="url"
                value={p.model.url}
                onChange={(e) =>
                  onUpdate({
                    model: { kind: "gltf", url: e.target.value },
                  })
                }
                placeholder="https://…/model.glb"
                className="rounded border border-blaze-line/60 bg-black/40 px-2 py-1 text-xs"
              />
            </label>
          ) : null}
          <button
            type="button"
            onClick={onRemove}
            className="mt-1 rounded border border-red-500/40 bg-red-500/10 px-2 py-1 text-xs text-red-300 hover:bg-red-500/20"
          >
            remove 3D layer
          </button>
        </div>
      )}
    </div>
  );
}

function CoordRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: { x: number; y: number; z: number };
  onChange: (a: { x: number; y: number; z: number }) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="w-12 text-blaze-muted">{label}</span>
      {(["x", "y", "z"] as const).map((axis) => (
        <input
          key={axis}
          type="number"
          step="1"
          value={Math.round(value[axis])}
          onChange={(e) =>
            onChange({ ...value, [axis]: Number(e.target.value) || 0 })
          }
          className="w-full rounded border border-blaze-line/60 bg-black/40 px-1.5 py-1 text-right font-mono text-[11px]"
        />
      ))}
    </div>
  );
}

function PreviewOverlay({
  rects,
  scrollY,
  viewport,
  spec,
  selectedSectionId,
  mode,
}: {
  rects: SectionRect[];
  scrollY: number;
  viewport: { w: number; h: number };
  spec: SiteSpec;
  selectedSectionId: string | null;
  mode: "select" | "place";
}) {
  void viewport;
  const sectionsById = useMemo(
    () => Object.fromEntries(spec.sections.map((s) => [s.id, s])),
    [spec.sections]
  );

  return (
    <div
      className="pointer-events-none absolute inset-0"
      data-overlay
      data-mode={mode}
      style={{ cursor: mode === "place" ? "crosshair" : "default" }}
    >
      {rects.map((r) => {
        const section = sectionsById[r.id];
        if (!section) return null;
        const isSelected = selectedSectionId === r.id;
        const screenTop = r.top - scrollY;
        const screenLeft = 0; // iframe fills the main area
        return (
          <div key={r.id}>
            <div
              className="absolute"
              style={{
                top: screenTop,
                left: screenLeft,
                width: r.width,
                height: r.height,
                border: isSelected
                  ? "1.5px solid rgba(255,90,31,0.85)"
                  : "1px dashed rgba(255,255,255,0.18)",
                boxShadow: isSelected ? "0 0 0 1px rgba(255,90,31,0.2)" : undefined,
                background:
                  mode === "place"
                    ? "rgba(255,90,31,0.04)"
                    : "transparent",
              }}
            >
              <span
                className="absolute -top-5 left-0 rounded-sm bg-black/70 px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-blaze-muted"
                style={{ pointerEvents: "none" }}
              >
                {r.id} · {section.componentId}
                {section.threeD ? " · 3D" : ""}
              </span>
            </div>
            {section.threeD?.anchor ? (
              <PlacementMarker
                top={screenTop + (section.threeD.anchor.y ?? 0)}
                left={screenLeft + (section.threeD.anchor.x ?? 0)}
                label={
                  section.threeD.model.kind === "gltf"
                    ? "gltf"
                    : section.threeD.model.componentId
                }
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function PlacementMarker({
  top,
  left,
  label,
}: {
  top: number;
  left: number;
  label: string;
}) {
  return (
    <div
      className="absolute z-20"
      style={{ top: top - 12, left: left - 12, pointerEvents: "none" }}
    >
      <div className="h-6 w-6 rounded-full border-2 border-blaze-accent bg-blaze-accent/30 shadow-[0_0_12px_rgba(255,90,31,0.6)]" />
      <span className="absolute left-7 top-0 whitespace-nowrap rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-mono text-blaze-accent">
        {label}
      </span>
    </div>
  );
}

function modeBtn(active: boolean): string {
  return [
    "rounded-md px-2 py-1.5 text-xs transition-colors",
    active
      ? "bg-blaze-accent text-black"
      : "border border-blaze-line/60 text-blaze-muted hover:text-blaze-text",
  ].join(" ");
}
