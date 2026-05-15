"use client";

/**
 * ThreeDLayer — mounts a 3D model on top of a section, anchored to
 * the section's local CSS coordinate space.
 *
 * Phase 3 wires the simplest possible runtime: the model sits at the
 * placement's `anchor` (x, y in section px, z forward/back) and
 * gently animates per the model option. Phase 3-followup wires the
 * full CoordinateMapPlayer when `placement.coordinateMap` is present
 * so the model travels along an authored scroll path.
 *
 * The Canvas is absolutely-positioned over the section with
 * `pointer-events: none` so it never steals clicks from the DOM
 * content underneath. The studio's overlay catches placement clicks
 * BEFORE they reach this layer.
 */
import { useRef, useState, useEffect, type ReactNode } from "react";
import { Canvas as R3FCanvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { ThreeDPlacement } from "@/builder/types";
import { Bubbles } from "@/kit/3d/Bubbles";
import { GltfModel } from "@/kit/3d/GltfModel";

export interface ThreeDLayerProps {
  placement: ThreeDPlacement;
  /** Section size; the Canvas matches this. */
  sectionWidth?: number;
  sectionHeight?: number;
}

export function ThreeDLayer({ placement }: ThreeDLayerProps) {
  // The section is positioned `relative` in SiteRenderer so absolute
  // positioning here lays the canvas exactly on top.
  return (
    <div
      data-3d-layer
      className="pointer-events-none absolute inset-0 z-10"
      aria-hidden="true"
    >
      <R3FCanvas camera={{ position: [0, 0, 5], fov: 50 }} dpr={[1, 2]}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 4, 5]} intensity={1.2} />
        <PlacementModel placement={placement} />
      </R3FCanvas>
    </div>
  );
}

/**
 * Resolve a ThreeDPlacement to an R3F element. New primitives can be
 * added by extending the `componentId` switch; entries here MUST
 * match ids declared in `src/builder/threeD/models.ts`.
 */
function PlacementModel({ placement }: { placement: ThreeDPlacement }) {
  const groupRef = useRef<THREE.Group>(null);
  const anchor = placement.anchor ?? { x: 0, y: 0, z: 0 };

  // Convert the placement's section-pixel anchor into Three units.
  // The Canvas fills the section, so we approximate by mapping the
  // section's CSS width into the Three viewport (~6 units wide at the
  // default camera + fov). The studio inspector lets the author tweak
  // anchor.z explicitly when needed.
  const [unit, setUnit] = useState(1 / 80);
  useEffect(() => {
    function recalc() {
      const el = (groupRef.current?.parent as THREE.Object3D | undefined);
      void el;
      // Heuristic: 1 Three unit ≈ window.innerWidth / 6 px.
      const w = typeof window !== "undefined" ? window.innerWidth : 1024;
      setUnit(6 / w);
    }
    recalc();
    if (typeof window !== "undefined") {
      window.addEventListener("resize", recalc);
      return () => window.removeEventListener("resize", recalc);
    }
  }, []);

  const x = (anchor.x - 0.5 * (typeof window !== "undefined" ? window.innerWidth : 1024)) * unit;
  const y = -(anchor.y - 200) * unit; // 200px offset = "near the top of the section"
  const z = anchor.z;

  return (
    <group ref={groupRef} position={[x, y, z]}>
      {renderPlacement(placement)}
    </group>
  );
}

function renderPlacement(p: ThreeDPlacement): ReactNode {
  if (p.model.kind === "gltf") {
    if (!p.model.url) {
      return <PrimitiveSphere color="#444" />;
    }
    return <GltfModel url={p.model.url} />;
  }
  // Kit primitive.
  const props = p.model.props ?? {};
  switch (p.model.componentId) {
    case "sphere":
      return <PrimitiveSphere {...(props as PrimitiveColorProps)} />;
    case "cube":
      return <PrimitiveCube {...(props as PrimitiveColorProps)} />;
    case "torus":
      return <PrimitiveTorus {...(props as PrimitiveColorProps)} />;
    case "Bubbles":
      return <Bubbles {...(props as Record<string, never>)} />;
    default:
      // Unknown component — render a neutral placeholder so the layout
      // doesn't go blank, and surface the issue visually.
      return <PrimitiveSphere color="#888" />;
  }
}

interface PrimitiveColorProps {
  color?: string;
  scale?: number;
}

function PrimitiveSphere({ color = "#ff5a1f", scale = 1 }: PrimitiveColorProps) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation.y += dt * 0.3;
  });
  return (
    <mesh ref={ref} scale={scale}>
      <sphereGeometry args={[0.7, 32, 32]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} />
    </mesh>
  );
}

function PrimitiveCube({ color = "#fafafa", scale = 1 }: PrimitiveColorProps) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state, dt) => {
    if (!ref.current) return;
    ref.current.rotation.x += dt * 0.4;
    ref.current.rotation.y += dt * 0.5;
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.15;
  });
  return (
    <mesh ref={ref} scale={scale}>
      <boxGeometry args={[1.1, 1.1, 1.1]} />
      <meshStandardMaterial color={color} wireframe />
    </mesh>
  );
}

function PrimitiveTorus({ color = "#d4b266", scale = 1 }: PrimitiveColorProps) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation.x += dt * 0.6;
    ref.current.rotation.y += dt * 0.4;
  });
  return (
    <mesh ref={ref} scale={scale}>
      <torusKnotGeometry args={[0.6, 0.18, 100, 16]} />
      <meshStandardMaterial color={color} metalness={0.6} roughness={0.25} />
    </mesh>
  );
}
