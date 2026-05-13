"use client";

/**
 * Bubbles
 * Verbatim port of Fizzi-3D-Website/src/slices/Hero/Bubbles.tsx.
 *
 * Instanced spheres that rise upward each frame, used as ambient detail.
 */
import * as THREE from "three";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import gsap from "gsap";

const o = new THREE.Object3D();

export type BubblesProps = {
  count?: number;
  speed?: number;
  bubbleSize?: number;
  opacity?: number;
  repeat?: boolean;
  bodyColorSync?: boolean;
};

export function Bubbles({
  count = 300,
  speed = 5,
  bubbleSize = 0.05,
  opacity = 0.5,
  repeat = true,
  bodyColorSync = true,
}: BubblesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const bubbleSpeed = useRef(new Float32Array(count));
  const minSpeed = speed * 0.001;
  const maxSpeed = speed * 0.005;

  const geometry = useMemo(
    () => new THREE.SphereGeometry(bubbleSize, 16, 16),
    [bubbleSize]
  );
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ transparent: true, opacity }),
    [opacity]
  );

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    for (let i = 0; i < count; i++) {
      o.position.set(
        gsap.utils.random(-4, 4),
        gsap.utils.random(-4, 4),
        gsap.utils.random(-4, 4)
      );
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
      bubbleSpeed.current[i] = gsap.utils.random(minSpeed, maxSpeed);
    }
    mesh.instanceMatrix.needsUpdate = true;
    return () => {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    };
  }, [count, minSpeed, maxSpeed]);

  useFrame(() => {
    if (!meshRef.current) return;
    if (bodyColorSync && typeof document !== "undefined") {
      material.color = new THREE.Color(document.body.style.backgroundColor || "#fff");
    }
    for (let i = 0; i < count; i++) {
      meshRef.current.getMatrixAt(i, o.matrix);
      o.position.setFromMatrixPosition(o.matrix);
      o.position.y += bubbleSpeed.current[i];
      if (o.position.y > 4 && repeat) {
        o.position.y = -2;
        o.position.x = gsap.utils.random(-4, 4);
        o.position.z = gsap.utils.random(0, 8);
      }
      o.updateMatrix();
      meshRef.current.setMatrixAt(i, o.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, count]}
      position={[0, 0, 0]}
      material={material}
      geometry={geometry}
    />
  );
}
