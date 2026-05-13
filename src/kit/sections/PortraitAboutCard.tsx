"use client";

/**
 * Portrait + bio "about me" card.
 * Generalised from SpacePortfolio's About.tsx.
 *
 * Centered round avatar with gradient ring, name tag, justified bio paragraph,
 * and an optional italic tagline at the bottom.
 */
import { motion } from "framer-motion";
import {
  slideInFromBottom,
  slideInFromLeft,
  slideInFromRight,
  slideInFromTop,
} from "@/kit/_utils/motionVariants";

export type PortraitAboutCardProps = {
  /** Section title — first word stays plain, `highlight` is the gradient word. */
  heading?: string;
  highlight?: string;
  name: string;
  bio: string;
  tagline?: string;
  portraitSrc: string;
  portraitAlt?: string;
  gradientClass?: string;
  className?: string;
};

export function PortraitAboutCard({
  heading = "About",
  highlight = "Me",
  name,
  bio,
  tagline,
  portraitSrc,
  portraitAlt = "",
  gradientClass = "bg-gradient-to-r from-purple-500 to-cyan-500",
  className = "",
}: PortraitAboutCardProps) {
  return (
    <section
      className={`relative flex min-h-screen w-full flex-col items-center justify-center md:flex-row ${className}`}
    >
      <div className="z-[5] h-auto w-auto md:absolute md:top-[80px]">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false }}
          variants={slideInFromTop}
          className="z-50 pt-[5rem] pb-3 text-center text-[40px] font-medium text-gray-200 md:p-0"
        >
          {heading}
          <span className={`bg-clip-text text-transparent ${gradientClass}`}>
            {" "}
            {highlight}{" "}
          </span>
        </motion.div>
      </div>

      <div className="relative z-[20] flex h-auto w-auto flex-col items-center justify-start md:mt-[90px] lg:mt-12">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false }}
          variants={slideInFromLeft(0.5)}
          className={`flex h-auto w-auto flex-col items-center overflow-hidden rounded-full border-[6px] border-purple-700/60 ${gradientClass}`}
        >
          { }
          <img src={portraitSrc} alt={portraitAlt} width={250} />
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false }}
          variants={slideInFromRight(0.5)}
          className="z-[20] my-5 rounded-md border border-purple-700/50 px-3 py-2 opacity-90"
        >
          <h1 className="text-[20px] font-bold text-white">{name}</h1>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false }}
          variants={slideInFromBottom}
          className="z-[20] mb-5 w-[90%] rounded-md border border-purple-700/50 px-3 py-2 opacity-90 md:w-3/4"
        >
          <p className="w-full text-justify text-[16px] text-white">{bio}</p>
        </motion.div>
      </div>

      {tagline ? (
        <div className="absolute bottom-[-4rem] z-[20] px-[5px] md:bottom-[10px]">
          <div className="text-center text-[20px] font-medium italic text-gray-300">
            {tagline}
          </div>
        </div>
      ) : null}
    </section>
  );
}
