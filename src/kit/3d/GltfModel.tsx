"use client";

/**
 * GltfModel
 * Generalised from Fizzi-3D-Website/src/components/SodaCan.tsx.
 *
 * Loads a GLTF by URL via drei's `useGLTF` and renders it as a primitive.
 * Pass a custom material via the `material` prop or supply per-mesh-name
 * material overrides via `materialOverrides`.
 */
import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import type { Material } from "three";
import type { Object3D } from "three";
import { SkeletonUtils } from "three-stdlib";

export type GltfModelProps = {
  url: string;
  scale?: number | [number, number, number];
  position?: [number, number, number];
  rotation?: [number, number, number];
  material?: Material;
};

export function GltfModel({
  url,
  scale = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  material,
}: GltfModelProps) {
  const { scene } = useGLTF(url);
  // Clone the drei-cached scene so per-instance material overrides do not
  // leak back into the shared singleton.
  const cloned = useMemo<Object3D>(
    () => SkeletonUtils.clone(scene),
    [scene]
  );
  const sceneWithMaterial = useMemo(() => {
    if (material) {
      cloned.traverse((child) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((child as any).isMesh) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (child as any).material = material;
        }
      });
    }
    return cloned;
  }, [cloned, material]);
  return (
    <primitive
      object={sceneWithMaterial}
      scale={scale}
      position={position}
      rotation={rotation}
    />
  );
}
