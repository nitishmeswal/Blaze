"use client";

/**
 * AlternatingText3D
 * Generalised from Fizzi-3D-Website/src/slices/AlternatingText.
 *
 * Vertical scroll list where each row alternates left/right and the body
 * background colour cross-fades. Pair with a sticky `<View>` 3D scene that
 * slides a single model side-to-side as the rows pass — the scene is up to
 * you, this just provides the DOM scaffold + bg color sequencing.
 */
import { useRef, type ReactNode } from "react";
import { gsap, useGSAP } from "@/kit/_utils/gsap-setup";
import { Bounded } from "@/kit/_utils/Bounded";
import { cn } from "@/lib/cn";

export type AlternatingTextRow = {
  heading: string;
  body: ReactNode;
};

export type AlternatingText3DProps = {
  rows: AlternatingTextRow[];
  bgColors?: string[];
  className?: string;
  scene?: ReactNode;
};

export function AlternatingText3D({
  rows,
  bgColors = ["#FFA6B5", "#E9CFF6", "#CBEF9A"],
  className,
  scene,
}: AlternatingText3DProps) {
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: ".alternating-text-view",
          endTrigger: ".alternating-text-container",
          pin: true,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
        },
      });
      rows.forEach((_, i) => {
        if (i === 0) return;
        tl.to(".alternating-text-container", {
          backgroundColor: gsap.utils.wrap(bgColors, i),
        });
      });
    },
    { dependencies: [rows.length], scope: ref }
  );

  return (
    <Bounded
      ref={ref}
      className={cn(
        "alternating-text-container relative",
        className
      )}
      style={{ backgroundColor: bgColors[0] } as React.CSSProperties}
    >
      <div>
        <div className="relative z-[100] grid">
          <div className="alternating-text-view absolute left-0 top-0 h-screen w-full">
            {scene}
          </div>
          {rows.map((row, index) => (
            <div
              key={`${row.heading}-${index}`}
              className="alternating-section grid h-screen place-items-center gap-x-12 md:grid-cols-2"
            >
              <div
                className={cn(
                  index % 2 === 0 ? "col-start-1" : "md:col-start-2",
                  "rounded-lg p-4 backdrop-blur-lg max-md:bg-white/30"
                )}
              >
                <h2 className="text-balance text-6xl font-bold">
                  {row.heading}
                </h2>
                <div className="mt-4 text-xl">{row.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Bounded>
  );
}
