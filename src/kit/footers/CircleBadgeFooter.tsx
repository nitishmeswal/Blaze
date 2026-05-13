"use client";

/**
 * CircleBadgeFooter
 * Generalised from Fizzi-3D-Website/src/components/Footer.tsx.
 *
 * Wide footer with a centered logo and an oversized rotating circle badge
 * floating off the right edge.
 */
import { CircleText } from "@/kit/effects/CircleText";

export type CircleBadgeFooterProps = {
  brand?: string;
  bg?: string;
  fg?: string;
  badgeBg?: string;
  badgeFg?: string;
  className?: string;
};

export function CircleBadgeFooter({
  brand = "Blaze",
  bg = "#FEE832",
  fg = "#FE6334",
  badgeBg = "#FFFCFA",
  badgeFg = "#1A871D",
  className,
}: CircleBadgeFooterProps) {
  return (
    <footer
      style={{ backgroundColor: bg, color: fg }}
      className={className}
    >
      <div className="relative mx-auto flex w-full max-w-4xl justify-center px-4 py-10">
        <span className="font-display text-5xl font-black uppercase">
          {brand}
        </span>
        <div className="absolute right-24 top-0 size-28 origin-center -translate-y-14 md:size-48 md:-translate-y-28">
          <CircleText backgroundColor={badgeBg} textColor={badgeFg} />
        </div>
      </div>
    </footer>
  );
}
