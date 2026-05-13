"use client";

/**
 * ChugFooter
 * Extracted from Spylt-awward-clone/src/sections/FooterSection.jsx.
 *
 * Large "campaign-style" footer with a hero hash, social icons, link grid,
 * newsletter input, and copyright row.
 */
import { useMediaQuery } from "@/kit/_hooks/useMediaQuery";

export type ChugFooterProps = {
  hashtag?: string;
  splashVideoSrc?: string;
  fallbackImageSrc?: string;
  socials?: { label: string; href: string; iconSrc?: string }[];
  columns?: { heading: string; links: string[] }[];
  newsletterPrompt?: string;
  copyright?: string;
  legal?: string[];
  className?: string;
};

export function ChugFooter({
  hashtag = "#CHUGRESPONSIBLY",
  splashVideoSrc,
  fallbackImageSrc,
  socials = [
    { label: "YouTube", href: "#" },
    { label: "Instagram", href: "#" },
    { label: "TikTok", href: "#" },
  ],
  columns = [
    { heading: "Blaze Flavors", links: [] },
    { heading: "Community", links: ["Chug Club", "Student Marketing", "Dairy Dealers"] },
    { heading: "Company", links: ["Contacts", "Tasty Talk"] },
  ],
  newsletterPrompt = "Get Exclusive Early Access and Stay Informed About Product Updates, Events, and More!",
  copyright = "Copyright © 2026 Blaze - All Rights Reserved",
  legal = ["Privacy Policy", "Terms of Service"],
  className,
}: ChugFooterProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <section className={`footer-section relative ${className ?? ""}`}>
      <div className="relative pt-[10vh] md:pt-[20vh] 2xl:h-[110dvh]">
        <div className="z-10 overflow-hidden">
          <h1 className="general-title py-5 text-center font-display text-6xl font-black uppercase text-blaze-text md:text-[12vw]">
            {hashtag}
          </h1>
        </div>

        {isMobile && fallbackImageSrc ? (
          <img
            src={fallbackImageSrc}
            className="absolute top-0 object-contain"
            alt=""
          />
        ) : splashVideoSrc ? (
          <video
            src={splashVideoSrc}
            autoPlay
            playsInline
            muted
            className="absolute top-0 object-contain mix-blend-lighten"
          />
        ) : null}

        <div className="relative z-10 mt-5 flex items-center justify-center gap-5 md:mt-20">
          {socials.map((s) => (
            <a
              key={s.label}
              href={s.href}
              className="social-btn flex h-10 w-10 items-center justify-center rounded-full border border-blaze-line bg-blaze-surface text-xs"
              aria-label={s.label}
            >
              {s.iconSrc ? <img src={s.iconSrc} alt="" /> : s.label[0]}
            </a>
          ))}
        </div>

        <div className="mt-40 flex flex-col justify-between gap-10 px-5 font-medium text-blaze-text md:flex-row md:px-10 md:text-lg">
          <div className="flex items-center gap-5 md:gap-16">
            {columns.map((c) => (
              <div key={c.heading}>
                <p className="font-semibold">{c.heading}</p>
                {c.links.map((l) => (
                  <p key={l} className="text-blaze-muted">
                    {l}
                  </p>
                ))}
              </div>
            ))}
          </div>

          <div className="md:max-w-lg">
            <p>{newsletterPrompt}</p>
            <div className="flex items-center justify-between border-b border-[#D9D9D9] py-5 md:mt-10">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full bg-transparent placeholder:font-sans placeholder:text-[#999999] focus:outline-none"
              />
              <span aria-hidden>→</span>
            </div>
          </div>
        </div>

        <div className="copyright-box mt-20 flex flex-col items-center justify-between gap-3 px-5 pb-6 text-sm text-blaze-muted md:flex-row md:px-10">
          <p>{copyright}</p>
          <div className="flex items-center gap-7">
            {legal.map((l) => (
              <p key={l}>{l}</p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
