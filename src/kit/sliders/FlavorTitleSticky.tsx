"use client";

/**
 * FlavorTitleSticky
 * Extracted from Spylt-awward-clone/src/components/FlavorTitle.jsx.
 *
 * Three-line title with character stagger reveal + middle line clip-path wipe.
 * Use as the left column of a section that pairs with HorizontalSliderPinned.
 */
import { useRef } from "react";
import { gsap, useGSAP, SplitText } from "@/kit/_utils/gsap-setup";

export type FlavorTitleStickyProps = {
  topLine?: string;
  highlight?: string;
  bottomLine?: string;
  triggerSelector?: string;
  className?: string;
};

export function FlavorTitleSticky({
  topLine = "We have 6",
  highlight = "freaking",
  bottomLine = "delicious flavors",
  triggerSelector = ".flavor-section",
  className,
}: FlavorTitleStickyProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const first = SplitText.create(".first-text-split h1", { type: "chars" });
      const second = SplitText.create(".second-text-split h1", { type: "chars" });
      gsap.from(first.chars, {
        yPercent: 200,
        stagger: 0.02,
        ease: "power1.inOut",
        scrollTrigger: { trigger: triggerSelector, start: "top 30%" },
      });
      gsap.to(".flavor-text-scroll", {
        duration: 1,
        clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
        scrollTrigger: { trigger: triggerSelector, start: "top 10%" },
      });
      gsap.from(second.chars, {
        yPercent: 200,
        stagger: 0.02,
        ease: "power1.inOut",
        scrollTrigger: { trigger: triggerSelector, start: "top 1%" },
      });

      gsap
        .timeline({
          scrollTrigger: {
            trigger: triggerSelector,
            start: "top top",
            end: "bottom 80%",
            scrub: true,
          },
        })
        .to(".first-text-split", { xPercent: -30, ease: "power1.inOut" })
        .to(
          ".flavor-text-scroll",
          { xPercent: -22, ease: "power1.inOut" },
          "<"
        )
        .to(
          ".second-text-split",
          { xPercent: -10, ease: "power1.inOut" },
          "<"
        );

      return () => {
        first.revert();
        second.revert();
      };
    },
    { scope: ref }
  );

  return (
    <div
      ref={ref}
      className={`general-title col-center flex h-full flex-col items-center justify-center gap-16 xl:gap-24 2xl:gap-32 ${className ?? ""}`}
    >
      <div className="first-text-split overflow-hidden py-3 2xl:py-0">
        <h1 className="font-display text-5xl font-black uppercase md:text-8xl">
          {topLine}
        </h1>
      </div>
      <div
        style={{ clipPath: "polygon(0 0, 0 0, 0 100%, 0% 100%)" }}
        className="flavor-text-scroll"
      >
        <div className="bg-blaze-accent2 px-3 pb-5 pt-3 2xl:px-5 2xl:pt-0">
          <h2 className="font-display text-5xl font-black uppercase text-blaze-bg md:text-8xl">
            {highlight}
          </h2>
        </div>
      </div>
      <div className="second-text-split overflow-hidden py-3 2xl:py-0">
        <h1 className="font-display text-5xl font-black uppercase md:text-8xl">
          {bottomLine}
        </h1>
      </div>
    </div>
  );
}
