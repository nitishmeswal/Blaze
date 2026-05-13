"use client";

/**
 * MaskedScrollReveal
 * Extracted from mojito-awwwards-website/src/components/Art.tsx.
 *
 * Pinned section. Surrounding content fades out, a CSS-mask image scales up
 * and its mask grows to reveal a final headline + body underneath.
 */
import { useRef } from "react";
import { useMediaQuery } from "@/kit/_hooks/useMediaQuery";
import { gsap, useGSAP } from "@/kit/_utils/gsap-setup";

export type MaskedScrollRevealProps = {
  topTitle?: string;
  leftBullets?: string[];
  rightBullets?: string[];
  centerImageSrc?: string;
  maskTitle?: string;
  revealHeading?: string;
  revealBody?: string;
  checkIconSrc?: string;
  className?: string;
};

export function MaskedScrollReveal({
  topTitle = "The ART",
  leftBullets = [],
  rightBullets = [],
  centerImageSrc,
  maskTitle = "Sip-Worthy Perfection",
  revealHeading = "Made with Craft, Poured with Passion",
  revealBody = "This isn't just a drink. It's a carefully crafted moment made just for you.",
  checkIconSrc,
  className,
}: MaskedScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery("(max-width: 767px)");

  useGSAP(
    () => {
      const start = isMobile ? "top 20%" : "top top";
      gsap
        .timeline({
          scrollTrigger: {
            trigger: "#art",
            start,
            scrub: 1.5,
            pin: true,
          },
        })
        .to(".will-fade", {
          opacity: 0,
          stagger: 0.2,
          ease: "power1.inOut",
        })
        .to(".masked-img", {
          scale: 1.3,
          maskPosition: "center",
          maskSize: "400%",
          duration: 1,
          ease: "power1.inOut",
        })
        .to("#masked-content", {
          opacity: 1,
          duration: 1,
          ease: "power1.inOut",
        });
    },
    { scope: ref, dependencies: [isMobile] }
  );

  const Bullet = ({ text }: { text: string }) => (
    <li className="flex items-center gap-2">
      {checkIconSrc ? (
        <img src={checkIconSrc} alt="" className="h-4 w-4" />
      ) : (
        <span className="text-blaze-accent2">✓</span>
      )}
      <p>{text}</p>
    </li>
  );

  return (
    <div ref={ref} id="art" className={`relative h-screen ${className ?? ""}`}>
      <div className="container mx-auto h-full pt-20">
        <h2 className="will-fade text-center font-display text-5xl uppercase md:text-7xl">
          {topTitle}
        </h2>
        <div className="content mt-12 grid items-center gap-6 md:grid-cols-3">
          <ul className="will-fade space-y-4">
            {leftBullets.map((b) => (
              <Bullet key={b} text={b} />
            ))}
          </ul>
          <div className="cocktail-img relative h-[60vh]">
            {centerImageSrc ? (
              <img
                src={centerImageSrc}
                alt=""
                className="abs-center masked-img size-full object-contain"
              />
            ) : null}
          </div>
          <ul className="will-fade space-y-4">
            {rightBullets.map((b) => (
              <Bullet key={b} text={b} />
            ))}
          </ul>
        </div>
        <div className="masked-container abs-center text-center">
          <h2 className="will-fade font-display text-4xl md:text-6xl">
            {maskTitle}
          </h2>
          <div
            id="masked-content"
            className="mt-6 opacity-0"
          >
            <h3 className="font-display text-2xl">{revealHeading}</h3>
            <p className="mt-2 text-blaze-muted">{revealBody}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
