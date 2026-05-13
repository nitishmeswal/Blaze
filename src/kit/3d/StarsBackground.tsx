"use client";

/**
 * Full-bleed rotating star field rendered into an R3F canvas.
 * Generalised from SpacePortfolio's StarBackground.
 *
 * Renders a sphere of `count` random points and slowly rotates the group
 * on the X & Y axes. Drop anywhere as a fixed background.
 */
import { useMemo, useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

export type StarsBackgroundProps = {
  /** Number of star points. */
  count?: number;
  /** Radius of the sphere the stars sample from (in world units). */
  radius?: number;
  /** Point size. */
  size?: number;
  /** Star color. */
  color?: string;
  /** X-axis rotation speed (radians/sec). */
  rotationX?: number;
  /** Y-axis rotation speed (radians/sec). */
  rotationY?: number;
  className?: string;
};

function inSphere(arr: Float32Array, radius: number) {
  for (let i = 0; i < arr.length; i += 3) {
    let x: number, y: number, z: number, d2: number;
    do {
      x = Math.random() * 2 - 1;
      y = Math.random() * 2 - 1;
      z = Math.random() * 2 - 1;
      d2 = x * x + y * y + z * z;
    } while (d2 > 1 || d2 === 0);
    arr[i] = x * radius;
    arr[i + 1] = y * radius;
    arr[i + 2] = z * radius;
  }
  return arr;
}

function StarField({
  count,
  radius,
  size,
  color,
  rotationX,
  rotationY,
}: Required<
  Pick<
    StarsBackgroundProps,
    "count" | "radius" | "size" | "color" | "rotationX" | "rotationY"
  >
>) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(
    () => inSphere(new Float32Array(count * 3), radius),
    [count, radius]
  );

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.x -= delta * rotationX;
    ref.current.rotation.y -= delta * rotationY;
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={positions} stride={3} frustumCulled>
        <PointMaterial
          transparent
          color={color}
          size={size}
          sizeAttenuation
          depthWrite={false}
        />
      </Points>
    </group>
  );
}

export function StarsBackground({
  count = 5000,
  radius = 1.2,
  size = 0.002,
  color = "#ffffff",
  rotationX = 0.1,
  rotationY = 0.0667,
  className = "fixed inset-0 z-[20] w-full h-auto",
}: StarsBackgroundProps) {
  return (
    <div className={className}>
      <Canvas camera={{ position: [0, 0, 1] }}>
        <Suspense fallback={null}>
          <StarField
            count={count}
            radius={radius}
            size={size}
            color={color}
            rotationX={rotationX}
            rotationY={rotationY}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
