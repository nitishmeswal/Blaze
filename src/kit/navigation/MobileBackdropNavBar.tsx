"use client";

/**
 * MobileBackdropNavBar
 * Generalised from Personal-Portfolio/src/sections/Navbar.jsx.
 *
 * Fixed nav with a frosted background. Collapses to a hamburger on mobile,
 * uses framer-motion for the dropdown animation.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

export type NavLink = { id: string; label: string };
export type MobileBackdropNavBarProps = {
  brand?: string;
  brandHref?: string;
  links: NavLink[];
  openIconSrc?: string;
  closeIconSrc?: string;
  className?: string;
};

export function MobileBackdropNavBar({
  brand = "Blaze",
  brandHref = "/",
  links,
  openIconSrc,
  closeIconSrc,
  className,
}: MobileBackdropNavBarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const list = (
    <ul className="flex items-center gap-5 text-sm">
      {links.map((l) => (
        <li key={l.id}>
          <a
            href={`#${l.id}`}
            className="text-blaze-muted hover:text-blaze-text"
          >
            {l.label}
          </a>
        </li>
      ))}
    </ul>
  );

  return (
    <div
      className={cn(
        "fixed inset-x-0 z-20 w-full backdrop-blur-lg bg-blaze-bg/40",
        className
      )}
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-center justify-between py-2 sm:py-0">
          <a
            href={brandHref}
            className="text-xl font-bold text-blaze-muted hover:text-blaze-text"
          >
            {brand}
          </a>
          <button
            onClick={() => setIsOpen((v) => !v)}
            className="flex cursor-pointer text-blaze-muted hover:text-blaze-text sm:hidden"
            aria-label="Toggle menu"
          >
            {isOpen
              ? closeIconSrc && <img src={closeIconSrc} alt="close" className="w-6 h-6" />
              : openIconSrc && <img src={openIconSrc} alt="menu" className="w-6 h-6" />}
            {!openIconSrc && !closeIconSrc ? (isOpen ? "✕" : "≡") : null}
          </button>
          <nav className="hidden sm:flex">{list}</nav>
        </div>
      </div>
      {isOpen ? (
        <motion.div
          className="block overflow-hidden text-center sm:hidden"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ maxHeight: "100vh" }}
          transition={{ duration: 1 }}
        >
          <nav className="pb-5">{list}</nav>
        </motion.div>
      ) : null}
    </div>
  );
}
