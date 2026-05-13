"use client";

/**
 * ParallaxBackgroundLayers
 * Generalised from Personal-Portfolio/src/components/ParrallaxBackground.jsx.
 *
 * Stack of full-bleed background layers (e.g. sky, mountains, planets) that
 * parallax-translate on scroll. Pass each layer as a `Layer` with its image
 * and `[xRange, yRange]` translation ranges.
 */
import { motion, useScroll, useSpring, useTransform } from "framer-motion";

export type ParallaxLayer = {
  src: string;
  /** CSS translate values for both ends of scroll progress 0→0.5 */
  yRange?: [string, string];
  xRange?: [string, string];
  position?: string;
  size?: string;
  zIndex?: number;
};

export type ParallaxBackgroundLayersProps = {
  layers: ParallaxLayer[];
  className?: string;
};

export function ParallaxBackgroundLayers({
  layers,
  className,
}: ParallaxBackgroundLayersProps) {
  const { scrollYProgress } = useScroll();
  const sp = useSpring(scrollYProgress, { damping: 50 });

  return (
    <section className={`absolute inset-0 bg-black/40 ${className ?? ""}`}>
      <div className="relative h-screen overflow-y-hidden">
        {layers.map((layer, i) => (
          <ParallaxLayer key={`${layer.src}-${i}`} layer={layer} progress={sp} />
        ))}
      </div>
    </section>
  );
}

function ParallaxLayer({
  layer,
  progress,
}: {
  layer: ParallaxLayer;
  progress: ReturnType<typeof useSpring>;
}) {
  const y = useTransform(progress, [0, 0.5], layer.yRange ?? ["0%", "0%"]);
  const x = useTransform(progress, [0, 0.5], layer.xRange ?? ["0%", "0%"]);
  return (
    <motion.div
      className="absolute inset-0"
      style={{
        zIndex: layer.zIndex ?? 0,
        backgroundImage: `url(${layer.src})`,
        backgroundPosition: layer.position ?? "bottom",
        backgroundSize: layer.size ?? "cover",
        y,
        x,
      }}
    />
  );
}
