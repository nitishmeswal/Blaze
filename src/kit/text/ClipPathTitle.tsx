"use client";

/**
 * ClipPathTitle
 * Extracted from Spylt-awward-clone/src/components/ClipPathTitle.jsx.
 *
 * Renders a banded heading inside a clipped reveal frame. Pair with a parent
 * timeline that animates `clipPath` to a full polygon to "wipe" it in.
 */
import { cn } from "@/lib/cn";

export type ClipPathTitleProps = {
  title: string;
  color?: string;
  bg?: string;
  borderColor?: string;
  className?: string;
};

export function ClipPathTitle({
  title,
  color = "#222123",
  bg = "#faeade",
  borderColor = "#222123",
  className,
}: ClipPathTitleProps) {
  return (
    <div className="general-title">
      <div
        style={{
          clipPath: "polygon(50% 0, 50% 0, 50% 100%, 50% 100%)",
          borderColor,
        }}
        className={cn(
          "text-nowrap border-[.5vw] opacity-0",
          className
        )}
      >
        <div
          className="pb-5 pt-3 md:px-14 md:pt-0 px-3"
          style={{ backgroundColor: bg }}
        >
          <h2 className="font-display text-4xl font-black md:text-7xl" style={{ color }}>
            {title}
          </h2>
        </div>
      </div>
    </div>
  );
}
