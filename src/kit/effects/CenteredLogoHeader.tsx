"use client";

/**
 * CenteredLogoHeader
 * Generalised from Fizzi-3D-Website/src/components/Header.tsx + FizziLogo.tsx.
 *
 * Compact, centred logo with an optional sub-message. Use for hero
 * compositions where the logo bleeds into a 3D scene below.
 */
import { cn } from "@/lib/cn";

export type CenteredLogoHeaderProps = {
  logoText?: string;
  logoSrc?: string;
  color?: string;
  className?: string;
};

export function CenteredLogoHeader({
  logoText = "Blaze",
  logoSrc,
  color = "#0c4a6e",
  className,
}: CenteredLogoHeaderProps) {
  return (
    <header className={cn("-mb-28 flex justify-center py-4", className)}>
      {logoSrc ? (
        <img src={logoSrc} alt={logoText} className="z-10 h-20" />
      ) : (
        <span
          className="z-10 font-display text-4xl font-black uppercase"
          style={{ color }}
        >
          {logoText}
        </span>
      )}
    </header>
  );
}
