/**
 * Curated easing palette used across the kit.
 * GSAP-compatible strings. Keep this in sync with planner/schema.ts.
 */
export const EASINGS = [
  "none",
  "power1.in",
  "power1.out",
  "power1.inOut",
  "power2.in",
  "power2.out",
  "power2.inOut",
  "power3.in",
  "power3.out",
  "power3.inOut",
  "power4.in",
  "power4.out",
  "power4.inOut",
  "expo.in",
  "expo.out",
  "expo.inOut",
  "circ.in",
  "circ.out",
  "circ.inOut",
  "sine.in",
  "sine.out",
  "sine.inOut",
  "back.in(1.7)",
  "back.out(1.7)",
  "back.out(3)",
  "back.inOut(1.7)",
  "elastic.out(1,0.3)",
  "elastic.inOut(1,0.3)",
  "bounce.out",
  "bounce.inOut",
] as const;

export type Easing = (typeof EASINGS)[number] | string;
