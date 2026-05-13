"use client";

/**
 * AboutGridReveal
 * Extracted from mojito-awwwards-website/src/components/About.tsx.
 *
 * Word-split heading + two image grids (top, bottom) where each grid tile
 * fades in with a small stagger.
 */
import { useRef } from "react";
import { gsap, useGSAP, SplitText } from "@/kit/_utils/gsap-setup";

export type GridImage = { src: string; alt?: string; spanClass?: string };
export type AboutGridRevealProps = {
  badge?: string;
  heading?: React.ReactNode;
  body?: string;
  ratingValue?: string;
  ratingMax?: string;
  ratingNote?: string;
  topGrid?: GridImage[];
  bottomGrid?: GridImage[];
  className?: string;
};

export function AboutGridReveal({
  badge = "Best Cocktails",
  heading = (
    <>
      Where every detail matters <span className="text-blaze-accent2">-</span>
      from muddle to garnish
    </>
  ),
  body = "Every cocktail we serve is a reflection of our obsession with detail — from the first muddle to the final garnish. That care is what turns a simple drink into something truly memorable.",
  ratingValue = "4.5",
  ratingMax = "/5",
  ratingNote = "More than +12000 customers",
  topGrid = [],
  bottomGrid = [],
  className,
}: AboutGridRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const titleSplit = SplitText.create("#about h2", { type: "words" });
      gsap
        .timeline({
          scrollTrigger: { trigger: "#about", start: "top center" },
        })
        .from(titleSplit.words, {
          opacity: 0,
          duration: 1,
          yPercent: 100,
          ease: "expo.out",
          stagger: 0.02,
        })
        .from(
          ".top-grid div, .bottom-grid div",
          {
            opacity: 0,
            duration: 1,
            ease: "power1.inOut",
            stagger: 0.04,
          },
          "-=0.5"
        );
      return () => titleSplit.revert();
    },
    { scope: ref }
  );

  return (
    <div ref={ref} id="about" className={className}>
      <div className="mb-16 px-5 md:px-0">
        <div className="content grid gap-6 md:grid-cols-12">
          <div className="md:col-span-8">
            <p className="badge inline-block rounded-full border border-blaze-line bg-blaze-surface px-3 py-1 text-xs text-blaze-muted">
              {badge}
            </p>
            <h2 className="mt-4 font-display text-4xl font-bold md:text-6xl">
              {heading}
            </h2>
          </div>
          <div className="sub-content md:col-span-4">
            <p className="text-blaze-muted">{body}</p>
            <div className="mt-4">
              <p className="text-xl font-bold md:text-3xl">
                <span>{ratingValue}</span>
                {ratingMax}
              </p>
              <p className="text-sm text-blaze-muted">{ratingNote}</p>
            </div>
          </div>
        </div>
      </div>

      {topGrid.length > 0 && (
        <div className="top-grid grid gap-3 md:grid-cols-12">
          {topGrid.map((img, i) => (
            <div key={i} className={img.spanClass ?? "md:col-span-4"}>
              <img src={img.src} alt={img.alt ?? ""} className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      )}
      {bottomGrid.length > 0 && (
        <div className="bottom-grid mt-3 grid gap-3 md:grid-cols-12">
          {bottomGrid.map((img, i) => (
            <div key={i} className={img.spanClass ?? "md:col-span-6"}>
              <img src={img.src} alt={img.alt ?? ""} className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
