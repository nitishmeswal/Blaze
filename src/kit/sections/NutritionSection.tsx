"use client";

/**
 * NutritionSection
 * Extracted from Spylt-awward-clone/src/sections/NutritionSection.jsx.
 *
 * Pattern:
 *   - char stagger reveal of title
 *   - rotate + rise reveal of paragraph words
 *   - clip-path wipe for highlighted band
 *   - data-driven "stat row" with separators
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useMediaQuery } from "@/kit/_hooks/useMediaQuery";
import { gsap, useGSAP, SplitText } from "@/kit/_utils/gsap-setup";

export type Nutrient = { label: string; amount: string };

export type NutritionSectionProps = {
  title?: string;
  highlight?: string;
  paragraph?: string;
  items?: Nutrient[];
  mobileLimit?: number;
  className?: string;
};

const DEFAULT_ITEMS: Nutrient[] = [
  { label: "Potassium", amount: "245mg" },
  { label: "Calcium", amount: "500mg" },
  { label: "Vitamin A", amount: "176mcg" },
  { label: "Vitamin D", amount: "5mcg" },
  { label: "Iron", amount: "1mg" },
];

export function NutritionSection({
  title = "It still does",
  highlight = "Body Good",
  paragraph = "Milk contains a wide array of nutrients, including vitamins, minerals, and protein, and this is lactose free.",
  items = DEFAULT_ITEMS,
  mobileLimit = 3,
  className,
}: NutritionSectionProps) {
  const ref = useRef<HTMLElement>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [lists, setLists] = useState(items);

  useEffect(() => {
    setLists(isMobile ? items.slice(0, mobileLimit) : items);
  }, [isMobile, items, mobileLimit]);

  useGSAP(
    () => {
      const titleSplit = SplitText.create(".nutrition-title", { type: "chars" });
      const paragraphSplit = SplitText.create(".nutrition-section p", {
        type: "words, lines",
        linesClass: "paragraph-line",
      });
      gsap
        .timeline({
          scrollTrigger: { trigger: ".nutrition-section", start: "top center" },
        })
        .from(titleSplit.chars, {
          yPercent: 100,
          stagger: 0.02,
          ease: "power2.out",
        })
        .from(paragraphSplit.words, {
          yPercent: 300,
          rotate: 3,
          ease: "power1.inOut",
          duration: 1,
          stagger: 0.01,
        });

      gsap
        .timeline({
          scrollTrigger: { trigger: ".nutrition-section", start: "top 80%" },
        })
        .to(".nutrition-text-scroll", {
          duration: 1,
          opacity: 1,
          clipPath: "polygon(100% 0, 0 0, 0 100%, 100% 100%)",
          ease: "power1.inOut",
        });

      return () => {
        titleSplit.revert();
        paragraphSplit.revert();
      };
    },
    { scope: ref }
  );

  const visibleItems = useMemo(() => lists, [lists]);

  return (
    <section
      ref={ref as React.Ref<HTMLElement>}
      className={`nutrition-section py-20 ${className ?? ""}`}
    >
      <div className="mt-14 flex flex-col justify-between gap-10 px-5 md:mt-0 md:flex-row md:px-10">
        <div className="relative inline-block md:translate-y-20">
          <div className="general-title relative flex flex-col items-center justify-center gap-12">
            <div className="overflow-hidden place-self-start">
              <h1 className="nutrition-title font-display text-5xl font-black uppercase md:text-8xl">
                {title}
              </h1>
            </div>
            <div
              style={{ clipPath: "polygon(0 0, 0 0, 0 100%, 0% 100%)" }}
              className="nutrition-text-scroll place-self-start"
            >
              <div className="bg-blaze-accent px-3 pb-5 pt-3 md:px-5 md:pt-0">
                <h2 className="font-display text-5xl font-black uppercase text-blaze-bg md:text-8xl">
                  {highlight}
                </h2>
              </div>
            </div>
          </div>
        </div>

        <div className="flex translate-y-5 items-center md:justify-center">
          <div className="max-w-md md:max-w-xs">
            <p className="text-balance text-lg text-blaze-muted md:text-right">
              {paragraph}
            </p>
          </div>
        </div>

        <div className="nutrition-box">
          <div className="list-wrapper flex flex-col gap-6 rounded-2xl border border-blaze-line bg-blaze-surface p-6">
            {visibleItems.map((nutrient, index) => (
              <div
                key={nutrient.label}
                className="col-center relative flex-1 text-center"
              >
                <div>
                  <p className="text-blaze-muted md:text-lg">{nutrient.label}</p>
                  <p className="mt-2 text-sm text-blaze-muted">up to</p>
                  <p className="text-2xl font-bold tracking-tighter md:text-4xl">
                    {nutrient.amount}
                  </p>
                </div>
                {index !== visibleItems.length - 1 && (
                  <div className="spacer-border mt-4 h-px w-full bg-blaze-line" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
