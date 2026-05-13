"use client";

/**
 * FloatingModel
 * Generalised from Fizzi-3D-Website/src/components/FloatingCan.tsx.
 *
 * Wrap any 3D mesh in drei's <Float> to gently bob it in place. Use this
 * everywhere you'd otherwise just slap a static mesh into a scene.
 */
import { forwardRef, type ReactNode } from "react";
import { Float } from "@react-three/drei";
import type { Group } from "three";

export type FloatingModelProps = {
  floatSpeed?: number;
  rotationIntensity?: number;
  floatIntensity?: number;
  floatingRange?: [number, number];
  children: ReactNode;
};

export const FloatingModel = forwardRef<Group, FloatingModelProps>(
  function FloatingModel(
    {
      floatSpeed = 1.5,
      rotationIntensity = 1,
      floatIntensity = 1,
      floatingRange = [-0.1, 0.1],
      children,
      ...props
    },
    ref
  ) {
    return (
      <group ref={ref} {...props}>
        <Float
          speed={floatSpeed}
          rotationIntensity={rotationIntensity}
          floatIntensity={floatIntensity}
          floatingRange={floatingRange}
        >
          {children}
        </Float>
      </group>
    );
  }
);
