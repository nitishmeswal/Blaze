"use client";

/**
 * BenefitSection
 * Extracted from Spylt-awward-clone/src/sections/BenefitSection.jsx.
 *
 * Stack of 4 ClipPathTitle cards that wipe in sequentially on scroll.
 */
import { useRef } from "react";
import { gsap, useGSAP } from "@/kit/_utils/gsap-setup";
import { ClipPathTitle } from "@/kit/text/ClipPathTitle";

export type BenefitItem = {
  title: string;
  color?: string;
  bg?: string;
  borderColor?: string;
};

export type BenefitSectionProps = {
  intro?: React.ReactNode;
  items?: BenefitItem[];
  outro?: string;
  className?: string;
};

const DEFAULT_ITEMS: BenefitItem[] = [
  { title: "Shelf stable", color: "#faeade", bg: "#c88e64" },
  { title: "Protein + Caffeine", color: "#222123", bg: "#faeade" },
  { title: "Infinitely recyclable", color: "#faeade", bg: "#7F3B2D" },
  { title: "Lactose free", color: "#2E2D2F", bg: "#FED775" },
];

export function BenefitSection({
  intro,
  items = DEFAULT_ITEMS,
  outro = "And much more …",
  className,
}: BenefitSectionProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({
        delay: 0.6,
        scrollTrigger: {
          trigger: ".benefit-section",
          start: "top 60%",
          end: "top top",
          scrub: 1.5,
        },
      });
      [".bt-0", ".bt-1", ".bt-2", ".bt-3"].forEach((sel) => {
        tl.to(`.benefit-section ${sel}`, {
          duration: 1,
          opacity: 1,
          clipPath: "polygon(0% 0%, 100% 0, 100% 100%, 0% 100%)",
          ease: "circ.out",
        });
      });
    },
    { scope: ref }
  );

  return (
    <section
      ref={ref as React.Ref<HTMLElement>}
      className={`benefit-section ${className ?? ""}`}
    >
      <div className="container mx-auto pt-20">
        <div className="flex flex-col items-center justify-center">
          <p className="text-center text-blaze-muted">
            {intro ?? (
              <>
                Unlock the Advantages: <br />
                Explore the Key Benefits.
              </>
            )}
          </p>
          <div className="mt-20 flex flex-col items-center justify-center gap-6">
            {items.map((b, i) => (
              <ClipPathTitle
                key={b.title}
                title={b.title}
                color={b.color}
                bg={b.bg}
                borderColor={b.borderColor}
                className={`bt-${i}`}
              />
            ))}
          </div>
          {outro && (
            <div className="mt-10 md:mt-0">
              <p>{outro}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
