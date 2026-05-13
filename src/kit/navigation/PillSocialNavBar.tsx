/**
 * Blurred pill-shaped nav with logo, center anchor links and social icons.
 * Generalised from SpacePortfolio's Navbar.
 */
import type { ReactNode } from "react";

export type NavLink = { label: string; href: string };
export type NavSocial = {
  label: string;
  href: string;
  icon: ReactNode;
};

export type PillSocialNavBarProps = {
  brand: string;
  logoSrc?: string;
  links: NavLink[];
  socials?: NavSocial[];
  className?: string;
};

export function PillSocialNavBar({
  brand,
  logoSrc,
  links,
  socials,
  className = "",
}: PillSocialNavBarProps) {
  return (
    <header
      className={`fixed top-0 z-50 m-0 h-[65px] w-screen items-center rounded-full bg-black/10 px-10 shadow-lg shadow-purple-900/20 backdrop-blur-md md:w-full max-w-[1855px] ${className}`}
    >
      <div className="m-auto flex h-full w-full flex-row items-center justify-between px-0 md:px-[10px]">
        <a href="#home" className="flex h-auto w-auto flex-row items-center">
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoSrc}
              alt="logo"
              width={40}
              height={40}
              className="w-10 cursor-pointer hover:animate-spin"
            />
          ) : null}
          <span className="ml-2 block text-lg font-bold text-gray-300 md:text-xl">
            {brand}
          </span>
        </a>

        <div className="hidden h-full w-3/6 flex-row items-center justify-between md:mx-auto md:flex lg:w-1/3 lg:pr-12">
          <div className="mr-4 flex h-auto w-full items-center justify-between rounded-full border border-purple-700/40 bg-black/30 px-5 py-2 text-gray-200">
            {links.map((link) => (
              <a key={link.href} href={link.href} className="cursor-pointer">
                {link.label}
              </a>
            ))}
          </div>
        </div>

        {socials?.length ? (
          <div className="flex flex-row gap-5 text-white">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                title={s.label}
                className="cursor-pointer hover:animate-spin"
              >
                {s.icon}
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </header>
  );
}
