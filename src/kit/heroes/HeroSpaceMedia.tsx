"use client";

/**
 * Two-column hero with eye-catching media + framer-motion staggered text.
 * Generalised from SpacePortfolio's HeroContent.
 *
 * Pairs perfectly with `<StarsBackground />` for a space-themed landing
 * page or with any looping video for a "cinematic" intro.
 *
 * Props:
 * - `chips`        — small pill labels at the top
 * - `headlineRows` — left-to-right typed rows. Use `[ "plain", { text: "...", gradient: true } ]`
 *                    to mark portions of a row as gradient text.
 * - `body`         — supporting paragraph
 * - `ctaLabel`     — primary button text
 * - `ctaHref`      — primary button link
 * - `mediaSrc`     — right-side image source
 * - `backgroundVideoSrc` — optional looping video behind the hero
 */
import { motion } from "framer-motion";
import {
  slideInFromLeft,
  slideInFromRight,
  slideInFromTop,
} from "@/kit/_utils/motionVariants";

export type GradientFragment = string | { text: string; gradient?: boolean };
export type HeroSpaceMediaProps = {
  chips?: string[];
  headlineRows: GradientFragment[][];
  body?: string;
  ctaLabel?: string;
  ctaHref?: string;
  mediaSrc?: string;
  mediaAlt?: string;
  backgroundVideoSrc?: string;
  gradientClass?: string;
  className?: string;
};

export function HeroSpaceMedia({
  chips,
  headlineRows,
  body,
  ctaLabel,
  ctaHref,
  mediaSrc,
  mediaAlt = "",
  backgroundVideoSrc,
  gradientClass = "bg-gradient-to-r from-purple-500 to-cyan-500",
  className = "",
}: HeroSpaceMediaProps) {
  return (
    <section className={`relative h-full w-full overflow-hidden ${className}`}>
      {backgroundVideoSrc ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 z-0 h-full w-full object-cover"
        >
          <source src={backgroundVideoSrc} type="video/webm" />
        </video>
      ) : null}

      <motion.div
        initial="hidden"
        animate="visible"
        className="relative z-10 mt-40 flex w-full flex-col-reverse items-center justify-center gap-10 px-5 md:flex-row md:gap-0 md:px-20"
      >
        <div className="flex h-full w-full flex-col justify-center gap-5 text-start md:w-3/6">
          {chips?.length ? (
            <div className="hidden flex-row items-center gap-1 md:flex md:gap-5">
              {chips.map((chip) => (
                <motion.div
                  key={chip}
                  variants={slideInFromTop}
                  className="border-purple/50 rounded-md border bg-white/5 px-2 py-1 text-xs uppercase tracking-wide opacity-90"
                >
                  {chip}
                </motion.div>
              ))}
            </div>
          ) : null}

          <motion.h1
            variants={slideInFromLeft(0.5)}
            className="z-20 mt-6 flex h-auto w-auto max-w-[600px] flex-col gap-6 text-4xl font-bold text-white md:text-5xl"
          >
            {headlineRows.map((row, ri) => (
              <span key={ri}>
                {row.map((frag, fi) => {
                  if (typeof frag === "string") return <span key={fi}>{frag}</span>;
                  if (frag.gradient) {
                    return (
                      <span
                        key={fi}
                        className={`bg-clip-text text-transparent ${gradientClass}`}
                      >
                        {" "}
                        {frag.text}{" "}
                      </span>
                    );
                  }
                  return <span key={fi}>{frag.text}</span>;
                })}
              </span>
            ))}
          </motion.h1>

          {body ? (
            <motion.p
              variants={slideInFromLeft(0.8)}
              className="my-5 max-w-[600px] text-lg text-gray-400"
            >
              {body}
            </motion.p>
          ) : null}

          {ctaLabel ? (
            <motion.a
              variants={slideInFromLeft(1)}
              href={ctaHref ?? "#"}
              className="z-20 max-w-[200px] cursor-pointer rounded-lg bg-purple-500 px-4 py-2 text-center text-white"
            >
              {ctaLabel}
            </motion.a>
          ) : null}
        </div>

        {mediaSrc ? (
          <motion.div
            variants={slideInFromRight(0.8)}
            className="flex h-full w-full items-center justify-center md:w-3/6"
          >
            { }
            <img
              src={mediaSrc}
              alt={mediaAlt}
              className="z-10 select-none"
              draggable={false}
            />
          </motion.div>
        ) : null}
      </motion.div>
    </section>
  );
}
