"use client";

/**
 * Helpers to consume a CoordinateMap at runtime.
 *
 * The compiled map maps a planner waypoint's 2D canvas position to
 * 3D world-space (x, y, z). The default mapping centres the canvas at
 * world origin and uses pixels-per-world-unit as a configurable knob.
 */
import type {
  CoordinateMap,
  Path,
  Viewport,
  Waypoint,
} from "@/planner/types";

export type WorldVec3 = { x: number; y: number; z: number };

export type CompiledWaypoint = {
  scrollProgress: number;
  position: WorldVec3;
  scale: number;
  rotation: WorldVec3;
  opacity: number;
  easing: Waypoint["easing"];
};

export type CompiledPath = {
  id: string;
  name: string;
  color: string;
  componentId?: string;
  waypoints: CompiledWaypoint[];
};

export type CompileOptions = {
  /** How many CSS pixels equal one world unit. Defaults to 100. */
  pixelsPerUnit?: number;
  /** Centre the canvas around world (0,0,0). Defaults to true. */
  centerOrigin?: boolean;
};

export function pickViewport(
  map: CoordinateMap,
  width: number
): Viewport {
  // Prefer a viewport whose `mediaQuery` currently matches; otherwise pick the
  // viewport whose `width` is closest to (but not greater than) the given
  // measurement, falling back to the widest one.
  const matching = map.viewports.find((v) => {
    if (!v.mediaQuery || typeof window === "undefined") return false;
    return window.matchMedia(v.mediaQuery).matches;
  });
  if (matching) return matching;
  const sorted = [...map.viewports].sort((a, b) => a.width - b.width);
  const closest = sorted.find((v) => v.width >= width) ?? sorted[sorted.length - 1];
  return closest ?? map.viewports[0];
}

export function compilePath(
  path: Path,
  viewport: Viewport,
  options: CompileOptions = {}
): CompiledPath {
  const { pixelsPerUnit = 100, centerOrigin = true } = options;
  const cx = centerOrigin ? viewport.width / 2 : 0;
  const cy = centerOrigin ? viewport.height / 2 : 0;
  const waypoints = [...path.waypoints]
    .sort((a, b) => a.scrollProgress - b.scrollProgress)
    .map<CompiledWaypoint>((w) => ({
      scrollProgress: w.scrollProgress,
      position: {
        x: (w.canvas.x - cx) / pixelsPerUnit,
        // Invert Y so positive Y in 3D goes "up" while canvas Y is top-down.
        y: -(w.canvas.y - cy) / pixelsPerUnit,
        z: w.depth,
      },
      scale: w.scale,
      rotation: { x: w.rotation.x, y: w.rotation.y, z: w.rotation.z },
      opacity: w.opacity,
      easing: w.easing,
    }));
  return {
    id: path.id,
    name: path.name,
    color: path.color,
    componentId: path.componentId,
    waypoints,
  };
}

export function totalPageHeight(map: CoordinateMap, viewportId: string) {
  const sections = map.sections.filter((s) => s.viewportId === viewportId);
  return sections.reduce((acc, s) => acc + s.height, 0);
}

export function interpolateAtProgress(
  path: CompiledPath,
  progress: number
): CompiledWaypoint | null {
  const wps = path.waypoints;
  if (wps.length === 0) return null;
  if (progress <= wps[0].scrollProgress) return wps[0];
  if (progress >= wps[wps.length - 1].scrollProgress) return wps[wps.length - 1];
  for (let i = 0; i < wps.length - 1; i++) {
    const a = wps[i];
    const b = wps[i + 1];
    if (progress >= a.scrollProgress && progress <= b.scrollProgress) {
      const span = b.scrollProgress - a.scrollProgress || 1;
      const t = (progress - a.scrollProgress) / span;
      const e = applyEase(t, b.easing);
      return {
        scrollProgress: progress,
        position: lerp3(a.position, b.position, e),
        scale: lerp(a.scale, b.scale, e),
        rotation: lerp3(a.rotation, b.rotation, e),
        opacity: lerp(a.opacity, b.opacity, e),
        easing: b.easing,
      };
    }
  }
  return wps[wps.length - 1];
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function lerp3(a: WorldVec3, b: WorldVec3, t: number): WorldVec3 {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), z: lerp(a.z, b.z, t) };
}

// Reduced ease library that mirrors the subset of GSAP eases we expose in the
// planner. Implemented as plain functions so the runtime works even when
// gsap isn't loaded (e.g. in non-React renderers).
function applyEase(t: number, ease: Waypoint["easing"]): number {
  switch (ease) {
    case "linear":
      return t;
    case "power1.in":
      return t * t;
    case "power1.out":
      return 1 - (1 - t) * (1 - t);
    case "power1.inOut":
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    case "power2.in":
      return t ** 3;
    case "power2.out":
      return 1 - Math.pow(1 - t, 3);
    case "power2.inOut":
      return t < 0.5 ? 4 * t ** 3 : 1 - Math.pow(-2 * t + 2, 3) / 2;
    case "power3.in":
      return t ** 4;
    case "power3.out":
      return 1 - Math.pow(1 - t, 4);
    case "power3.inOut":
      return t < 0.5 ? 8 * t ** 4 : 1 - Math.pow(-2 * t + 2, 4) / 2;
    case "power4.in":
      return t ** 5;
    case "power4.out":
      return 1 - Math.pow(1 - t, 5);
    case "power4.inOut":
      return t < 0.5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2;
    case "back.in": {
      const c1 = 1.70158;
      return (c1 + 1) * t * t * t - c1 * t * t;
    }
    case "back.out": {
      const c1 = 1.70158;
      const f = t - 1;
      return 1 + (c1 + 1) * f * f * f + c1 * f * f;
    }
    case "back.inOut": {
      const c2 = 1.70158 * 1.525;
      return t < 0.5
        ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
        : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
    }
    case "expo.in":
      return t === 0 ? 0 : Math.pow(2, 10 * t - 10);
    case "expo.out":
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    case "expo.inOut":
      if (t === 0) return 0;
      if (t === 1) return 1;
      return t < 0.5
        ? Math.pow(2, 20 * t - 10) / 2
        : (2 - Math.pow(2, -20 * t + 10)) / 2;
    case "sine.in":
      return 1 - Math.cos((t * Math.PI) / 2);
    case "sine.out":
      return Math.sin((t * Math.PI) / 2);
    case "sine.inOut":
      return -(Math.cos(Math.PI * t) - 1) / 2;
    default:
      return t;
  }
}
