"use client";

/**
 * VideoCircleReveal
 * Extracted from Spylt-awward-clone/src/components/VideoPinSection.jsx.
 *
 * Pattern:
 *   - section pins on scroll
 *   - `clip-path: circle(6% at 50% 50%)` expands to `circle(100% at 50% 50%)`
 *   - reveals a full-screen video underneath
 */
import { useRef } from "react";
import { useMediaQuery } from "@/kit/_hooks/useMediaQuery";
import { gsap, useGSAP } from "@/kit/_utils/gsap-setup";

export type VideoCircleRevealProps = {
  videoSrc: string;
  startCircle?: number; // percent
  endCircle?: number; // percent
  className?: string;
  children?: React.ReactNode; // overlay content (e.g. play button)
};

export function VideoCircleReveal({
  videoSrc,
  startCircle = 6,
  endCircle = 100,
  className,
  children,
}: VideoCircleRevealProps) {
  const ref = useRef<HTMLElement>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");

  useGSAP(
    () => {
      if (isMobile) return;
      gsap
        .timeline({
          scrollTrigger: {
            trigger: ".vd-pin-section",
            start: "-15% top",
            end: "200% top",
            scrub: 1.5,
            pin: true,
          },
        })
        .to(".video-box", {
          clipPath: `circle(${endCircle}% at 50% 50%)`,
          ease: "power1.inOut",
        });
    },
    { scope: ref, dependencies: [isMobile] }
  );

  return (
    <section
      ref={ref as React.Ref<HTMLElement>}
      className={`vd-pin-section relative h-screen w-full overflow-hidden ${className ?? ""}`}
    >
      <div
        style={{
          clipPath: isMobile
            ? `circle(${endCircle}% at 50% 50%)`
            : `circle(${startCircle}% at 50% 50%)`,
        }}
        className="video-box absolute inset-0 h-full w-full"
      >
        <video
          src={videoSrc}
          playsInline
          muted
          loop
          autoPlay
          className="h-full w-full object-cover"
        />
        {children ? (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            {children}
          </div>
        ) : null}
      </div>
    </section>
  );
}
