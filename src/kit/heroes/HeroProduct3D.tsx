"use client";

/**
 * HeroProduct3D
 * Generalised from Fizzi-3D-Website/src/slices/Hero/index.tsx + Scene.tsx.
 *
 * The DOM half of the Fizzi product-launch hero. Big stacked headline, smaller
 * subheading, body copy and CTA — all sequenced with a single intro timeline.
 * Pair with a fixed <Canvas> containing a `Scene` that animates your product
 * model in world space; provide that scene via the `scene` prop.
 */
import { useRef, type ReactNode } from "react";
import { useReadyStore } from "@/kit/_hooks/useReady";
import { useMediaQuery } from "@/kit/_hooks/useMediaQuery";
import { gsap, useGSAP } from "@/kit/_utils/gsap-setup";
import { TextSplitter } from "@/kit/_utils/TextSplitter";
import { Bounded } from "@/kit/_utils/Bounded";

export type HeroProduct3DProps = {
  heading?: string;
  subheading?: string;
  body?: string;
  buttonText?: string;
  buttonHref?: string;
  secondHeading?: string;
  secondBody?: string;
  fallbackImageSrc?: string;
  /** Pass a fully-formed JSX `<View>` / `<Scene>` to render the 3D layer. */
  scene?: ReactNode;
  /** Body color tween. Provide [start, end] CSS colors. */
  bodyColorScroll?: [string, string];
  className?: string;
};

export function HeroProduct3D({
  heading = "Refresh Reinvented",
  subheading = "Bold flavors, bolder fizz.",
  body = "Crack open the can — it's drink time.",
  buttonText = "Shop now",
  buttonHref = "#",
  secondHeading = "Tastes Like Summer",
  secondBody = "Every sip is a different kind of joy.",
  fallbackImageSrc,
  scene,
  bodyColorScroll = ["#FDE047", "#D9F99D"],
  className,
}: HeroProduct3DProps) {
  const ref = useRef<HTMLElement>(null);
  const ready = useReadyStore((s) => s.ready);
  const isDesktop = useMediaQuery("(min-width: 768px)", true);

  useGSAP(
    () => {
      if (!ready && isDesktop) return;

      gsap
        .timeline()
        .set(".hero", { opacity: 1 })
        .from(".hero-header-word", {
          scale: 3,
          opacity: 0,
          ease: "power4.in",
          delay: 0.3,
          stagger: 1,
        })
        .from(".hero-subheading", { opacity: 0, y: 30 }, "+=.8")
        .from(".hero-body", { opacity: 0, y: 10 })
        .from(".hero-button", { opacity: 0, y: 10, duration: 0.6 });

      gsap
        .timeline({
          scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "bottom bottom",
            scrub: 1.5,
          },
        })
        .fromTo(
          "body",
          { backgroundColor: bodyColorScroll[0] },
          { backgroundColor: bodyColorScroll[1], overwrite: "auto" },
          1
        )
        .from(".text-side-heading .split-char", {
          scale: 1.3,
          y: 40,
          rotate: -25,
          opacity: 0,
          stagger: 0.1,
          ease: "back.out(3)",
          duration: 0.5,
        })
        .from(".text-side-body", { y: 20, opacity: 0 });
    },
    { dependencies: [ready, isDesktop], scope: ref }
  );

  return (
    <Bounded ref={ref} className={`hero opacity-0 ${className ?? ""}`}>
      {scene ? scene : null}
      <div className="grid">
        <div className="grid h-screen place-items-center">
          <div className="grid auto-rows-min place-items-center text-center">
            <h1 className="hero-header text-7xl font-black uppercase leading-[.8] text-orange-500 md:text-[9rem] lg:text-[13rem]">
              <TextSplitter
                text={heading}
                wordDisplayStyle="block"
                className="hero-header-word"
              />
            </h1>
            <div className="hero-subheading mt-12 text-5xl font-semibold text-sky-950 lg:text-6xl">
              {subheading}
            </div>
            <div className="hero-body text-2xl font-normal text-sky-950">
              {body}
            </div>
            <a
              href={buttonHref}
              className="hero-button mt-12 rounded-xl bg-orange-600 px-5 py-4 text-center text-xl font-bold uppercase tracking-wide text-white transition-colors duration-150 hover:bg-orange-700 md:text-2xl"
            >
              {buttonText}
            </a>
          </div>
        </div>

        <div className="text-side relative z-[80] grid h-screen items-center gap-4 md:grid-cols-2">
          {fallbackImageSrc ? (
            <img
              src={fallbackImageSrc}
              alt=""
              className="w-full md:hidden"
            />
          ) : (
            <div />
          )}
          <div>
            <h2 className="text-side-heading text-balance text-6xl font-black uppercase text-sky-950 lg:text-8xl">
              <TextSplitter text={secondHeading} />
            </h2>
            <div className="text-side-body mt-4 max-w-xl text-balance text-xl font-normal text-sky-950">
              {secondBody}
            </div>
          </div>
        </div>
      </div>
    </Bounded>
  );
}
