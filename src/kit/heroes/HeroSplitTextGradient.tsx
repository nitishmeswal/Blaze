"use client";

/**
 * HeroSplitTextGradient
 * Extracted from mojito-awwwards-website/src/components/Hero.tsx.
 *
 * Pattern:
 *   - SplitText chars get a per-char `.text-gradient` class for fancy fills
 *   - Subtitle lines stagger in after the title
 *   - Parallax leaves on either side of the title
 *   - Hero <video> scrubs `currentTime` against scroll position (pinned)
 */
import { useRef } from "react";
import { useMediaQuery } from "@/kit/_hooks/useMediaQuery";
import { gsap, useGSAP, SplitText } from "@/kit/_utils/gsap-setup";

export type HeroSplitTextGradientProps = {
  title?: string;
  preTitle?: string;
  subtitleHtml?: string;
  body?: string;
  ctaLabel?: string;
  ctaHref?: string;
  leftLeafSrc?: string;
  rightLeafSrc?: string;
  videoSrc?: string;
  className?: string;
};

export function HeroSplitTextGradient({
  title = "MOJITO",
  preTitle = "Cool. Crisp. Classic.",
  subtitleHtml = "Sip the Spirit <br /> of Summer",
  body = "Every cocktail on our menu is a blend of premium ingredients, creative flair, and timeless recipes — designed to delight your senses.",
  ctaLabel = "View Cocktails",
  ctaHref = "#cocktails",
  leftLeafSrc,
  rightLeafSrc,
  videoSrc,
  className,
}: HeroSplitTextGradientProps) {
  const ref = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isMobile = useMediaQuery("(max-width: 767px)");

  useGSAP(
    () => {
      const heroSplit = new SplitText(".title", { type: "chars words" });
      const paragraphSplit = new SplitText(".subtitle", { type: "lines" });

      heroSplit.chars.forEach((c) => c.classList.add("text-gradient"));

      gsap.from(heroSplit.chars, {
        yPercent: 100,
        duration: 1.8,
        ease: "expo.out",
        stagger: 0.05,
      });
      gsap.from(paragraphSplit.lines, {
        opacity: 0,
        yPercent: 100,
        duration: 1.8,
        ease: "expo.out",
        stagger: 0.05,
        delay: 1,
      });

      gsap
        .timeline({
          scrollTrigger: {
            trigger: "#hero",
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        })
        .to(".right-leaf", { y: 200 }, 0)
        .to(".left-leaf", { y: -200 }, 0);

      const startValue = isMobile ? "top 50%" : "center 60%";
      const endValue = isMobile ? "120% top" : "bottom top";
      const vid = videoRef.current;
      if (vid) {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: "video",
            start: startValue,
            end: endValue,
            scrub: true,
            pin: true,
          },
        });
        vid.onloadedmetadata = () => {
          tl.to(vid, { currentTime: vid.duration });
        };
      }

      return () => {
        heroSplit.revert();
        paragraphSplit.revert();
      };
    },
    { scope: ref, dependencies: [isMobile] }
  );

  return (
    <>
      <section
        ref={ref as React.Ref<HTMLElement>}
        id="hero"
        className={`relative overflow-hidden ${className ?? ""}`}
      >
        <h1 className="title relative z-10 px-6 pt-24 text-center font-display text-7xl font-black uppercase leading-none md:pt-32 md:text-[12vw]">
          {title}
        </h1>
        {leftLeafSrc ? (
          <img
            src={leftLeafSrc}
            alt=""
            className="left-leaf pointer-events-none absolute left-0 top-1/4 w-32 md:w-64"
          />
        ) : null}
        {rightLeafSrc ? (
          <img
            src={rightLeafSrc}
            alt=""
            className="right-leaf pointer-events-none absolute right-0 top-1/4 w-32 md:w-64"
          />
        ) : null}

        <div className="body relative z-10 mt-12 grid gap-8 px-6 md:grid-cols-2 md:px-24">
          <div className="content">
            <div className="hidden space-y-5 md:block">
              <p className="text-sm uppercase tracking-widest text-blaze-muted">
                {preTitle}
              </p>
              <p
                className="subtitle font-display text-3xl md:text-5xl"
                dangerouslySetInnerHTML={{ __html: subtitleHtml }}
              />
            </div>
            <div className="view-cocktails mt-8 md:mt-0">
              <p className="subtitle max-w-md text-base text-blaze-muted md:text-lg">
                {body}
              </p>
              <a
                href={ctaHref}
                className="mt-4 inline-flex border-b border-blaze-text pb-1 text-sm font-medium uppercase tracking-widest"
              >
                {ctaLabel}
              </a>
            </div>
          </div>
        </div>
      </section>

      {videoSrc ? (
        <div className="video absolute inset-0">
          <video
            ref={videoRef}
            src={videoSrc}
            muted
            playsInline
            preload="auto"
          />
        </div>
      ) : null}
    </>
  );
}
