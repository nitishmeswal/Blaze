"use client";

import { Canvas } from "@react-three/fiber";
import { Preload, View } from "@react-three/drei";
import { Suspense, type ReactNode } from "react";

/**
 * Global persistent <Canvas> with @react-three/drei `View` tunneling.
 * Pattern from Fizzi-3D-Website/src/components/ViewCanvas.tsx.
 *
 * Mount once near the root; render <View /> regions inside ordinary DOM.
 */
export function ViewCanvas({ children }: { children?: ReactNode }) {
  return (
    <Canvas
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 30,
      }}
      shadows
      dpr={[1, 1.5]}
      gl={{ antialias: true }}
      camera={{ fov: 30 }}
    >
      <Suspense fallback={null}>
        <View.Port />
        {children}
        <Preload all />
      </Suspense>
    </Canvas>
  );
}
