"use client";

/**
 * Simple wrapper that translates its children on the Y axis as the parent
 * trigger scrolls. Extracted from Ironhill's `hero__twig` parallax.
 *
 * Use to add cheap parallax to decorative elements (leaves, twigs, blobs).
 */
import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/kit/_utils/gsap-setup";

export type ScrollParallaxProps = {
  children: React.ReactNode;
  /** Distance to translate by (negative goes up). */
  yTo?: number;
  /** Selector to use as the ScrollTrigger trigger, or the element itself. */
  triggerSelector?: string;
  start?: string;
  end?: string;
  className?: string;
};

export function ScrollParallax({
  children,
  yTo = -1000,
  triggerSelector,
  start = "top top",
  end = "bottom top",
  className = "",
}: ScrollParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!ref.current) return;
      const trigger = triggerSelector ?? ref.current;
      const ctx = gsap.to(ref.current, {
        y: yTo,
        ease: "none",
        scrollTrigger: { trigger, start, end, scrub: true },
      });
      return () => {
        ctx.scrollTrigger?.kill();
        ctx.kill();
        ScrollTrigger.refresh();
      };
    },
    { scope: ref, dependencies: [yTo, triggerSelector, start, end] }
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
