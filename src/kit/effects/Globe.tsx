"use client";

/**
 * Globe
 * Generalised from Personal-Portfolio/src/components/Globe.jsx.
 *
 * Cobe-based interactive globe with motion-based inertia rotation.
 * Requires `cobe` to be installed (add it lazily — this module only imports
 * via dynamic require so consumers who don't render Globe don't pay).
 */
import { useMotionValue, useSpring } from "framer-motion";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

const MOVEMENT_DAMPING = 1400;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GlobeConfig = Record<string, any>;

export const DEFAULT_GLOBE_CONFIG: GlobeConfig = {
  width: 800,
  height: 800,
  onRender: () => {},
  devicePixelRatio: 2,
  phi: 0,
  theta: 0.3,
  dark: 1,
  diffuse: 0.4,
  mapSamples: 16000,
  mapBrightness: 1.2,
  baseColor: [1, 1, 1],
  markerColor: [1, 1, 1],
  glowColor: [1, 1, 1],
  markers: [
    { location: [14.5995, 120.9842], size: 0.03 },
    { location: [19.076, 72.8777], size: 0.1 },
    { location: [23.8103, 90.4125], size: 0.05 },
    { location: [30.0444, 31.2357], size: 0.07 },
    { location: [39.9042, 116.4074], size: 0.08 },
    { location: [-23.5505, -46.6333], size: 0.1 },
    { location: [19.4326, -99.1332], size: 0.1 },
    { location: [40.7128, -74.006], size: 0.1 },
    { location: [34.6937, 135.5022], size: 0.05 },
    { location: [41.0082, 28.9784], size: 0.06 },
  ],
};

export type GlobeProps = { className?: string; config?: GlobeConfig };

export function Globe({ className, config = DEFAULT_GLOBE_CONFIG }: GlobeProps) {
  const phiRef = useRef(0);
  const widthRef = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<number | null>(null);
  const pointerInteractionMovement = useRef(0);

  const r = useMotionValue(0);
  const rs = useSpring(r, { mass: 1, damping: 30, stiffness: 100 });

  const updatePointerInteraction = (value: number | null) => {
    pointerInteracting.current = value;
    if (canvasRef.current) {
      canvasRef.current.style.cursor = value !== null ? "grabbing" : "grab";
    }
  };

  const updateMovement = (clientX: number) => {
    if (pointerInteracting.current !== null) {
      const delta = clientX - pointerInteracting.current;
      pointerInteractionMovement.current = delta;
      r.set(r.get() + delta / MOVEMENT_DAMPING);
    }
  };

  useEffect(() => {
    let cleanup = () => {};
    const onResize = () => {
      if (canvasRef.current) widthRef.current = canvasRef.current.offsetWidth;
    };
    onResize();
    window.addEventListener("resize", onResize);

    // Lazy-load cobe so dependents without the package still compile.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let globe: { destroy(): void } | null = null;
    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mod: any = await import("cobe" as string).catch(() => null);
        if (!mod || !canvasRef.current) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const createGlobe: any = mod.default ?? mod;
        globe = createGlobe(canvasRef.current, {
          ...config,
          width: widthRef.current * 2,
          height: widthRef.current * 2,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onRender: (state: any) => {
            if (!pointerInteracting.current) phiRef.current += 0.005;
            state.phi = phiRef.current + rs.get();
            state.width = widthRef.current * 2;
            state.height = widthRef.current * 2;
          },
        });
        if (canvasRef.current) {
          setTimeout(() => {
            if (canvasRef.current) canvasRef.current.style.opacity = "1";
          }, 0);
        }
        cleanup = () => globe?.destroy();
      } catch (err) {
        console.warn("Globe disabled: cobe not installed.", err);
      }
    })();

    return () => {
      cleanup();
      window.removeEventListener("resize", onResize);
    };
  }, [rs, config]);

  return (
    <div className={cn("mx-auto aspect-[1/1] w-full max-w-[600px]", className)}>
      <canvas
        className="size-[30rem] opacity-0 transition-opacity duration-500"
        ref={canvasRef}
        onPointerDown={(e) => {
          pointerInteracting.current = e.clientX;
          updatePointerInteraction(e.clientX);
        }}
        onPointerUp={() => updatePointerInteraction(null)}
        onPointerOut={() => updatePointerInteraction(null)}
        onMouseMove={(e) => updateMovement(e.clientX)}
        onTouchMove={(e) =>
          e.touches[0] && updateMovement(e.touches[0].clientX)
        }
      />
    </div>
  );
}
