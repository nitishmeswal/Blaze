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
import type {
  PlacementKeyframe,
  PlacementMotion,
  SectionInvocation,
  SiteSpec,
  ThreeDPlacement,
} from "@/builder/types";
import { MODEL_OPTIONS, makeDefaultPlacement } from "@/builder/threeD/models";
import { EASING_LABELS } from "@/builder/threeD/easing";

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

/**
 * Studio placement modes
 *  - "select"        : default, click selects a section in the inspector
 *  - "place"         : click on a section to drop a NEW 3D placement
 *  - "add-keyframe"  : click on the section to add a new motion keyframe
 *                      at the current scrub progress
 *  - "move-keyframe" : click on the section to move the selected keyframe's
 *                      XY to the click position (preserves t)
 */
type PlacementMode = "select" | "place" | "add-keyframe" | "move-keyframe";

/** Insert a keyframe into a placement, keeping the list sorted by t. */
function addKeyframe(
  placement: ThreeDPlacement,
  frame: { t: number; x: number; y: number }
): ThreeDPlacement {
  const prev = placement.motion?.keyframes ?? [];
  // If we already have a keyframe at the exact same t (within 0.01),
  // replace it instead of stacking — keeps the timeline clean.
  const filtered = prev.filter((k) => Math.abs(k.t - frame.t) > 0.005);
  const next: PlacementKeyframe = {
    t: clamp01(frame.t),
    x: frame.x,
    y: frame.y,
    z: 0,
    scale: 1,
    rotation: 0,
    easing: "power2.inOut",
  };
  const merged = [...filtered, next].sort((a, b) => a.t - b.t);
  return { ...placement, motion: { keyframes: merged } };
}

function updateKeyframe(
  placement: ThreeDPlacement,
  index: number,
  patch: Partial<PlacementKeyframe>
): ThreeDPlacement {
  const motion = placement.motion;
  if (!motion) return placement;
  const next = motion.keyframes.map((k, i) =>
    i === index ? { ...k, ...patch } : k
  );
  return { ...placement, motion: { keyframes: next } };
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export default function StudioPage() {
  const [spec, setSpec] = useState<SiteSpec>(EMPTY_SITE_SPEC);
  const [hydrated, setHydrated] = useState(false);
  const [rects, setRects] = useState<SectionRect[]>([]);
  const [scrollY, setScrollY] = useState(0);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const [selectedModel, setSelectedModel] = useState<string>("sphere");
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [placementMode, setPlacementMode] = useState<PlacementMode>("select");
  /**
   * Scrub progress 0..1 for the currently selected section. When non-null
   * it overrides real scroll on the iframe so the author can preview
   * motion at a specific point in the section's scroll range.
   */
  const [scrubProgress, setScrubProgress] = useState<number | null>(null);
  /** Selected keyframe index within the current placement's motion. */
  const [selectedKeyframeIndex, setSelectedKeyframeIndex] = useState<number | null>(null);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const previewReady = useRef(false);
  const placementModeRef = useRef<PlacementMode>("select");
  const selectedModelRef = useRef<string>("sphere");
  const selectedSectionIdRef = useRef<string | null>(null);
  const selectedKeyframeIndexRef = useRef<number | null>(null);
  const scrubProgressRef = useRef<number | null>(null);

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
    selectedSectionIdRef.current = selectedSectionId;
  }, [selectedSectionId]);
  useEffect(() => {
    selectedKeyframeIndexRef.current = selectedKeyframeIndex;
  }, [selectedKeyframeIndex]);
  useEffect(() => {
    scrubProgressRef.current = scrubProgress;
  }, [scrubProgress]);

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
        const mode = placementModeRef.current;

        if (mode === "select") {
          setSelectedSectionId(data.sectionId);
          return;
        }

        if (mode === "place") {
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

        // Keyframe authoring modes only act on the *selected* section
        // — ignore clicks on other sections so the author can't
        // accidentally move a keyframe to a different page section.
        if (data.sectionId !== selectedSectionIdRef.current) return;

        if (mode === "add-keyframe") {
          const t = scrubProgressRef.current ?? 0.5;
          setSpec((prev) => ({
            ...prev,
            sections: prev.sections.map((s) =>
              s.id === data.sectionId && s.threeD
                ? {
                    ...s,
                    threeD: addKeyframe(s.threeD, {
                      t,
                      x: data.localX,
                      y: data.localY,
                    }),
                  }
                : s
            ),
          }));
          setPlacementMode("select");
          return;
        }

        if (mode === "move-keyframe") {
          const idx = selectedKeyframeIndexRef.current;
          if (idx === null) return;
          setSpec((prev) => ({
            ...prev,
            sections: prev.sections.map((s) =>
              s.id === data.sectionId && s.threeD?.motion
                ? {
                    ...s,
                    threeD: updateKeyframe(s.threeD, idx, {
                      x: data.localX,
                      y: data.localY,
                    }),
                  }
                : s
            ),
          }));
          setPlacementMode("select");
          return;
        }
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

  const setKeyframes = useCallback(
    (id: string, frames: PlacementKeyframe[]) => {
      updateSection(id, (s) => {
        if (!s.threeD) return s;
        const next: ThreeDPlacement = { ...s.threeD };
        if (frames.length === 0) {
          delete (next as { motion?: PlacementMotion }).motion;
        } else {
          next.motion = { keyframes: frames };
        }
        return { ...s, threeD: next };
      });
    },
    [updateSection]
  );

  const selectedSection = useMemo(
    () => spec.sections.find((s) => s.id === selectedSectionId) ?? null,
    [spec.sections, selectedSectionId]
  );

  // ─── Scrub channel ────────────────────────────────────────────────
  // When the author drags the scrub slider, push a forced-progress
  // override to the iframe so the placement animates in place.
  // Clearing the override (scrubProgress=null) restores real scroll.
  useEffect(() => {
    if (!previewReady.current) return;
    const id = selectedSectionId;
    if (!id) return;
    iframeRef.current?.contentWindow?.postMessage(
      {
        kind: "blaze:set-forced-progress",
        sectionId: id,
        progress: scrubProgress,
      },
      "*"
    );
  }, [scrubProgress, selectedSectionId]);

  // Switching the selected section clears any prior scrub override so
  // the previous section's placement resumes real-scroll behaviour.
  useEffect(() => {
    setScrubProgress(null);
    setSelectedKeyframeIndex(null);
  }, [selectedSectionId]);

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
              selectedKeyframeIndex={selectedKeyframeIndex}
              mode={placementMode}
            />
          </div>
          {selectedSection?.threeD ? (
            <ScrubBar
              progress={scrubProgress}
              onChange={setScrubProgress}
              motion={selectedSection.threeD.motion}
              selectedKeyframeIndex={selectedKeyframeIndex}
              onSelectKeyframe={setSelectedKeyframeIndex}
            />
          ) : null}
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
              mode={placementMode}
              setMode={setPlacementMode}
              scrubProgress={scrubProgress}
              selectedKeyframeIndex={selectedKeyframeIndex}
              setSelectedKeyframeIndex={setSelectedKeyframeIndex}
              onUpdate={(patch) => updatePlacement(selectedSection.id, patch)}
              onUpdateAnchor={(a) => updatePlacementAnchor(selectedSection.id, a)}
              onSetKeyframes={(frames) =>
                setKeyframes(selectedSection.id, frames)
              }
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

function ModePill({ mode }: { mode: PlacementMode }) {
  const isAction = mode !== "select";
  const label =
    mode === "add-keyframe"
      ? "add keyframe"
      : mode === "move-keyframe"
      ? "move keyframe"
      : `${mode} mode`;
  return (
    <span
      className={[
        "hidden items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-widest sm:inline-flex",
        isAction
          ? "border-blaze-accent/40 bg-blaze-accent/10 text-blaze-accent"
          : "border-blaze-line bg-blaze-surface text-blaze-muted",
      ].join(" ")}
    >
      <span
        className={
          isAction
            ? "h-1.5 w-1.5 rounded-full bg-blaze-accent"
            : "h-1.5 w-1.5 rounded-full bg-blaze-muted"
        }
      />
      {label}
    </span>
  );
}

function PlacementInspector({
  section,
  mode,
  setMode,
  scrubProgress,
  selectedKeyframeIndex,
  setSelectedKeyframeIndex,
  onUpdate,
  onUpdateAnchor,
  onSetKeyframes,
  onRemove,
}: {
  section: SectionInvocation;
  mode: PlacementMode;
  setMode: (m: PlacementMode) => void;
  scrubProgress: number | null;
  selectedKeyframeIndex: number | null;
  setSelectedKeyframeIndex: (i: number | null) => void;
  onUpdate: (patch: Partial<ThreeDPlacement>) => void;
  onUpdateAnchor: (a: { x: number; y: number; z: number }) => void;
  onSetKeyframes: (frames: PlacementKeyframe[]) => void;
  onRemove: () => void;
}) {
  const p = section.threeD;
  const frames = p?.motion?.keyframes ?? [];
  return (
    <section className="scrollbar-thin flex max-h-[55%] flex-col gap-0 overflow-y-auto border-t border-blaze-line bg-blaze-surface2/50">
      <div className="px-3 pt-3">
        <h2 className="text-[10px] font-medium uppercase tracking-widest text-blaze-mutedDim">
          Placement · <span className="text-blaze-text">{section.id}</span>
        </h2>
      </div>
      {!p ? (
        <p className="px-3 pb-3 pt-2 text-xs text-blaze-muted">
          No 3D layer on this section yet. Switch to{" "}
          <strong className="text-blaze-text">place</strong> mode and click on
          the section in the preview to drop one.
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-2 px-3 pb-3 pt-2 text-xs">
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
          </div>

          <div className="border-t border-blaze-line bg-blaze-bg/30 px-3 py-3">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-[10px] font-medium uppercase tracking-widest text-blaze-mutedDim">
                Motion ({frames.length})
              </h3>
              <button
                type="button"
                onClick={() => setMode(mode === "add-keyframe" ? "select" : "add-keyframe")}
                className={[
                  "rounded-md border px-2 py-1 text-[10px] uppercase tracking-widest transition-colors",
                  mode === "add-keyframe"
                    ? "border-blaze-accent/60 bg-blaze-accent/10 text-blaze-accent"
                    : "border-blaze-line bg-transparent text-blaze-muted hover:border-blaze-line2 hover:text-blaze-text",
                ].join(" ")}
              >
                {mode === "add-keyframe" ? "cancel" : "+ add"}
              </button>
            </div>
            {mode === "add-keyframe" ? (
              <p className="mb-2 rounded-md border border-blaze-accent/40 bg-blaze-accent/10 px-2 py-1.5 text-[10px] leading-snug text-blaze-accent">
                Click on the section in the preview to drop a keyframe at
                t={(scrubProgress ?? 0.5).toFixed(2)}.
              </p>
            ) : null}
            {frames.length === 0 ? (
              <p className="rounded-md border border-dashed border-blaze-line px-2 py-3 text-center text-[11px] text-blaze-muted">
                No keyframes yet. The model stays at <code>anchor</code> while
                this section scrolls.
              </p>
            ) : (
              <ul className="flex flex-col gap-1">
                {frames.map((k, i) => (
                  <KeyframeRow
                    key={i}
                    index={i}
                    keyframe={k}
                    selected={selectedKeyframeIndex === i}
                    moving={mode === "move-keyframe" && selectedKeyframeIndex === i}
                    onSelect={() =>
                      setSelectedKeyframeIndex(
                        selectedKeyframeIndex === i ? null : i
                      )
                    }
                    onChange={(patch) => {
                      const next = frames.map((f, j) =>
                        j === i ? { ...f, ...patch } : f
                      );
                      onSetKeyframes(next);
                    }}
                    onMove={() => {
                      setSelectedKeyframeIndex(i);
                      setMode(mode === "move-keyframe" && selectedKeyframeIndex === i ? "select" : "move-keyframe");
                    }}
                    onRemove={() => {
                      const next = frames.filter((_, j) => j !== i);
                      onSetKeyframes(next);
                      if (selectedKeyframeIndex === i) {
                        setSelectedKeyframeIndex(null);
                      }
                    }}
                  />
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-blaze-line bg-blaze-surface2/40 px-3 py-3">
            <button
              type="button"
              onClick={onRemove}
              className="w-full rounded-md border border-red-500/40 bg-red-500/10 px-2 py-1 text-xs text-red-300 hover:bg-red-500/20"
            >
              remove 3D layer
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function KeyframeRow({
  index,
  keyframe,
  selected,
  moving,
  onSelect,
  onChange,
  onMove,
  onRemove,
}: {
  index: number;
  keyframe: PlacementKeyframe;
  selected: boolean;
  moving: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<PlacementKeyframe>) => void;
  onMove: () => void;
  onRemove: () => void;
}) {
  return (
    <li
      className={[
        "rounded-md border px-2 py-1.5",
        selected
          ? "border-blaze-accent/60 bg-blaze-accent/10"
          : "border-blaze-line bg-blaze-bg/30 hover:border-blaze-line2",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex w-full items-center justify-between text-left text-[11px] font-mono"
      >
        <span className="text-blaze-text">
          #{index} · t={keyframe.t.toFixed(2)}
        </span>
        <span className="text-blaze-mutedDim">
          ({Math.round(keyframe.x)}, {Math.round(keyframe.y)})
        </span>
      </button>
      {selected ? (
        <div className="mt-2 flex flex-col gap-1.5 text-[10px]">
          <label className="flex items-center gap-1">
            <span className="w-12 text-blaze-muted">t</span>
            <input
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={keyframe.t}
              onChange={(e) =>
                onChange({
                  t: clamp01(Number(e.target.value) || 0),
                })
              }
              className="w-full rounded-md border border-blaze-line bg-blaze-bg px-1.5 py-1 text-right font-mono text-[10px]"
            />
          </label>
          {(["x", "y"] as const).map((axis) => (
            <label key={axis} className="flex items-center gap-1">
              <span className="w-12 text-blaze-muted">{axis}</span>
              <input
                type="number"
                step={1}
                value={Math.round(keyframe[axis])}
                onChange={(e) =>
                  onChange({ [axis]: Number(e.target.value) || 0 })
                }
                className="w-full rounded-md border border-blaze-line bg-blaze-bg px-1.5 py-1 text-right font-mono text-[10px]"
              />
            </label>
          ))}
          <label className="flex items-center gap-1">
            <span className="w-12 text-blaze-muted">scale</span>
            <input
              type="number"
              min={0.05}
              max={20}
              step={0.05}
              value={keyframe.scale ?? 1}
              onChange={(e) =>
                onChange({ scale: Number(e.target.value) || 1 })
              }
              className="w-full rounded-md border border-blaze-line bg-blaze-bg px-1.5 py-1 text-right font-mono text-[10px]"
            />
          </label>
          <label className="flex items-center gap-1">
            <span className="w-12 text-blaze-muted">rot</span>
            <input
              type="number"
              step={0.05}
              value={Number((keyframe.rotation ?? 0).toFixed(2))}
              onChange={(e) =>
                onChange({ rotation: Number(e.target.value) || 0 })
              }
              className="w-full rounded-md border border-blaze-line bg-blaze-bg px-1.5 py-1 text-right font-mono text-[10px]"
            />
          </label>
          <label className="flex items-center gap-1">
            <span className="w-12 text-blaze-muted">ease</span>
            <select
              value={keyframe.easing ?? "power2.inOut"}
              onChange={(e) =>
                onChange({ easing: e.target.value as PlacementKeyframe["easing"] })
              }
              className="w-full rounded-md border border-blaze-line bg-blaze-bg px-1.5 py-1 text-right font-mono text-[10px]"
            >
              {EASING_LABELS.map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <div className="mt-1 flex gap-1">
            <button
              type="button"
              onClick={onMove}
              className={[
                "flex-1 rounded-md border px-2 py-1 text-[10px] uppercase tracking-widest transition-colors",
                moving
                  ? "border-blaze-accent/60 bg-blaze-accent/10 text-blaze-accent"
                  : "border-blaze-line bg-transparent text-blaze-muted hover:border-blaze-line2 hover:text-blaze-text",
              ].join(" ")}
            >
              {moving ? "click preview…" : "move on canvas"}
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="rounded-md border border-red-500/40 bg-red-500/10 px-2 py-1 text-[10px] text-red-300 hover:bg-red-500/20"
              title="Delete keyframe"
            >
              ×
            </button>
          </div>
        </div>
      ) : null}
    </li>
  );
}

/**
 * Bottom-of-preview slider that drives `forcedProgress` on the
 * selected section's placement. The labelled tick marks correspond
 * to the keyframes' `t` values so the author can click straight onto
 * the moment they want to inspect.
 */
function ScrubBar({
  progress,
  onChange,
  motion,
  selectedKeyframeIndex,
  onSelectKeyframe,
}: {
  progress: number | null;
  onChange: (p: number | null) => void;
  motion: PlacementMotion | undefined;
  selectedKeyframeIndex: number | null;
  onSelectKeyframe: (i: number | null) => void;
}) {
  const frames = motion?.keyframes ?? [];
  const value = progress ?? 0;
  return (
    <div className="relative flex shrink-0 items-center gap-2 border-t border-blaze-line bg-blaze-bg px-3 py-2">
      <span className="font-mono text-[10px] uppercase tracking-widest text-blaze-mutedDim">
        scrub
      </span>
      <div className="relative flex-1">
        <input
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-1 w-full cursor-pointer appearance-none rounded-full bg-blaze-line2 accent-blaze-accent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blaze-accent"
        />
        {frames.map((k, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              onChange(k.t);
              onSelectKeyframe(i);
            }}
            title={`keyframe #${i} · t=${k.t.toFixed(2)}`}
            className={[
              "absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border transition-colors",
              selectedKeyframeIndex === i
                ? "h-3.5 w-3.5 border-blaze-accent bg-blaze-accent"
                : "h-2.5 w-2.5 border-blaze-accent/70 bg-blaze-accent/30 hover:bg-blaze-accent/60",
            ].join(" ")}
            style={{ left: `${k.t * 100}%` }}
          />
        ))}
      </div>
      <span className="w-10 text-right font-mono text-[10px] text-blaze-text">
        {value.toFixed(2)}
      </span>
      <button
        type="button"
        onClick={() => onChange(null)}
        disabled={progress === null}
        title="Resume real scroll"
        className="rounded-md border border-blaze-line bg-blaze-surface px-2 py-1 text-[10px] uppercase tracking-widest text-blaze-muted transition-colors hover:border-blaze-line2 hover:text-blaze-text disabled:cursor-not-allowed disabled:opacity-40"
      >
        clear
      </button>
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
  selectedKeyframeIndex,
  mode,
}: {
  rects: SectionRect[];
  scrollY: number;
  spec: SiteSpec;
  selectedSectionId: string | null;
  selectedKeyframeIndex: number | null;
  mode: PlacementMode;
}) {
  const sectionsById = useMemo(
    () => Object.fromEntries(spec.sections.map((s) => [s.id, s])),
    [spec.sections]
  );
  const cursor =
    mode === "place" || mode === "add-keyframe" || mode === "move-keyframe"
      ? "crosshair"
      : "default";

  return (
    <div
      className="pointer-events-none absolute inset-0"
      data-overlay
      data-mode={mode}
      style={{ cursor }}
    >
      {rects.map((r) => {
        const section = sectionsById[r.id];
        if (!section) return null;
        const isSelected = selectedSectionId === r.id;
        const screenTop = r.top - scrollY;
        const screenLeft = 0;
        const frames = section.threeD?.motion?.keyframes ?? [];
        const showPath = isSelected && frames.length >= 2;
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
                  mode === "place" ||
                  (isSelected && (mode === "add-keyframe" || mode === "move-keyframe"))
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
                {frames.length > 0 ? ` · ${frames.length}kf` : ""}
              </span>
            </div>

            {/* Motion path polyline, drawn only on the selected section. */}
            {showPath ? (
              <MotionPath
                frames={frames}
                screenTop={screenTop}
                screenLeft={screenLeft}
                width={r.width}
                height={r.height}
              />
            ) : null}

            {/* Static anchor marker (shown when no motion is authored OR
                while the layer is being placed). */}
            {section.threeD?.anchor && frames.length === 0 ? (
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

            {/* Keyframe markers, numbered so the order is obvious. */}
            {isSelected
              ? frames.map((k, i) => (
                  <KeyframeMarker
                    key={i}
                    index={i}
                    top={screenTop + k.y}
                    left={screenLeft + k.x}
                    selected={selectedKeyframeIndex === i}
                  />
                ))
              : null}
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

function KeyframeMarker({
  index,
  top,
  left,
  selected,
}: {
  index: number;
  top: number;
  left: number;
  selected: boolean;
}) {
  const size = selected ? 18 : 14;
  return (
    <div
      className="absolute z-20"
      style={{ top: top - size / 2, left: left - size / 2, pointerEvents: "none" }}
    >
      <div
        className={[
          "rounded-full border shadow-[0_0_12px_rgba(255,90,31,0.5)]",
          selected
            ? "border-blaze-accent bg-blaze-accent"
            : "border-blaze-accent/80 bg-blaze-accent/30",
        ].join(" ")}
        style={{ height: size, width: size }}
      />
      <span
        className={[
          "absolute -right-2 top-1/2 -translate-y-1/2 translate-x-full whitespace-nowrap rounded px-1 py-0.5 font-mono",
          selected ? "bg-blaze-accent text-black" : "bg-black/80 text-blaze-accent",
        ].join(" ")}
        style={{ fontSize: 9, lineHeight: 1 }}
      >
        #{index}
      </span>
    </div>
  );
}

/**
 * Draw the polyline through a placement's keyframes on top of its
 * section. Coords are section-local pixels; we offset by the
 * section's on-screen top-left to land them in the right place.
 */
function MotionPath({
  frames,
  screenTop,
  screenLeft,
  width,
  height,
}: {
  frames: PlacementKeyframe[];
  screenTop: number;
  screenLeft: number;
  width: number;
  height: number;
}) {
  const sorted = [...frames].sort((a, b) => a.t - b.t);
  const points = sorted.map((k) => `${k.x},${k.y}`).join(" ");
  return (
    <svg
      className="absolute"
      style={{
        top: screenTop,
        left: screenLeft,
        width,
        height,
        pointerEvents: "none",
      }}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        fill="none"
        stroke="rgba(255,90,31,0.7)"
        strokeWidth={2}
        strokeDasharray="6 4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
