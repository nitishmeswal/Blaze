"use client";

/**
 * Zustand store powering the Coordinate Planner.
 *
 * The store is the single source of truth for the coordinate map being
 * authored, the current viewport, the active tool, and the current
 * selection. Every panel (toolbar, layers, inspector, canvas) reads from
 * — and writes to — this store.
 */
import { create } from "zustand";
import { EMPTY_MAP, PATH_COLORS, DEFAULT_MODEL_DEFAULTS } from "./defaults";
import type {
  CoordinateMap,
  Marker,
  Path,
  PlannerTool,
  SelectableId,
  Section,
  Viewport,
  Waypoint,
} from "./types";

function id(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now()
    .toString(36)
    .slice(-4)}`;
}

export type PlannerState = {
  map: CoordinateMap;
  currentViewportId: string;
  tool: PlannerTool;
  /** Path currently being drawn (when tool === "path"). null when idle. */
  draftPathId: string | null;
  selection: SelectableId | null;

  // ── actions ────────────────────────────────────────────────────────
  setTool(tool: PlannerTool): void;
  setViewport(viewportId: string): void;
  select(s: SelectableId | null): void;
  rename(name: string): void;
  setNotes(notes: string): void;

  addViewport(v: Omit<Viewport, "id"> & { id?: string }): string;
  updateViewport(id: string, patch: Partial<Viewport>): void;
  deleteViewport(id: string): void;

  addSection(s?: Partial<Section>): string;
  updateSection(id: string, patch: Partial<Section>): void;
  deleteSection(id: string): void;

  addMarker(at: { canvas: Marker["canvas"]; scrollProgress: number }): string;
  updateMarker(id: string, patch: Partial<Marker>): void;
  deleteMarker(id: string): void;

  startPath(): string;
  addWaypoint(
    pathId: string,
    at: { canvas: Waypoint["canvas"]; scrollProgress: number }
  ): string;
  updateWaypoint(
    pathId: string,
    waypointId: string,
    patch: Partial<Waypoint>
  ): void;
  deleteWaypoint(pathId: string, waypointId: string): void;
  updatePath(id: string, patch: Partial<Path>): void;
  deletePath(id: string): void;
  finishPath(): void;

  loadMap(map: CoordinateMap): void;
  reset(): void;
};

export const usePlannerStore = create<PlannerState>((set, get) => ({
  map: EMPTY_MAP,
  currentViewportId: "desktop",
  tool: "select",
  draftPathId: null,
  selection: null,

  setTool(tool) {
    set({ tool });
    if (tool !== "path") {
      set({ draftPathId: null });
    }
  },
  setViewport(viewportId) {
    set({ currentViewportId: viewportId, selection: null, draftPathId: null });
  },
  select(selection) {
    set({ selection });
  },
  rename(name) {
    set((s) => ({ map: { ...s.map, name } }));
  },
  setNotes(notes) {
    set((s) => ({ map: { ...s.map, notes } }));
  },

  addViewport(v) {
    const newId = v.id ?? id("vp");
    set((s) => ({
      map: { ...s.map, viewports: [...s.map.viewports, { ...v, id: newId }] },
      currentViewportId: newId,
    }));
    return newId;
  },
  updateViewport(viewportId, patch) {
    set((s) => ({
      map: {
        ...s.map,
        viewports: s.map.viewports.map((v) =>
          v.id === viewportId ? { ...v, ...patch } : v
        ),
      },
    }));
  },
  deleteViewport(viewportId) {
    set((s) => {
      if (s.map.viewports.length <= 1) return s;
      const next = s.map.viewports.filter((v) => v.id !== viewportId);
      return {
        map: {
          ...s.map,
          viewports: next,
          sections: s.map.sections.filter((x) => x.viewportId !== viewportId),
          paths: s.map.paths.filter((x) => x.viewportId !== viewportId),
          markers: s.map.markers.filter((x) => x.viewportId !== viewportId),
        },
        currentViewportId:
          s.currentViewportId === viewportId ? next[0].id : s.currentViewportId,
      };
    });
  },

  addSection(s = {}) {
    const vpId = get().currentViewportId;
    const newId = id("sec");
    set((state) => ({
      map: {
        ...state.map,
        sections: [
          ...state.map.sections,
          {
            id: newId,
            name: s.name ?? `Section ${state.map.sections.length + 1}`,
            height: s.height ?? 900,
            viewportId: vpId,
            className: s.className,
          },
        ],
      },
    }));
    return newId;
  },
  updateSection(sid, patch) {
    set((s) => ({
      map: {
        ...s.map,
        sections: s.map.sections.map((x) => (x.id === sid ? { ...x, ...patch } : x)),
      },
    }));
  },
  deleteSection(sid) {
    set((s) => ({
      map: { ...s.map, sections: s.map.sections.filter((x) => x.id !== sid) },
      selection:
        s.selection?.kind === "section" && s.selection.id === sid
          ? null
          : s.selection,
    }));
  },

  addMarker({ canvas, scrollProgress }) {
    const vpId = get().currentViewportId;
    const newId = id("mk");
    set((s) => ({
      map: {
        ...s.map,
        markers: [
          ...s.map.markers,
          {
            id: newId,
            name: `Marker ${s.map.markers.length + 1}`,
            scrollProgress,
            canvas,
            viewportId: vpId,
          },
        ],
      },
      selection: { kind: "marker", id: newId },
    }));
    return newId;
  },
  updateMarker(mid, patch) {
    set((s) => ({
      map: {
        ...s.map,
        markers: s.map.markers.map((x) => (x.id === mid ? { ...x, ...patch } : x)),
      },
    }));
  },
  deleteMarker(mid) {
    set((s) => ({
      map: { ...s.map, markers: s.map.markers.filter((x) => x.id !== mid) },
      selection:
        s.selection?.kind === "marker" && s.selection.id === mid
          ? null
          : s.selection,
    }));
  },

  startPath() {
    const vpId = get().currentViewportId;
    const newId = id("path");
    const color =
      PATH_COLORS[get().map.paths.length % PATH_COLORS.length];
    set((s) => ({
      map: {
        ...s.map,
        paths: [
          ...s.map.paths,
          {
            id: newId,
            name: `Path ${s.map.paths.length + 1}`,
            kind: "line",
            color,
            viewportId: vpId,
            waypoints: [],
          },
        ],
      },
      draftPathId: newId,
      selection: { kind: "path", id: newId },
    }));
    return newId;
  },
  addWaypoint(pathId, { canvas, scrollProgress }) {
    const newId = id("wp");
    set((s) => {
      const defs = s.map.modelDefaults;
      return {
        map: {
          ...s.map,
          paths: s.map.paths.map((p) =>
            p.id === pathId
              ? {
                  ...p,
                  waypoints: [
                    ...p.waypoints,
                    {
                      id: newId,
                      scrollProgress,
                      canvas,
                      depth: defs.depth,
                      scale: defs.scale,
                      rotation: { x: 0, y: 0, z: 0 },
                      opacity: defs.opacity,
                      easing: defs.easing,
                    },
                  ].sort((a, b) => a.scrollProgress - b.scrollProgress),
                }
              : p
          ),
        },
        selection: { kind: "waypoint", pathId, id: newId },
      };
    });
    return newId;
  },
  updateWaypoint(pathId, wid, patch) {
    set((s) => ({
      map: {
        ...s.map,
        paths: s.map.paths.map((p) =>
          p.id !== pathId
            ? p
            : {
                ...p,
                waypoints: p.waypoints
                  .map((w) => (w.id === wid ? { ...w, ...patch } : w))
                  .sort((a, b) => a.scrollProgress - b.scrollProgress),
              }
        ),
      },
    }));
  },
  deleteWaypoint(pathId, wid) {
    set((s) => ({
      map: {
        ...s.map,
        paths: s.map.paths.map((p) =>
          p.id !== pathId
            ? p
            : { ...p, waypoints: p.waypoints.filter((w) => w.id !== wid) }
        ),
      },
      selection:
        s.selection?.kind === "waypoint" && s.selection.id === wid
          ? { kind: "path", id: pathId }
          : s.selection,
    }));
  },
  updatePath(pid, patch) {
    set((s) => ({
      map: {
        ...s.map,
        paths: s.map.paths.map((p) => (p.id === pid ? { ...p, ...patch } : p)),
      },
    }));
  },
  deletePath(pid) {
    set((s) => ({
      map: { ...s.map, paths: s.map.paths.filter((x) => x.id !== pid) },
      draftPathId: s.draftPathId === pid ? null : s.draftPathId,
      selection:
        s.selection?.kind === "path" && s.selection.id === pid
          ? null
          : s.selection?.kind === "waypoint" && s.selection.pathId === pid
            ? null
            : s.selection,
    }));
  },
  finishPath() {
    set({ draftPathId: null, tool: "select" });
  },

  loadMap(map) {
    const merged: CoordinateMap = {
      ...map,
      modelDefaults: map.modelDefaults ?? DEFAULT_MODEL_DEFAULTS,
    };
    set({
      map: merged,
      currentViewportId: merged.viewports[0]?.id ?? "desktop",
      selection: null,
      draftPathId: null,
      tool: "select",
    });
  },
  reset() {
    set({
      map: EMPTY_MAP,
      currentViewportId: "desktop",
      tool: "select",
      draftPathId: null,
      selection: null,
    });
  },
}));
