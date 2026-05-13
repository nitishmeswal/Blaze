"use client";

/**
 * CoordinateMapPlayer
 * The runtime counterpart of the Coordinate Planner. Given a
 * CoordinateMap and a function that renders a 3D model into an R3F group,
 * this component:
 *
 * 1. Reserves the right amount of scroll height (total of all section
 *    heights for the active viewport).
 * 2. Mounts a fixed full-screen <Canvas> behind the page content.
 * 3. Drives the model's position / rotation / scale / opacity from
 *    scroll progress by walking the active path's waypoints and
 *    interpolating per the easing the planner author chose.
 *
 * The DOM children passed to the component are stacked vertically in
 * boxes matching the section heights so the page actually has scroll.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Canvas as R3FCanvas } from "@react-three/fiber";
import { gsap, ScrollTrigger } from "@/kit/_utils/gsap-setup";
import type { CoordinateMap } from "@/planner/types";
import {
  compilePath,
  interpolateAtProgress,
  pickViewport,
  totalPageHeight,
  type CompiledPath,
} from "./coordinateMap";
import type { Group } from "three";

export type CoordinateMapPlayerProps = {
  /** The planner-authored map. */
  map: CoordinateMap;
  /** Render-prop returning the 3D content to mount inside the R3F canvas.
   *  Use the supplied `ref` on a <group> so the player can animate it. */
  renderModel: (modelRef: React.MutableRefObject<Group | null>) => ReactNode;
  /** Optional content rendered inside each section box (matches the
   *  number of sections in the active viewport). */
  renderSection?: (index: number, sectionId: string) => ReactNode;
  /** Override pixels-per-unit when mapping canvas coords into 3D space. */
  pixelsPerUnit?: number;
  className?: string;
};

export function CoordinateMapPlayer({
  map,
  renderModel,
  renderSection,
  pixelsPerUnit = 100,
  className,
}: CoordinateMapPlayerProps) {
  const [width, setWidth] = useState<number>(0);
  const modelRef = useRef<Group | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setWidth(window.innerWidth);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const { viewport, sections, compiledPaths, pageHeight } = useMemo(() => {
    const vp = pickViewport(map, width || 1024);
    const secs = map.sections.filter((s) => s.viewportId === vp.id);
    const cps = map.paths
      .filter((p) => p.viewportId === vp.id)
      .map<CompiledPath>((p) => compilePath(p, vp, { pixelsPerUnit }));
    return {
      viewport: vp,
      sections: secs,
      compiledPaths: cps,
      pageHeight: totalPageHeight(map, vp.id),
    };
  }, [map, width, pixelsPerUnit]);

  // Drive the animation off ScrollTrigger.
  useEffect(() => {
    if (!wrapperRef.current) return;
    const trigger = ScrollTrigger.create({
      trigger: wrapperRef.current,
      start: "top top",
      end: "bottom bottom",
      onUpdate(self) {
        const progress = self.progress;
        const group = modelRef.current;
        if (!group) return;
        // For now we play the first compiled path. Future versions may
        // composite multiple paths (e.g. one per axis).
        const path = compiledPaths[0];
        if (!path) return;
        const point = interpolateAtProgress(path, progress);
        if (!point) return;
        group.position.set(point.position.x, point.position.y, point.position.z);
        group.rotation.set(point.rotation.x, point.rotation.y, point.rotation.z);
        group.scale.setScalar(point.scale);
        // opacity: walk the children and set on materials with transparent.
        group.traverse((c) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mat = (c as any).material;
          if (mat && typeof mat.opacity === "number") {
            mat.transparent = true;
            mat.opacity = point.opacity;
          }
        });

        // Apply marker actions in a simple manner.
        for (const m of map.markers.filter(
          (x) => x.viewportId === viewport.id
        )) {
          if (!m.action) continue;
          // Fire once when progress crosses the marker.
          // (Lightweight implementation; the LLM-generated landing-page
          // code is expected to supersede this with proper timelines.)
          if (Math.abs(progress - m.scrollProgress) < 0.005) {
            applyMarkerAction(m.action);
          }
        }
      },
    });
    return () => trigger.kill();
  }, [compiledPaths, map.markers, viewport.id]);

  return (
    <div ref={wrapperRef} className={`relative w-full ${className ?? ""}`}>
      <div className="pointer-events-none fixed inset-0 z-0">
        <R3FCanvas camera={{ position: [0, 0, 8], fov: 45 }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 5, 5]} intensity={1.2} />
          <group ref={(el) => { modelRef.current = el; }}>
            {renderModel(modelRef)}
          </group>
        </R3FCanvas>
      </div>
      <div className="relative z-10" style={{ minHeight: pageHeight }}>
        {sections.map((s, i) => (
          <section
            key={s.id}
            id={s.id}
            className={s.className}
            style={{ minHeight: s.height }}
          >
            {renderSection ? renderSection(i, s.id) : null}
          </section>
        ))}
      </div>
    </div>
  );
}

function applyMarkerAction(action: NonNullable<CoordinateMap["markers"][number]["action"]>) {
  switch (action.kind) {
    case "splitTextReveal": {
      gsap.fromTo(
        action.target,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, stagger: 0.05, ease: "power2.out", duration: 0.6 }
      );
      return;
    }
    case "bodyColor": {
      gsap.to("body", {
        backgroundColor: action.to,
        duration: 0.4,
        overwrite: "auto",
      });
      return;
    }
    case "fade": {
      gsap.to(action.target, {
        opacity: action.to,
        duration: 0.4,
        overwrite: "auto",
      });
      return;
    }
    case "pin":
    case "custom":
    default:
      return;
  }
}
