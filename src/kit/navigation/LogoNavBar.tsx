"use client";

/**
 * LogoNavBar
 * Extracted from Spylt-awward-clone/src/components/NavBar.jsx.
 *
 * Fixed, overlay nav with just a logo. Pair with hero scenes that bleed under it.
 */
import { cn } from "@/lib/cn";

export type LogoNavBarProps = {
  logoSrc?: string;
  logoText?: string;
  href?: string;
  className?: string;
};

export function LogoNavBar({
  logoSrc,
  logoText = "Blaze",
  href = "/",
  className,
}: LogoNavBarProps) {
  return (
    <nav
      className={cn(
        "fixed left-0 top-0 z-50 p-3 md:p-9",
        className
      )}
    >
      <a href={href} className="flex items-center gap-2">
        {logoSrc ? (
          <img src={logoSrc} alt={logoText} className="w-20 md:w-24" />
        ) : (
          <span className="font-display text-xl font-black uppercase tracking-tight md:text-2xl">
            {logoText}
          </span>
        )}
      </a>
    </nav>
  );
}
