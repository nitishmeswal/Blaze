"use client";

/**
 * TestimonialVideoPin
 * Extracted from Spylt-awward-clone/src/sections/TestimonialSection.jsx.
 *
 * Pattern:
 *   - three giant title rows translate horizontally on scroll
 *   - pinned area where video cards rise from below with stagger
 *   - hover play/pause on each video
 */
import { useRef } from "react";
import { gsap, useGSAP } from "@/kit/_utils/gsap-setup";

export type TestimonialCard = {
  src: string;
  rotation?: string;
  translation?: string;
  name?: string;
};

export type TestimonialVideoPinProps = {
  titles?: [string, string, string];
  cards: TestimonialCard[];
  className?: string;
};

export function TestimonialVideoPin({
  titles = ["What's", "Everyone", "Talking"],
  cards,
  className,
}: TestimonialVideoPinProps) {
  const ref = useRef<HTMLElement>(null);
  const vdRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useGSAP(
    () => {
      gsap.set(".testimonials-section", { marginTop: "-140vh" });
      gsap
        .timeline({
          scrollTrigger: {
            trigger: ".testimonials-section",
            start: "top bottom",
            end: "200% top",
            scrub: true,
          },
        })
        .to(".testimonials-section .first-title", { xPercent: 70 })
        .to(
          ".testimonials-section .sec-title",
          { xPercent: 25 },
          "<"
        )
        .to(
          ".testimonials-section .third-title",
          { xPercent: -50 },
          "<"
        );

      gsap
        .timeline({
          scrollTrigger: {
            trigger: ".testimonials-section",
            start: "10% top",
            end: "200% top",
            scrub: 1.5,
            pin: true,
          },
        })
        .from(".vd-card", {
          yPercent: 150,
          stagger: 0.2,
          ease: "power1.inOut",
        });
    },
    { scope: ref }
  );

  const handlePlay = (i: number) => vdRefs.current[i]?.play();
  const handlePause = (i: number) => vdRefs.current[i]?.pause();

  return (
    <section
      ref={ref as React.Ref<HTMLElement>}
      className={`testimonials-section relative h-screen overflow-hidden ${className ?? ""}`}
    >
      <div className="absolute flex size-full flex-col items-center pt-[5vw]">
        <h1 className="first-title font-display text-7xl font-black uppercase md:text-[12vw]">
          {titles[0]}
        </h1>
        <h1 className="sec-title font-display text-7xl font-black uppercase text-blaze-accent2 md:text-[12vw]">
          {titles[1]}
        </h1>
        <h1 className="third-title font-display text-7xl font-black uppercase md:text-[12vw]">
          {titles[2]}
        </h1>
      </div>

      <div className="pin-box absolute inset-0 flex items-center justify-center gap-6">
        {cards.map((card, index) => (
          <div
            key={index}
            className={`vd-card relative h-72 w-48 overflow-hidden rounded-xl md:h-96 md:w-64 ${card.translation ?? ""} ${card.rotation ?? ""}`}
            onMouseEnter={() => handlePlay(index)}
            onMouseLeave={() => handlePause(index)}
          >
            <video
              ref={(el) => {
                vdRefs.current[index] = el;
              }}
              src={card.src}
              playsInline
              muted
              loop
              className="size-full object-cover"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
