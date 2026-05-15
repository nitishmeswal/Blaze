/**
 * Section-local motion sampler.
 *
 * Given a `PlacementMotion` (list of keyframes) and the section's
 * current scroll progress `t` in [0, 1], returns the interpolated
 * pose (position / scale / rotation) at that progress.
 *
 * Behaviour
 *   - Empty keyframes → caller falls back to `placement.anchor`.
 *   - Single keyframe → returns that frame (no interpolation).
 *   - Two+ keyframes → finds the segment bracketing `t` and lerps
 *     between them using the *next* keyframe's easing curve.
 *   - `t` before the first keyframe → returns the first keyframe.
 *   - `t` after the last keyframe → returns the last keyframe.
 *     (Motion holds at the endpoints instead of snapping back, which
 *     is what you almost always want for a single scroll-through.)
 */
import { ease } from "@/builder/threeD/easing";
import type { PlacementKeyframe, PlacementMotion } from "@/builder/types";

export interface MotionPose {
  x: number;
  y: number;
  z: number;
  scale: number;
  rotation: number;
}

const ZERO: MotionPose = { x: 0, y: 0, z: 0, scale: 1, rotation: 0 };

function frameToPose(k: PlacementKeyframe): MotionPose {
  return {
    x: k.x,
    y: k.y,
    z: k.z ?? 0,
    scale: k.scale ?? 1,
    rotation: k.rotation ?? 0,
  };
}

function lerp(a: number, b: number, u: number): number {
  return a + (b - a) * u;
}

export function sampleMotion(
  motion: PlacementMotion | undefined,
  t: number
): MotionPose | null {
  if (!motion || motion.keyframes.length === 0) return null;
  // Defensive sort: authors might add keyframes in any order.
  const frames = [...motion.keyframes].sort((a, b) => a.t - b.t);
  if (frames.length === 1) return frameToPose(frames[0]);
  if (t <= frames[0].t) return frameToPose(frames[0]);
  if (t >= frames[frames.length - 1].t) {
    return frameToPose(frames[frames.length - 1]);
  }

  // Find the segment [i, i+1] that brackets `t`.
  let i = 0;
  for (; i < frames.length - 1; i++) {
    if (t >= frames[i].t && t <= frames[i + 1].t) break;
  }
  const a = frames[i];
  const b = frames[i + 1];
  const span = b.t - a.t || 1;
  const u = (t - a.t) / span;
  const eased = ease(b.easing ?? "power2.inOut", u);
  const pa = frameToPose(a);
  const pb = frameToPose(b);
  return {
    x: lerp(pa.x, pb.x, eased),
    y: lerp(pa.y, pb.y, eased),
    z: lerp(pa.z, pb.z, eased),
    scale: lerp(pa.scale, pb.scale, eased),
    rotation: lerp(pa.rotation, pb.rotation, eased),
  };
}

/**
 * Compute the section's scroll progress in [0, 1] from its bounding
 * rect and the viewport height. 0 = section top has just touched
 * the viewport bottom; 1 = section bottom has just passed the
 * viewport top.
 *
 * The total travel distance is `viewportHeight + sectionHeight`
 * (the section enters fully and then exits fully), so the progress
 * is `(viewportHeight - sectionTop) / (viewportHeight + sectionHeight)`.
 */
export function sectionScrollProgress(
  sectionTop: number,
  sectionHeight: number,
  viewportHeight: number
): number {
  const total = viewportHeight + sectionHeight;
  if (total <= 0) return 0;
  const traveled = viewportHeight - sectionTop;
  const t = traveled / total;
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

export { ZERO as ZERO_POSE };
