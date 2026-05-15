"use client";

/**
 * ThreeDLayer — mounts a 3D model on top of a section, anchored to
 * the section's local CSS coordinate space with **pixel-exact**
 * placement.
 *
 * How the coordinate system works (Phase 3.1)
 * -------------------------------------------
 * The Canvas fills the section via `absolute inset-0`. Inside the
 * canvas we drive a fixed **orthographic camera** so that one Three
 * world unit equals one CSS pixel:
 *
 *   left:   0
 *   right:  sectionWidth        // section.clientWidth in CSS px
 *   top:    0
 *   bottom: -sectionHeight      // section.clientHeight in CSS px (negative
 *                                // because Three's Y axis goes UP and the
 *                                // DOM's Y axis goes DOWN)
 *   near:  -1000 / far: +1000
 *
 * Then a placement at section-pixel anchor (Ax, Ay) renders at
 * world position (Ax, -Ay, anchor.z). Clicking at pixel (Ax, Ay)
 * on the iframe sets exactly those numbers in the spec, so the
 * mesh lands EXACTLY where the author clicked — no more "near but
 * not on" drift.
 *
 * Why ortho and not perspective?
 *   - Perspective requires a depth (z) plane to do a 2D → 3D
 *     unproject, which is ambiguous for our authoring workflow
 *     (the author thinks in 2D screen pixels, not in world depth).
 *   - Ortho gives a perfect 1:1 pixel mapping that survives window
 *     resizes and section reflows.
 *
 * Mesh sizing
 *   Primitives are sized in **pixel units** with `scale` defaulting
 *   to 1.0 (= a ~160px-diameter mesh). The inspector still lets you
 *   tweak scale via the placement props. anchor.z controls draw
 *   order and the orbit radius for floating motion.
 *
 * The Canvas has `pointer-events: none` so DOM content and the
 * studio overlay catch clicks before the canvas does.
 */
import {
  useRef,
  useEffect,
  type ReactNode,
} from "react";
import { Canvas as R3FCanvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { ThreeDPlacement } from "@/builder/types";
import { Bubbles } from "@/kit/3d/Bubbles";
import { GltfModel } from "@/kit/3d/GltfModel";

export interface ThreeDLayerProps {
  placement: ThreeDPlacement;
}

/**
 * Outer wrapper: lays a full-bleed canvas over the parent section.
 * The parent (a SiteRenderer section) is positioned `relative`, so
 * `absolute inset-0` covers it exactly. We also expose
 * `data-3d-layer` so the studio overlay can ignore these wrappers
 * when reading section rects.
 */
export function ThreeDLayer({ placement }: ThreeDLayerProps) {
  return (
    <div
      data-3d-layer
      className="pointer-events-none absolute inset-0 z-10"
      aria-hidden="true"
    >
      <R3FCanvas
        // No explicit camera prop — we install our own ortho camera
        // inside the canvas via <PixelOrthoCamera /> so its bounds
        // can react to live size changes from R3F's viewport.
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        // Transparent so the section's DOM content shows through.
        style={{ background: "transparent" }}
      >
        <PixelOrthoCamera />
        <ambientLight intensity={0.75} />
        <directionalLight position={[120, 200, 300]} intensity={1.1} />
        <PlacementGroup placement={placement} />
      </R3FCanvas>
    </div>
  );
}

/**
 * Install an orthographic camera whose viewport bounds equal the
 * canvas's CSS pixel size, so 1 world unit == 1 CSS pixel and the
 * world's (0, 0) sits at the section's **top-left**.
 *
 * R3F's `size` (from useThree) gives the canvas size in CSS pixels.
 * On every size change we rebuild the camera's frustum and re-set it
 * as the default camera. The Y axis is flipped (top=0, bottom=-h) so
 * that DOM-style coords (Y grows downward) translate to Three coords
 * by simple negation of the Y value.
 */
function PixelOrthoCamera() {
  const set = useThree((s) => s.set);
  const size = useThree((s) => s.size);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);

  if (!cameraRef.current) {
    cameraRef.current = new THREE.OrthographicCamera(
      0,
      Math.max(1, size.width),
      0,
      -Math.max(1, size.height),
      -1000,
      1000
    );
    cameraRef.current.position.set(0, 0, 500);
    cameraRef.current.lookAt(0, 0, 0);
  }

  useEffect(() => {
    const cam = cameraRef.current;
    if (!cam) return;
    cam.left = 0;
    cam.right = Math.max(1, size.width);
    cam.top = 0;
    cam.bottom = -Math.max(1, size.height);
    cam.updateProjectionMatrix();
    set({ camera: cam });
  }, [set, size.width, size.height]);

  return null;
}

/**
 * Position the placement group at the placement's section-pixel
 * anchor. Because the camera is ortho with top-left origin, the only
 * transformation needed is a sign flip on Y.
 */
function PlacementGroup({ placement }: { placement: ThreeDPlacement }) {
  const anchor = placement.anchor ?? { x: 0, y: 0, z: 0 };
  return (
    <group position={[anchor.x, -anchor.y, anchor.z]}>
      {renderPlacement(placement)}
    </group>
  );
}

function renderPlacement(p: ThreeDPlacement): ReactNode {
  if (p.model.kind === "gltf") {
    if (!p.model.url) {
      return <PrimitiveSphere color="#444" />;
    }
    // glTF models are authored in their own scale; we apply a sane
    // default to bring them into "section-pixel space". Authors who
    // need a different size can wrap their glb in a transform.
    return (
      <group scale={120}>
        <GltfModel url={p.model.url} />
      </group>
    );
  }
  const props = p.model.props ?? {};
  switch (p.model.componentId) {
    case "sphere":
      return <PrimitiveSphere {...(props as PrimitiveColorProps)} />;
    case "cube":
      return <PrimitiveCube {...(props as PrimitiveColorProps)} />;
    case "torus":
      return <PrimitiveTorus {...(props as PrimitiveColorProps)} />;
    case "Bubbles":
      return (
        <group scale={80}>
          <Bubbles {...(props as Record<string, never>)} />
        </group>
      );
    default:
      return <PrimitiveSphere color="#888" />;
  }
}

interface PrimitiveColorProps {
  color?: string;
  scale?: number;
}

// Default primitive radius (in CSS pixels). 80px radius → 160px diameter
// which reads as a clear "marker" without dominating most sections.
const PX_R = 80;

function PrimitiveSphere({ color = "#ff5a1f", scale = 1 }: PrimitiveColorProps) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation.y += dt * 0.3;
  });
  return (
    <mesh ref={ref} scale={scale}>
      <sphereGeometry args={[PX_R, 48, 48]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.35}
        roughness={0.35}
        metalness={0.1}
      />
    </mesh>
  );
}

function PrimitiveCube({ color = "#fafafa", scale = 1 }: PrimitiveColorProps) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state, dt) => {
    if (!ref.current) return;
    ref.current.rotation.x += dt * 0.4;
    ref.current.rotation.y += dt * 0.5;
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 12;
  });
  return (
    <mesh ref={ref} scale={scale}>
      <boxGeometry args={[PX_R * 1.6, PX_R * 1.6, PX_R * 1.6]} />
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
      <torusKnotGeometry args={[PX_R * 0.85, PX_R * 0.25, 100, 16]} />
      <meshStandardMaterial color={color} metalness={0.6} roughness={0.25} />
    </mesh>
  );
}

