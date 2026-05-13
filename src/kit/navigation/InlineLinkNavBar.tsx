"use client";

/**
 * InlineLinkNavBar
 * Extracted from mojito-awwwards-website/src/components/Navbar.tsx.
 *
 * Top nav with logo + inline anchor links. Background tweens from transparent
 * to a translucent dark surface once the nav scrolls past the viewport.
 */
import { useRef } from "react";
import { gsap, useGSAP } from "@/kit/_utils/gsap-setup";

export type InlineLink = { id: string; title: string };
export type InlineLinkNavBarProps = {
  logoSrc?: string;
  brand?: string;
  links: InlineLink[];
  className?: string;
};

export function InlineLinkNavBar({
  logoSrc,
  brand = "Blaze",
  links,
  className,
}: InlineLinkNavBarProps) {
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      gsap.fromTo(
        "nav.blaze-inline-nav",
        { backgroundColor: "transparent" },
        {
          backgroundColor: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(10px)",
          duration: 1,
          ease: "power2.inOut",
          scrollTrigger: {
            trigger: "nav.blaze-inline-nav",
            start: "bottom top",
          },
        }
      );
    },
    { scope: ref }
  );

  return (
    <nav
      ref={ref as React.Ref<HTMLElement>}
      className={`blaze-inline-nav fixed inset-x-0 top-0 z-50 transition-colors ${className ?? ""}`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="#home" className="flex items-center gap-2">
          {logoSrc ? (
            <img src={logoSrc} alt={brand} className="h-6 w-6" />
          ) : null}
          <p className="font-display text-lg">{brand}</p>
        </a>
        <ul className="flex items-center gap-6 text-sm">
          {links.map((l) => (
            <li key={l.id}>
              <a href={`#${l.id}`} className="text-blaze-muted hover:text-blaze-text">
                {l.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
