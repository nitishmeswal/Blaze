"use client";

import { cn } from "@/lib/cn";
import { Fragment } from "react";

/**
 * Split a string into per-word + per-char spans you can target with GSAP.
 * Word spans get `.word-display`; char spans get `.split-char`.
 *
 * Generalised from Fizzi-3D-Website/src/components/TextSplitter.tsx.
 */
export type TextSplitterProps = {
  text: string;
  wordDisplayStyle?: "inline-block" | "block" | "inline";
  className?: string;
};

export function TextSplitter({
  text,
  wordDisplayStyle = "inline-block",
  className,
}: TextSplitterProps) {
  if (!text) return null;
  const words = text.split(" ");
  return (
    <>
      {words.map((word, wi) => (
        <Fragment key={`${word}-${wi}`}>
          <span
            className={cn("word-display", className)}
            style={{ display: wordDisplayStyle }}
          >
            {word.split("").map((char, ci) => (
              <span
                key={`${char}-${ci}`}
                className="split-char"
                style={{ display: "inline-block" }}
              >
                {char}
              </span>
            ))}
          </span>
          {wi < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </>
  );
}
