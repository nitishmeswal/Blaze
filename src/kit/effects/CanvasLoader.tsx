"use client";

/**
 * CanvasLoader
 * Verbatim port of Personal-Portfolio/src/components/Loader.jsx.
 *
 * Drei `<Html>` overlay that displays GLTF loading progress. Drop inside a
 * `<Suspense fallback={<CanvasLoader />}>` boundary.
 */
import { Html, useProgress } from "@react-three/drei";

export function CanvasLoader() {
  const { progress } = useProgress();
  return (
    <Html center className="text-xl font-normal text-center">
      {Math.round(progress)}% Loaded
    </Html>
  );
}
