"use client";

/**
 * ListsParallaxLeaves
 * Extracted from mojito-awwwards-website/src/components/Cocktails.tsx.
 *
 * Side-by-side menu lists with decorative leaf images that parallax in from
 * either edge as the section enters.
 */
import { useRef } from "react";
import { gsap, useGSAP } from "@/kit/_utils/gsap-setup";

export type MenuLine = {
  name: string;
  country?: string;
  detail?: string;
  price: string;
};

export type ListsParallaxLeavesProps = {
  leftLeafSrc?: string;
  rightLeafSrc?: string;
  primaryHeading?: string;
  secondaryHeading?: string;
  primaryItems?: MenuLine[];
  secondaryItems?: MenuLine[];
  className?: string;
};

export function ListsParallaxLeaves({
  leftLeafSrc,
  rightLeafSrc,
  primaryHeading = "Most popular cocktails:",
  secondaryHeading = "Most loved mocktails:",
  primaryItems = [],
  secondaryItems = [],
  className,
}: ListsParallaxLeavesProps) {
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      gsap
        .timeline({
          scrollTrigger: {
            trigger: "#cocktails",
            start: "top 30%",
            end: "bottom 80%",
            scrub: true,
          },
        })
        .from("#c-left-leaf", { x: -100, y: 100 })
        .from("#c-right-leaf", { x: 100, y: 100 });
    },
    { scope: ref }
  );

  const renderList = (items: MenuLine[]) => (
    <ul className="divide-y divide-blaze-line">
      {items.map((it) => (
        <li
          key={it.name}
          className="flex items-center justify-between gap-6 py-4"
        >
          <div className="md:me-28">
            <h3 className="font-display text-xl">{it.name}</h3>
            {(it.country || it.detail) && (
              <p className="text-sm text-blaze-muted">
                {it.country} {it.country && it.detail ? "| " : ""}
                {it.detail}
              </p>
            )}
          </div>
          <span className="text-blaze-accent2">- {it.price}</span>
        </li>
      ))}
    </ul>
  );

  return (
    <section
      ref={ref as React.Ref<HTMLElement>}
      id="cocktails"
      className={`relative overflow-hidden ${className ?? ""}`}
    >
      {leftLeafSrc ? (
        <img
          src={leftLeafSrc}
          alt=""
          id="c-left-leaf"
          className="pointer-events-none absolute -left-10 top-10 w-40"
        />
      ) : null}
      {rightLeafSrc ? (
        <img
          src={rightLeafSrc}
          alt=""
          id="c-right-leaf"
          className="pointer-events-none absolute -right-10 top-10 w-40"
        />
      ) : null}
      <div className="list relative z-10 mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-2">
        <div className="popular">
          <h2 className="mb-6 font-display text-3xl">{primaryHeading}</h2>
          {renderList(primaryItems)}
        </div>
        <div className="loved">
          <h2 className="mb-6 font-display text-3xl">{secondaryHeading}</h2>
          {renderList(secondaryItems)}
        </div>
      </div>
    </section>
  );
}
