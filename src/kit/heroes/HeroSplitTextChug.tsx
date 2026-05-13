"use client";

/**
 * HeroSplitTextChug
 * Extracted from Spylt-awward-clone/src/sections/HeroSection.jsx.
 *
 * Pattern:
 *   - SplitText chars stagger reveal for title
 *   - clip-path polygon wipe-in for subtitle
 *   - scroll-triggered rotate + scale + translate on the whole hero container
 */
import { useRef } from "react";
import { useMediaQuery } from "@/kit/_hooks/useMediaQuery";
import { gsap, useGSAP, SplitText } from "@/kit/_utils/gsap-setup";

export type HeroSplitTextChugProps = {
  title?: string;
  subtitle?: string;
  body?: string;
  ctaLabel?: string;
  backgroundVideoSrc?: string;
  backgroundImageSrc?: string;
  className?: string;
};

export function HeroSplitTextChug({
  title = "Freaking Delicious",
  subtitle = "Protein + Caffeine",
  body = "Live life to the fullest with SPYLT: Shatter boredom and embrace your inner kid with every deliciously smooth chug.",
  ctaLabel = "Chug a SPYLT",
  backgroundVideoSrc,
  backgroundImageSrc,
  className,
}: HeroSplitTextChugProps) {
  const rootRef = useRef<HTMLElement>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");

  useGSAP(
    () => {
      const titleSplit = SplitText.create(".hero-title", { type: "chars" });
      const tl = gsap.timeline({ delay: 0.6 });
      tl.to(".hero-content", { opacity: 1, y: 0, ease: "power1.inOut" })
        .to(
          ".hero-text-scroll",
          {
            duration: 1,
            clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
            ease: "circ.out",
          },
          "-=0.5"
        )
        .from(
          titleSplit.chars,
          { yPercent: 200, stagger: 0.02, ease: "power2.out" },
          "-=0.5"
        );

      gsap
        .timeline({
          scrollTrigger: {
            trigger: ".hero-container",
            start: "1% top",
            end: "bottom top",
            scrub: true,
          },
        })
        .to(".hero-container", {
          rotate: 7,
          scale: 0.9,
          yPercent: 30,
          ease: "power1.inOut",
        });

      return () => titleSplit.revert();
    },
    { scope: rootRef }
  );

  return (
    <section
      ref={rootRef as React.Ref<HTMLElement>}
      className={`bg-blaze-bg ${className ?? ""}`}
    >
      <div className="hero-container relative h-[100svh] w-full overflow-hidden">
        {isTablet && backgroundImageSrc ? (
          <img
            src={backgroundImageSrc}
            className={
              isMobile
                ? "absolute bottom-40 size-full object-cover"
                : "absolute bottom-0 left-1/2 -translate-x-1/2"
            }
            alt=""
          />
        ) : backgroundVideoSrc ? (
          <video
            src={backgroundVideoSrc}
            autoPlay
            muted
            playsInline
            loop
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}

        <div className="hero-content relative z-10 flex h-full flex-col items-center justify-center gap-6 px-6 text-center opacity-100 md:opacity-100">
          <div className="overflow-hidden">
            <h1 className="hero-title font-display text-6xl font-black uppercase leading-[0.8] tracking-tight md:text-9xl">
              {title}
            </h1>
          </div>
          <div
            style={{ clipPath: "polygon(50% 0, 50% 0, 50% 100%, 50% 100%)" }}
            className="hero-text-scroll"
          >
            <div className="hero-subtitle text-2xl text-blaze-accent2 md:text-4xl">
              <h2>{subtitle}</h2>
            </div>
          </div>
          <h2 className="max-w-xl text-balance text-base text-blaze-muted md:text-xl">
            {body}
          </h2>
          <div className="hero-button mt-4 rounded-full bg-blaze-accent px-6 py-3 text-sm font-bold text-black">
            <p>{ctaLabel}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
