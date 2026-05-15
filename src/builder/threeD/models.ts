/**
 * 3D model registry for the studio's drag-drop overlay.
 *
 * Phase 3 ships a small palette of primitives the user can place on
 * any section. Each entry is one of:
 *   - "kit"  → references a component from `src/kit/3d/` (no internal
 *              <Canvas> — must be mountable inside a parent R3FCanvas).
 *   - "primitive" → a tiny inline R3F mesh defined here. Useful as a
 *              placeholder before the user uploads an asset.
 *   - "gltf" → loads a glTF / GLB from a URL via the kit's GltfModel.
 *
 * The studio's inspector reads this registry to populate the model
 * picker, and SiteRenderer's ThreeDLayer resolves a placement's
 * `model.componentId` to a real React element.
 */
import type { ThreeDPlacement } from "@/builder/types";

export interface ModelOption {
  /** Stable id, used in ThreeDPlacement.model.componentId. */
  id: string;
  /** Display label shown in the picker. */
  label: string;
  /** One-line description. */
  description: string;
  /** Category drives the section grouping in the picker. */
  category: "primitive" | "kit" | "external";
  /** Defaults to suggest when the user adds a fresh placement. */
  defaultProps?: Record<string, unknown>;
  /** Suggested anchor for first drop (overridden by the click coords). */
  suggestedAnchor?: { x: number; y: number; z: number };
}

export const MODEL_OPTIONS: ModelOption[] = [
  {
    id: "sphere",
    label: "Glowing sphere",
    description: "Soft-lit sphere, good as a generic anchor.",
    category: "primitive",
    defaultProps: { color: "#ff5a1f", scale: 1 },
  },
  {
    id: "cube",
    label: "Floating cube",
    description: "Wireframe cube with gentle bobbing motion.",
    category: "primitive",
    defaultProps: { color: "#fafafa", scale: 1 },
  },
  {
    id: "torus",
    label: "Spinning torus",
    description: "Slowly rotating torus knot.",
    category: "primitive",
    defaultProps: { color: "#d4b266", scale: 1 },
  },
  {
    id: "Bubbles",
    label: "Bubble field",
    description: "Instanced rising bubbles (kit primitive).",
    category: "kit",
    defaultProps: { count: 200, speed: 4, bubbleSize: 0.05, opacity: 0.6 },
  },
  {
    id: "gltf",
    label: "Custom glTF / GLB",
    description: "Load a 3D asset from a URL.",
    category: "external",
    defaultProps: { url: "" },
  },
];

export function findModelOption(id: string): ModelOption | undefined {
  return MODEL_OPTIONS.find((m) => m.id === id);
}

/**
 * Default placement when the user first drops a marker. Anchor is
 * filled in by the click handler; this only sets the model + sensible
 * starting props.
 */
export function makeDefaultPlacement(
  modelId: string,
  anchor: { x: number; y: number; z: number }
): ThreeDPlacement {
  const opt = findModelOption(modelId);
  if (modelId === "gltf") {
    return {
      model: { kind: "gltf", url: (opt?.defaultProps?.url as string) ?? "" },
      anchor,
    };
  }
  return {
    model: {
      kind: "kit",
      componentId: modelId,
      props: { ...(opt?.defaultProps ?? {}) },
    },
    anchor,
  };
}
