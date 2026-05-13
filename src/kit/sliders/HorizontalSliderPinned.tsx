"use client";

/**
 * HorizontalSliderPinned
 * Extracted from Spylt-awward-clone/src/components/FlavorSlider.jsx.
 *
 * Pinned section that translates horizontally as the user scrolls vertically.
 * Renders one slide per item; tablet/mobile falls back to a regular flex row.
 */
import { useRef } from "react";
import { useMediaQuery } from "@/kit/_hooks/useMediaQuery";
import { gsap, useGSAP } from "@/kit/_utils/gsap-setup";

export type SlideItem = {
  id: string | number;
  /** Tailwind classes for rotation (e.g. "md:rotate-[8deg] rotate-0") */
  rotation?: string;
  /** Absolute-positioned backdrop image / svg */
  backdropSrc?: string;
  /** Main hero image / asset */
  imageSrc?: string;
  /** Optional decorative element layer */
  elementsSrc?: string;
  /** Headline shown on the slide */
  name: string;
};

export type HorizontalSliderPinnedProps = {
  items: SlideItem[];
  trailingPx?: number;
  /**
   * CSS selector or class that the GSAP timeline pins.
   * Must match the section className that wraps this slider (default `.flavor-section`).
   */
  sectionSelector?: string;
  className?: string;
};

export function HorizontalSliderPinned({
  items,
  trailingPx = 1500,
  sectionSelector = ".flavor-section",
  className,
}: HorizontalSliderPinnedProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const isTablet = useMediaQuery("(max-width: 1024px)");

  useGSAP(
    () => {
      const slider = sliderRef.current;
      if (!slider) return;
      if (isTablet) return;
      const scrollAmount = slider.scrollWidth - window.innerWidth;
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionSelector,
          start: "2% top",
          end: `+=${scrollAmount + trailingPx}px`,
          scrub: true,
          pin: true,
        },
      });
      tl.to(sectionSelector, {
        x: `-${scrollAmount + trailingPx}px`,
        ease: "power1.inOut",
      });
    },
    { dependencies: [isTablet, items.length] }
  );

  return (
    <div ref={sliderRef} className={`slider-wrapper ${className ?? ""}`}>
      <div className="flavors flex h-full items-center gap-10 px-10">
        {items.map((flavor) => (
          <div
            key={flavor.id}
            className={`relative z-30 h-80 w-96 flex-none md:h-[50vh] md:w-[90vw] lg:h-[70vh] lg:w-[50vw] ${flavor.rotation ?? ""}`}
          >
            {flavor.backdropSrc ? (
              <img src={flavor.backdropSrc} alt="" className="absolute bottom-0" />
            ) : null}
            {flavor.imageSrc ? (
              <img src={flavor.imageSrc} alt="" className="drinks relative z-10" />
            ) : null}
            {flavor.elementsSrc ? (
              <img src={flavor.elementsSrc} alt="" className="elements absolute" />
            ) : null}
            <h1 className="absolute left-1/2 top-0 -translate-x-1/2 font-display text-4xl font-black uppercase md:text-6xl">
              {flavor.name}
            </h1>
          </div>
        ))}
      </div>
    </div>
  );
}
