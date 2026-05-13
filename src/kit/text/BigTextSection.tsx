"use client";

/**
 * BigTextSection
 * Generalised from Fizzi-3D-Website/src/slices/BigText/index.tsx.
 *
 * Full-bleed typography section that scales to viewport width. Each row is
 * its own headline so you can stagger with GSAP downstream.
 */
import { cn } from "@/lib/cn";

export type BigTextSectionProps = {
  /** Array of rows. Each row gets its own `<div>` */
  lines?: string[];
  bg?: string;
  color?: string;
  className?: string;
};

export function BigTextSection({
  lines = ["Soda", "that makes you", "Smile"],
  bg = "#FE6334",
  color = "#FEE832",
  className,
}: BigTextSectionProps) {
  return (
    <section
      className={cn("min-h-screen w-full overflow-hidden", className)}
      style={{ backgroundColor: bg, color }}
    >
      <h2 className="grid w-full gap-[3vw] py-10 text-center font-black uppercase leading-[.7]">
        {lines.map((line, i) => (
          <div key={i} className="text-[18vw] md:text-[14vw]">
            {line}
          </div>
        ))}
      </h2>
    </section>
  );
}
