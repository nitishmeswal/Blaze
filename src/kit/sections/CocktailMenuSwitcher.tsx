"use client";

/**
 * CocktailMenuSwitcher
 * Extracted from mojito-awwwards-website/src/components/Menu.tsx.
 *
 * Tab nav across the top, central feature image that slides in, prev/next
 * arrows, and a recipe panel. Re-runs the slide-in tween on currentIndex change.
 */
import { useState } from "react";
import { gsap, useGSAP } from "@/kit/_utils/gsap-setup";

export type CocktailSlide = {
  id: string | number;
  name: string;
  image: string;
  title: string;
  description: string;
};

export type CocktailMenuSwitcherProps = {
  slides: CocktailSlide[];
  initialIndex?: number;
  leftLeafSrc?: string;
  rightLeafSrc?: string;
  className?: string;
};

export function CocktailMenuSwitcher({
  slides,
  initialIndex = 0,
  leftLeafSrc,
  rightLeafSrc,
  className,
}: CocktailMenuSwitcherProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const total = slides.length;

  useGSAP(() => {
    gsap.fromTo("#title", { opacity: 0 }, { opacity: 1, duration: 1 });
    gsap.fromTo(
      ".cocktail img",
      { opacity: 0, xPercent: -100 },
      { xPercent: 0, opacity: 1, duration: 1, ease: "power1.inOut" }
    );
    gsap.fromTo(
      ".details h2",
      { yPercent: 100, opacity: 0 },
      { yPercent: 0, opacity: 1, ease: "power1.inOut" }
    );
    gsap.fromTo(
      ".details p",
      { yPercent: 100, opacity: 0 },
      { yPercent: 0, opacity: 1, ease: "power1.inOut" }
    );
  }, [currentIndex]);

  if (total === 0) return null;

  const goTo = (i: number) => setCurrentIndex(((i % total) + total) % total);
  const at = (offset: number) =>
    slides[((currentIndex + offset) % total + total) % total];
  const current = at(0);
  const prev = at(-1);
  const next = at(1);

  return (
    <section
      id="menu"
      aria-labelledby="menu-heading"
      className={`relative overflow-hidden ${className ?? ""}`}
    >
      {leftLeafSrc ? (
        <img
          src={leftLeafSrc}
          alt=""
          id="m-left-leaf"
          className="pointer-events-none absolute left-0 top-0 w-40"
        />
      ) : null}
      {rightLeafSrc ? (
        <img
          src={rightLeafSrc}
          alt=""
          id="m-right-leaf"
          className="pointer-events-none absolute right-0 top-0 w-40"
        />
      ) : null}

      <h2 id="menu-heading" className="sr-only">
        Cocktail Menu
      </h2>

      <nav
        className="cocktail-tabs mx-auto flex max-w-5xl items-center justify-center gap-5 px-6 pt-16"
        aria-label="Cocktail Navigation"
      >
        {slides.map((s, i) => {
          const active = i === currentIndex;
          return (
            <button
              key={s.id}
              onClick={() => goTo(i)}
              className={`border-b pb-1 text-sm uppercase tracking-widest ${
                active
                  ? "border-white text-white"
                  : "border-white/50 text-white/50"
              }`}
            >
              {s.name}
            </button>
          );
        })}
      </nav>

      <div className="content mx-auto mt-12 grid max-w-6xl gap-10 px-6 md:grid-cols-[1fr_2fr_1fr]">
        <div className="arrows flex flex-col items-start justify-center gap-6">
          <button onClick={() => goTo(currentIndex - 1)} className="text-left">
            <span className="text-sm text-blaze-muted">← {prev.name}</span>
          </button>
          <button onClick={() => goTo(currentIndex + 1)} className="text-left">
            <span className="text-sm text-blaze-muted">{next.name} →</span>
          </button>
        </div>

        <div className="cocktail flex items-center justify-center">
          <img
            key={current.image}
            src={current.image}
            alt={current.name}
            className="h-80 w-full object-contain md:h-[28rem]"
          />
        </div>

        <div className="recipe space-y-4">
          <div className="info">
            <p className="text-xs uppercase tracking-widest text-blaze-muted">
              Recipe for:
            </p>
            <p id="title" className="font-display text-3xl">
              {current.name}
            </p>
          </div>
          <div className="details">
            <h2 className="font-display text-2xl">{current.title}</h2>
            <p className="text-sm text-blaze-muted">{current.description}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
