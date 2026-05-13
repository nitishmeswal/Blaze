"use client";

/**
 * DraggableCard
 * Generalised from Personal-Portfolio/src/components/Card.jsx.
 *
 * A small pill/image you can drag around inside a constrained container.
 * Useful for "interactive board" style sections where users can shuffle the
 * tech-stack cards or pin notes.
 */
import { motion, type MotionStyle } from "framer-motion";
import type { RefObject } from "react";

export type DraggableCardProps = {
  text?: string;
  image?: string;
  style?: MotionStyle;
  containerRef: RefObject<HTMLElement>;
  className?: string;
};

export function DraggableCard({
  text,
  image,
  style,
  containerRef,
  className,
}: DraggableCardProps) {
  if (image && !text) {
    return (
      <motion.img
        className={`absolute w-15 cursor-grab ${className ?? ""}`}
        src={image}
        style={style}
        whileHover={{ scale: 1.05 }}
        drag
        dragConstraints={containerRef}
        dragElastic={1}
      />
    );
  }
  return (
    <motion.div
      className={`absolute px-1 py-4 text-xl text-center rounded-full ring ring-gray-700 font-extralight bg-storm w-[12rem] cursor-grab ${className ?? ""}`}
      style={style}
      whileHover={{ scale: 1.05 }}
      drag
      dragConstraints={containerRef}
      dragElastic={1}
    >
      {text}
    </motion.div>
  );
}
