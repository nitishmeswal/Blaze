/**
 * CoordinateMap — the portable JSON spec the planner produces and the
 * runtime consumes.
 *
 * Mental model
 * ────────────
 * - The page is divided into a vertical sequence of `Section`s. Each
 *   section has a height in CSS pixels (per viewport).
 * - A `Path` is an ordered list of `Waypoint`s the 3D model travels
 *   through across the entire scroll range. Each waypoint pins the model
 *   to a (x, y, z) position at a specific `scrollProgress` (0..1 over
 *   the page).
 * - A `Marker` is a stand-alone event that fires at a specific
 *   scrollProgress, optionally with an action ("trigger split-text",
 *   "fade body color", etc.). Markers are independent of paths.
 * - Each path / marker / section belongs to **one viewport**. The planner
 *   lets you author per-breakpoint maps (mobile / tablet / desktop / custom).
 *   The runtime picks the closest matching viewport at play time.
 */

export type Vec2 = { x: number; y: number };
export type Vec3 = { x: number; y: number; z: number };
export type Euler = { x: number; y: number; z: number };

export type Easing =
  | "linear"
  | "power1.in"
  | "power1.out"
  | "power1.inOut"
  | "power2.in"
  | "power2.out"
  | "power2.inOut"
  | "power3.in"
  | "power3.out"
  | "power3.inOut"
  | "power4.in"
  | "power4.out"
  | "power4.inOut"
  | "back.in"
  | "back.out"
  | "back.inOut"
  | "expo.in"
  | "expo.out"
  | "expo.inOut"
  | "sine.in"
  | "sine.out"
  | "sine.inOut";

export type PathKind = "line" | "bezier";

export type Viewport = {
  /** Stable id (e.g. "mobile", "tablet", "desktop", "custom-1"). */
  id: string;
  /** Display label shown in the planner toolbar. */
  name: string;
  /** CSS-pixel width of the canvas frame. */
  width: number;
  /** CSS-pixel height of the canvas frame (per "page"). Use sections to break a tall page up. */
  height: number;
  /** Optional CSS media-query string used by the runtime to choose this viewport. */
  mediaQuery?: string;
};

export type Section = {
  id: string;
  /** Human-readable label ("Hero", "Features", "Footer", …). */
  name: string;
  /** Height of this section in CSS px. */
  height: number;
  /** Viewport this section belongs to. */
  viewportId: string;
  /** Optional CSS-class hook the runtime can pin / scrub against. */
  className?: string;
};

export type Waypoint = {
  id: string;
  /** Scroll progress 0..1 across the entire page where this waypoint pins. */
  scrollProgress: number;
  /** 2D anchor on the canvas (in CSS px, top-left origin). */
  canvas: Vec2;
  /** 3D depth (forward / back). */
  depth: number;
  /** Uniform scale. */
  scale: number;
  /** Rotation in radians (x, y, z). */
  rotation: Euler;
  /** Opacity 0..1. */
  opacity: number;
  /** Easing to use when interpolating *to* this waypoint from the previous. */
  easing: Easing;
};

export type Path = {
  id: string;
  /** Display label ("Hero → Features", "Logo arc", …). */
  name: string;
  /** "line" connects waypoints with straight segments; "bezier" smooths them. */
  kind: PathKind;
  /** Hex color used to draw the path in the planner. */
  color: string;
  /** Viewport the path is authored against. */
  viewportId: string;
  /** Ordered list of waypoints. The runtime sorts by `scrollProgress`. */
  waypoints: Waypoint[];
  /** Optional component id from the kit registry the path is bound to. */
  componentId?: string;
};

export type MarkerAction =
  | { kind: "splitTextReveal"; target: string }
  | { kind: "bodyColor"; from: string; to: string }
  | { kind: "pin"; target: string }
  | { kind: "fade"; target: string; from: number; to: number }
  | { kind: "custom"; payload: unknown };

export type Marker = {
  id: string;
  name: string;
  scrollProgress: number;
  canvas: Vec2;
  viewportId: string;
  action?: MarkerAction;
};

export type ModelDefaults = {
  /** Default scale used between waypoints when none specified. */
  scale: number;
  /** Default depth (Z) when none specified. */
  depth: number;
  /** Default opacity. */
  opacity: number;
  /** Default easing. */
  easing: Easing;
};

export type CoordinateMap = {
  version: 1;
  /** Free-form name the author types in the planner. */
  name: string;
  /** Free-form notes; ignored at runtime. */
  notes?: string;
  /** All viewport definitions. */
  viewports: Viewport[];
  /** Sections per viewport (id collisions are scoped by viewport). */
  sections: Section[];
  /** Paths per viewport. */
  paths: Path[];
  /** Markers per viewport. */
  markers: Marker[];
  /** Default 3D model attributes. */
  modelDefaults: ModelDefaults;
};

export type SelectableId =
  | { kind: "marker"; id: string }
  | { kind: "path"; id: string }
  | { kind: "waypoint"; pathId: string; id: string }
  | { kind: "section"; id: string }
  | { kind: "viewport"; id: string };

export type PlannerTool =
  | "select"
  | "marker"
  | "path"
  | "section";
