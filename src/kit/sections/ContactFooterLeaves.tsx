"use client";

/**
 * ContactFooterLeaves
 * Extracted from mojito-awwwards-website/src/components/Contact.tsx.
 *
 * Footer with word-split heading, structured contact blocks, opening hours,
 * social icons, and parallax leaves rising slightly on scroll.
 */
import { useRef } from "react";
import { gsap, useGSAP, SplitText } from "@/kit/_utils/gsap-setup";

export type ContactBlock = { heading: string; lines: string[] };
export type ContactSocial = { name: string; url: string; icon?: string };

export type ContactFooterLeavesProps = {
  heading?: string;
  blocks?: ContactBlock[];
  socials?: ContactSocial[];
  leftLeafSrc?: string;
  rightLeafSrc?: string;
  className?: string;
};

export function ContactFooterLeaves({
  heading = "Where to Find Us",
  blocks = [],
  socials = [],
  leftLeafSrc,
  rightLeafSrc,
  className,
}: ContactFooterLeavesProps) {
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const titleSplit = SplitText.create("#contact h2", { type: "words" });
      gsap
        .timeline({
          scrollTrigger: { trigger: "#contact", start: "top center" },
          defaults: { ease: "power1.inOut" },
        })
        .from(titleSplit.words, {
          opacity: 0,
          yPercent: 100,
          stagger: 0.02,
        })
        .from("#contact h3, #contact p", {
          opacity: 0,
          yPercent: 100,
          stagger: 0.02,
        })
        .to("#f-right-leaf", {
          y: -50,
          duration: 1,
        })
        .to(
          "#f-left-leaf",
          {
            y: -50,
            duration: 1,
          },
          "<"
        );
      return () => titleSplit.revert();
    },
    { scope: ref }
  );

  return (
    <footer
      ref={ref as React.Ref<HTMLElement>}
      id="contact"
      className={`relative overflow-hidden ${className ?? ""}`}
    >
      {rightLeafSrc ? (
        <img
          src={rightLeafSrc}
          alt=""
          id="f-right-leaf"
          className="pointer-events-none absolute right-0 top-0 w-40"
        />
      ) : null}
      {leftLeafSrc ? (
        <img
          src={leftLeafSrc}
          alt=""
          id="f-left-leaf"
          className="pointer-events-none absolute left-0 top-0 w-40"
        />
      ) : null}
      <div className="content relative z-10 mx-auto grid max-w-5xl gap-10 px-6 py-24 md:grid-cols-2">
        <h2 className="font-display text-4xl md:col-span-2 md:text-6xl">
          {heading}
        </h2>
        {blocks.map((b) => (
          <div key={b.heading}>
            <h3 className="font-display text-xl">{b.heading}</h3>
            {b.lines.map((l, i) => (
              <p key={i} className="text-blaze-muted">
                {l}
              </p>
            ))}
          </div>
        ))}
        {socials.length > 0 && (
          <div>
            <h3 className="font-display text-xl">Socials</h3>
            <div className="mt-2 flex items-center gap-5">
              {socials.map((s) => (
                <a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.name}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-blaze-line bg-blaze-surface text-xs"
                >
                  {s.icon ? <img src={s.icon} alt="" /> : s.name[0]}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </footer>
  );
}
