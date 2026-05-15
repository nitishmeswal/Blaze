/**
 * Tiny easing library used by the placement-motion runtime.
 *
 * GSAP defines an extensive easing vocabulary; we ship a curated
 * subset that's enough for cinematic scroll choreography without
 * pulling GSAP into every iframe. Each function takes a normalized
 * input `u` in [0, 1] and returns a normalized output in [0, 1]
 * (well-behaved easings stay within this range; a few overshoot
 * intentionally — none of the ones we ship here do).
 */
import type { PlacementEasing } from "@/builder/types";

type EaseFn = (u: number) => number;

const linear: EaseFn = (u) => u;

const power1In: EaseFn = (u) => u * u;
const power1Out: EaseFn = (u) => 1 - (1 - u) * (1 - u);
const power1InOut: EaseFn = (u) =>
  u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;

const power2In: EaseFn = (u) => u * u * u;
const power2Out: EaseFn = (u) => 1 - Math.pow(1 - u, 3);
const power2InOut: EaseFn = (u) =>
  u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;

const power3In: EaseFn = (u) => u * u * u * u;
const power3Out: EaseFn = (u) => 1 - Math.pow(1 - u, 4);
const power3InOut: EaseFn = (u) =>
  u < 0.5 ? 8 * u * u * u * u : 1 - Math.pow(-2 * u + 2, 4) / 2;

// expo.* is a doubling curve: bigger acceleration than the powers.
const expoIn: EaseFn = (u) => (u === 0 ? 0 : Math.pow(2, 10 * u - 10));
const expoOut: EaseFn = (u) => (u === 1 ? 1 : 1 - Math.pow(2, -10 * u));
const expoInOut: EaseFn = (u) => {
  if (u === 0) return 0;
  if (u === 1) return 1;
  return u < 0.5
    ? Math.pow(2, 20 * u - 10) / 2
    : (2 - Math.pow(2, -20 * u + 10)) / 2;
};

// Sine eases are gentle; great for breathy floats.
const sineIn: EaseFn = (u) => 1 - Math.cos((u * Math.PI) / 2);
const sineOut: EaseFn = (u) => Math.sin((u * Math.PI) / 2);
const sineInOut: EaseFn = (u) => -(Math.cos(Math.PI * u) - 1) / 2;

const TABLE: Record<PlacementEasing, EaseFn> = {
  linear,
  "power1.in": power1In,
  "power1.out": power1Out,
  "power1.inOut": power1InOut,
  "power2.in": power2In,
  "power2.out": power2Out,
  "power2.inOut": power2InOut,
  "power3.in": power3In,
  "power3.out": power3Out,
  "power3.inOut": power3InOut,
  "expo.in": expoIn,
  "expo.out": expoOut,
  "expo.inOut": expoInOut,
  "sine.in": sineIn,
  "sine.out": sineOut,
  "sine.inOut": sineInOut,
};

/**
 * Resolve an easing label to a `(u) => v` function. Unknown labels
 * fall back to `linear` — the most predictable failure mode.
 */
export function ease(name: PlacementEasing | undefined, u: number): number {
  const fn = name ? TABLE[name] : undefined;
  return (fn ?? linear)(clamp01(u));
}

export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export const EASING_LABELS: PlacementEasing[] = Object.keys(
  TABLE
) as PlacementEasing[];
