"use client";

/**
 * Word-by-word scroll-driven fade-in for a heading.
 * Extracted from Ironhill-section-rebuild's hero scroll text.
 *
 * Splits children text into words with `SplitText`, sets all to opacity 0.1,
 * then linearly fades each to 1 as the trigger's scrollProgress crosses
 * `wordIndex / totalWords`. Cinematic "word-by-word reveal" effect.
 */
import { useRef } from "react";
import { gsap, ScrollTrigger, SplitText, useGSAP } from "@/kit/_utils/gsap-setup";

export type ScrollWordFaderProps = {
  children: string;
  start?: string;
  end?: string;
  baseOpacity?: number;
  className?: string;
};

export function ScrollWordFader({
  children,
  start = "top 25%",
  end = "bottom 100%",
  baseOpacity = 0.1,
  className = "",
}: ScrollWordFaderProps) {
  const ref = useRef<HTMLHeadingElement>(null);

  useGSAP(
    () => {
      if (!ref.current) return;
      const split = new SplitText(ref.current, { type: "words" });
      const words = split.words;
      gsap.set(words, { opacity: baseOpacity });

      const trigger = ScrollTrigger.create({
        trigger: ref.current,
        start,
        end,
        onUpdate: (self) => {
          const progress = self.progress;
          const total = words.length;
          words.forEach((word, index) => {
            const wp = index / total;
            const next = (index + 1) / total;
            let opacity = baseOpacity;
            if (progress >= next) {
              opacity = 1;
            } else if (progress >= wp) {
              opacity = (progress - wp) / (next - wp);
            }
            gsap.to(word, { opacity, duration: 0.1, overwrite: true });
          });
        },
      });

      return () => {
        trigger.kill();
        split.revert();
      };
    },
    { scope: ref, dependencies: [children, start, end, baseOpacity] }
  );

  return (
    <h2 ref={ref} className={className}>
      {children}
    </h2>
  );
}
