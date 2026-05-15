"use client";

/**
 * /studio — the Figma-style 3D placement canvas.
 *
 *  ┌─────────────────────────────────────────────────────────────┐
 *  │ AppShell topbar: Chat / Studio / Preview                    │
 *  ├──────────────┬──────────────────────────────┬───────────────┤
 *  │ Tools  (60)  │  Live preview iframe (fluid) │ Inspector 280 │
 *  │  - select    │   + transparent overlay      │  - section    │
 *  │  - place     │     drawing rects + handles  │  - placement  │
 *  │              │                              │  - anchor xyz │
 *  └──────────────┴──────────────────────────────┴───────────────┘
 *
 * The new layout splits the old single-column inspector into a narrow
 * tool-rail on the left (Figma-style) and a properties inspector on
 * the right. This keeps the preview as wide as possible — the main
 * frustration with the old layout.
 *
 * State / persistence behaviour is preserved from Phase 3:
 *   - localStorage under `blaze.builder.v1` shared with /build
 *   - postMessage channel to the iframe: ready / rects / clicks
 *   - `placementModeRef` + `selectedModelRef` avoid stale closures
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppShell } from "@/components/AppShell";
import { EMPTY_SITE_SPEC } from "@/builder/seedSpec";
import { isSiteSpec } from "@/builder/validate";
import type { SectionInvocation, SiteSpec, ThreeDPlacement } from "@/builder/types";
import { MODEL_OPTIONS, makeDefaultPlacement } from "@/builder/threeD/models";

const PREVIEW_URL = "/build/preview";
const STORAGE_KEY = "blaze.builder.v1";

interface PersistedState {
  v: 1;
  spec: SiteSpec;
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

  useEffect(() => {
    if (previewReady.current) sendSpec(spec);
  }, [spec, sendSpec]);

  useEffect(() => {
    placementModeRef.current = placementMode;
  }, [placementMode]);
  useEffect(() => {
    selectedModelRef.current = selectedModel;
  }, [selectedModel]);

  useEffect(() => {
    function onMessage(ev: MessageEvent) {
      if (!isPreviewMessage(ev.data)) return;
      const data = ev.data;
      if (data.kind === "blaze:preview-ready") {
        previewReady.current = true;
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

  return (
    <AppShell fixedBody projectName="Untitled Blaze site" right={<ModePill mode={placementMode} />}>
      <div className="flex h-full w-full">
        {/* ─── Left tool rail ─────────────────────────────── */}
        <aside className="flex h-full w-14 shrink-0 flex-col items-center gap-1 border-r border-blaze-line bg-blaze-surface py-3">
          <ToolButton
            active={placementMode === "select"}
            onClick={() => setPlacementMode("select")}
            label="Select"
            shortcut="V"
          >
            <CursorIcon className="h-4 w-4" />
          </ToolButton>
          <ToolButton
            active={placementMode === "place"}
            onClick={() => setPlacementMode("place")}
            label="Place"
            shortcut="P"
          >
            <PlusIcon className="h-4 w-4" />
          </ToolButton>
        </aside>

        {/* ─── Center preview + overlay ───────────────────── */}
        <section className="relative flex h-full flex-1 flex-col bg-blaze-bg">
          <div className="flex shrink-0 items-center gap-2 border-b border-blaze-line bg-blaze-bg px-3 py-2 text-[11px] text-blaze-muted">
            <button
              type="button"
              onClick={() => {
                if (iframeRef.current) {
                  previewReady.current = false;
                  iframeRef.current.src = PREVIEW_URL;
                }
              }}
              title="Reload preview"
              className="rounded-md border border-blaze-line bg-blaze-surface px-2 py-1 hover:border-blaze-line2 hover:text-blaze-text"
            >
              ↻
            </button>
            <div className="flex-1 truncate rounded-md border border-blaze-line bg-blaze-surface px-2 py-1 font-mono text-[10px] text-blaze-mutedDim">
              blaze.app{PREVIEW_URL}
            </div>
            <span className="hidden rounded-md border border-blaze-line bg-blaze-surface px-2 py-1 font-mono text-[10px] text-blaze-mutedDim sm:inline">
              {viewport.w || "—"} × {viewport.h || "—"}
            </span>
          </div>
          <div className="relative flex-1 overflow-hidden bg-black">
            <iframe
              ref={iframeRef}
              src={PREVIEW_URL}
              title="Blaze preview"
              className="absolute inset-0 h-full w-full border-0"
            />
            <PreviewOverlay
              rects={rects}
              scrollY={scrollY}
              spec={spec}
              selectedSectionId={selectedSectionId}
              mode={placementMode}
            />
          </div>
        </section>

        {/* ─── Right inspector ────────────────────────────── */}
        <aside className="flex h-full w-[300px] shrink-0 flex-col border-l border-blaze-line bg-blaze-surface">
          <Panel title="Model to drop">
            <div className="flex flex-col gap-1">
              {MODEL_OPTIONS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedModel(m.id)}
                  className={[
                    "rounded-md border px-2.5 py-1.5 text-left text-xs transition-colors",
                    selectedModel === m.id
                      ? "border-blaze-accent/60 bg-blaze-accent/10 text-blaze-text"
                      : "border-blaze-line bg-transparent text-blaze-muted hover:border-blaze-line2 hover:text-blaze-text",
                  ].join(" ")}
                >
                  <div className="font-medium">{m.label}</div>
                  <div className="mt-0.5 text-[10px] opacity-70">{m.description}</div>
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="Sections" flex>
            <ul className="flex flex-col gap-1">
              {spec.sections.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedSectionId(s.id)}
                    className={[
                      "flex w-full items-center justify-between rounded-md border px-2.5 py-1.5 text-left text-xs transition-colors",
                      selectedSectionId === s.id
                        ? "border-blaze-accent/60 bg-blaze-accent/10"
                        : "border-blaze-line hover:border-blaze-line2",
                    ].join(" ")}
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
                <li className="rounded-md border border-dashed border-blaze-line px-2 py-3 text-center text-[11px] text-blaze-muted">
                  No sections yet — head to <span className="text-blaze-text">Chat</span> and prompt for a page first.
                </li>
              ) : null}
            </ul>
          </Panel>

          {selectedSection ? (
            <PlacementInspector
              section={selectedSection}
              onUpdate={(patch) => updatePlacement(selectedSection.id, patch)}
              onUpdateAnchor={(a) => updatePlacementAnchor(selectedSection.id, a)}
              onRemove={() => removePlacement(selectedSection.id)}
            />
          ) : null}
        </aside>
      </div>
    </AppShell>
  );
}

// ── Subcomponents ─────────────────────────────────────────────────

function Panel({
  title,
  flex,
  children,
}: {
  title: string;
  flex?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={[
        "border-b border-blaze-line px-3 py-3",
        flex && "scrollbar-thin flex-1 overflow-y-auto",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <h2 className="mb-2 text-[10px] font-medium uppercase tracking-widest text-blaze-mutedDim">
        {title}
      </h2>
      {children}
    </section>
  );
}

function ToolButton({
  active,
  onClick,
  label,
  shortcut,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  shortcut?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={shortcut ? `${label} (${shortcut})` : label}
      className={[
        "group relative grid h-9 w-9 place-items-center rounded-md transition-colors",
        active
          ? "bg-blaze-accent/15 text-blaze-accent ring-1 ring-blaze-accent/40"
          : "text-blaze-muted hover:bg-blaze-surface2 hover:text-blaze-text",
      ].join(" ")}
    >
      {children}
      {shortcut ? (
        <span className="pointer-events-none absolute left-full ml-2 hidden whitespace-nowrap rounded-md border border-blaze-line bg-blaze-surface2 px-2 py-1 text-[10px] uppercase tracking-widest text-blaze-muted shadow-blaze-pop group-hover:block">
          {label} <span className="ml-1 rounded bg-blaze-line2 px-1 font-mono text-blaze-text">{shortcut}</span>
        </span>
      ) : null}
    </button>
  );
}

function ModePill({ mode }: { mode: "select" | "place" }) {
  return (
    <span
      className={[
        "hidden items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-widest sm:inline-flex",
        mode === "place"
          ? "border-blaze-accent/40 bg-blaze-accent/10 text-blaze-accent"
          : "border-blaze-line bg-blaze-surface text-blaze-muted",
      ].join(" ")}
    >
      <span className={mode === "place" ? "h-1.5 w-1.5 rounded-full bg-blaze-accent" : "h-1.5 w-1.5 rounded-full bg-blaze-muted"} />
      {mode} mode
    </span>
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
    <section className="border-t border-blaze-line bg-blaze-surface2/50 px-3 py-3">
      <h2 className="text-[10px] font-medium uppercase tracking-widest text-blaze-mutedDim">
        Placement · <span className="text-blaze-text">{section.id}</span>
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
            <span className="font-mono text-blaze-text">
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
                className="rounded-md border border-blaze-line bg-blaze-bg px-2 py-1 text-xs"
              />
            </label>
          ) : null}
          <button
            type="button"
            onClick={onRemove}
            className="mt-1 rounded-md border border-red-500/40 bg-red-500/10 px-2 py-1 text-xs text-red-300 hover:bg-red-500/20"
          >
            remove 3D layer
          </button>
        </div>
      )}
    </section>
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
          className="w-full rounded-md border border-blaze-line bg-blaze-bg px-1.5 py-1 text-right font-mono text-[11px]"
        />
      ))}
    </div>
  );
}

function PreviewOverlay({
  rects,
  scrollY,
  spec,
  selectedSectionId,
  mode,
}: {
  rects: SectionRect[];
  scrollY: number;
  spec: SiteSpec;
  selectedSectionId: string | null;
  mode: "select" | "place";
}) {
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
        const screenLeft = 0;
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

// ── Icons (inline SVG, no external dep) ──────────────────────────

function CursorIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 3l5 14 2-6 6-2-13-6z" />
    </svg>
  );
}

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
