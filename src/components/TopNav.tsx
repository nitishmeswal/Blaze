"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const tabs = [
  { href: "/", label: "Home" },
  { href: "/build", label: "Builder" },
  { href: "/kit", label: "Kit" },
  { href: "/planner", label: "Planner" },
  { href: "/docs", label: "Docs" },
];

export function TopNav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-50 border-b border-blaze-line/60 bg-blaze-bg/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-5 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-blaze-accent shadow-[0_0_12px_#ff5a1f]" />
          <span className="font-semibold tracking-tight">Blaze</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {tabs.map((t) => {
            const active =
              t.href === "/" ? pathname === "/" : pathname?.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={cn(
                  "rounded-md px-3 py-1.5 transition-colors",
                  active
                    ? "bg-blaze-line text-blaze-text"
                    : "text-blaze-muted hover:bg-blaze-line/60 hover:text-blaze-text"
                )}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto text-xs text-blaze-muted">
          v0.1 · cinematic kit + motion planner
        </div>
      </div>
    </header>
  );
}
