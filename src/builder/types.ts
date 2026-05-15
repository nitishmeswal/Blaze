/**
 * Blaze Builder — site spec types.
 *
 * The builder LLM emits a `SiteSpec` (JSON). A deterministic compiler turns
 * that spec into real `.tsx` pages OR a runtime renderer renders it
 * directly inside the preview iframe.
 *
 * Goals:
 *   - Narrow vocabulary: every section the LLM can choose is a real
 *     component in the kit registry. The LLM can't hallucinate components.
 *   - Real coordinates: 3D placements live alongside the section that
 *     hosts them, so position is anchored to the rendered layout (not an
 *     abstract canvas).
 *   - Iterable: each spec change is a single JSON patch the iframe can
 *     swap in without a full reload.
 */
import type { CoordinateMap } from "@/planner/types";

/** Stable version stamp so we can evolve the schema without breaking old saves. */
export const SITE_SPEC_VERSION = 1 as const;

/**
 * A single section invocation: which kit component to mount, and the
 * props to pass it. Props are intentionally `unknown` here — the
 * compiler / runtime validates them against the component's known prop
 * shape from the kit registry.
 */
export interface SectionInvocation {
  /** Stable id, used for diffing / keyed rendering. */
  id: string;
  /** Must match an entry in `kitRegistry`. */
  componentId: string;
  /** Props passed straight to the component. */
  props: Record<string, unknown>;
  /**
   * Optional 3D layer that lives on top of this section. The model is
   * positioned in the section's local coordinate space at runtime.
   */
  threeD?: ThreeDPlacement;
}

/**
 * A 3D model layered onto a section. Motion is authored in the studio
 * as a list of keyframes mapped to the section's scroll progress
 * (0..1 as the section travels through the viewport). Position is
 * anchored to the section so the author can move the section without
 * re-authoring the motion.
 */
export interface ThreeDPlacement {
  /** Which model to mount — either a kit primitive or a glTF URL. */
  model:
    | { kind: "kit"; componentId: string; props?: Record<string, unknown> }
    | { kind: "gltf"; url: string };
  /**
   * Heavyweight whole-page motion (the original /planner output).
   * Kept for backward-compat / the standalone planner; new authoring
   * goes through the lighter-weight `motion` field below.
   */
  coordinateMap?: CoordinateMap;
  /**
   * Section-local scroll-driven motion authored in /studio. When
   * present and the section has at least two keyframes, the runtime
   * interpolates position / scale / rotation against the section's
   * scroll progress (0 at entry, 1 at exit) and falls back to
   * `anchor` outside the keyframe range.
   */
  motion?: PlacementMotion;
  /**
   * Default static anchor in the section's local CSS coords (px from
   * top-left). Used when there's no `motion`, or before the first
   * keyframe / after the last keyframe.
   */
  anchor?: { x: number; y: number; z: number };
}

/**
 * Section-local scroll-driven motion: an ordered list of keyframes
 * indexed by `t` (0..1) where 0 is "section top hits viewport bottom"
 * and 1 is "section bottom hits viewport top". The runtime clamps
 * inputs into this range so motion never overshoots.
 */
export interface PlacementMotion {
  /** Ordered keyframes (sorted by `t` ascending at render time). */
  keyframes: PlacementKeyframe[];
}

/**
 * One stop on a placement's motion path.
 *
 * Coords are in **section-pixel space** (the same space as
 * `ThreeDPlacement.anchor`) so the orthographic camera in
 * `<ThreeDLayer>` can map them 1:1 onto the rendered page.
 */
export interface PlacementKeyframe {
  /** Section scroll progress 0..1. */
  t: number;
  /** Section-local pixel X. */
  x: number;
  /** Section-local pixel Y. */
  y: number;
  /** Optional depth offset (z-order in ortho space; default 0). */
  z?: number;
  /** Scale multiplier (default 1). */
  scale?: number;
  /** Rotation in radians around the screen-Z axis (default 0). */
  rotation?: number;
  /**
   * Easing used when interpolating *to* this keyframe from the
   * previous one. Defaults to "power2.inOut" — a tasteful generic.
   */
  easing?: PlacementEasing;
}

/** A small curated subset of easing curves we ship with the runtime. */
export type PlacementEasing =
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
  | "expo.in"
  | "expo.out"
  | "expo.inOut"
  | "sine.in"
  | "sine.out"
  | "sine.inOut";

/**
 * Site-level metadata. Drives <head> tags, the layout shell, and
 * deploy-time settings.
 */
export interface SiteMeta {
  title: string;
  description?: string;
  /** Hex or CSS color. Used for theme-color and the bg if no hero exists. */
  themeColor?: string;
  /** OG image URL (absolute or relative to /public). */
  ogImage?: string;
  /** Optional favicon path. */
  favicon?: string;
}

/**
 * Top-level site spec. This is what the LLM emits / patches and what
 * the renderer consumes.
 */
export interface SiteSpec {
  version: typeof SITE_SPEC_VERSION;
  meta: SiteMeta;
  sections: SectionInvocation[];
  /** Free-form notes the LLM can leave for itself between turns. */
  notes?: string;
}

/**
 * Chat protocol. Stored client-side; the LLM sees the rolling
 * conversation plus the current SiteSpec.
 */
export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  /** Markdown content shown in the chat UI. */
  content: string;
  /** ISO timestamp. */
  createdAt: string;
  /**
   * Optional structured payload — when the assistant emits a spec
   * patch, we keep the JSON here so it can be replayed / inspected
   * separately from the human-readable explanation.
   */
  specPatch?: SiteSpec;
}

/** Wire format for the `/api/generate` endpoint. */
export interface GenerateRequest {
  /** Full chat history so far (incl. the latest user turn). */
  messages: ChatMessage[];
  /** Current spec, if any. First turn passes null / an empty spec. */
  currentSpec: SiteSpec | null;
}

export interface GenerateResponse {
  /** Assistant chat message to append to history. */
  message: ChatMessage;
  /** New spec to render (may equal currentSpec if no structural change). */
  spec: SiteSpec;
}

/**
 * The LLM is constrained to output one of these "actions" in its JSON
 * response. Keeping the surface tight makes diffing predictable.
 */
export type AssistantAction =
  | { kind: "reply"; text: string }
  | { kind: "set_spec"; spec: SiteSpec; explanation: string }
  | { kind: "patch_sections"; sections: SectionInvocation[]; explanation: string };
