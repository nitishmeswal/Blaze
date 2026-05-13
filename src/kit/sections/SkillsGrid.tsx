"use client";

/**
 * Two-column "skills" grid with framer-motion staggered icons.
 * Generalised from SpacePortfolio's Skills + SkillDataProvider.
 *
 * Pass `groups`: each group renders as a bordered panel with a gradient
 * title and a wrapped row of icon entries. Icons can be `<img>` URLs or
 * arbitrary JSX (e.g. `<SiReact />` from react-icons).
 */
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  slideInFromLeft,
  slideInFromRight,
  slideInFromTop,
} from "@/kit/_utils/motionVariants";

export type SkillIcon = {
  /** Pass a URL → renders as <img>. Pass JSX → renders as-is. */
  Image?: string;
  Node?: ReactNode;
  width?: number;
  height?: number;
  alt?: string;
};

export type SkillGroup = {
  title: string;
  side: "left" | "right";
  items: SkillIcon[];
};

export type SkillsGridProps = {
  heading?: string;
  highlight?: string;
  caption?: string;
  groups: SkillGroup[];
  gradientClass?: string;
  className?: string;
};

export function SkillsGrid({
  heading = "My",
  highlight = "Skills",
  caption,
  groups,
  gradientClass = "bg-gradient-to-r from-purple-500 to-cyan-500",
  className = "",
}: SkillsGridProps) {
  return (
    <section
      className={`relative flex h-fit flex-col items-center justify-center gap-3 overflow-hidden py-20 ${className}`}
    >
      <div className="flex h-auto w-full flex-col items-center justify-center pt-20">
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
        {caption ? (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false }}
            variants={slideInFromLeft(0.5)}
            className="mt-[10px] mb-10 text-center text-[20px] italic text-gray-200"
          >
            {caption}
          </motion.div>
        ) : null}
      </div>

      <div className="flex w-[95%] flex-col items-center justify-center gap-4">
        <div className="flex w-full flex-col items-center justify-between gap-4 lg:flex-row">
          {groups.map((group, gi) => (
            <div key={`${group.title}-${gi}`} className="h-full w-full lg:w-1/2">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false }}
                variants={
                  group.side === "left"
                    ? slideInFromLeft(0.5)
                    : slideInFromRight(0.5)
                }
                className="my-auto w-full rounded-md border border-purple-700/50 px-2 py-2 text-white opacity-90"
              >
                <span
                  className={`bg-clip-text text-2xl font-bold text-transparent ${gradientClass}`}
                >
                  {group.title}
                </span>
                <br />
                <div className="my-4 flex flex-row flex-wrap items-center justify-around gap-5">
                  {group.items.map((skill, si) => (
                    <SkillItem key={si} index={si} skill={skill} />
                  ))}
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SkillItem({ skill, index }: { skill: SkillIcon; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.3 }}
    >
      {skill.Node ? (
        skill.Node
      ) : skill.Image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={skill.Image}
          alt={skill.alt ?? "skill"}
          width={skill.width}
          height={skill.height}
        />
      ) : null}
    </motion.div>
  );
}
