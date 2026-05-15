"use client";

/**
 * TopNav — minimal top navigation used by document-style routes
 * (`/kit`, `/planner`). The editor routes (`/build`, `/studio`) use
 * the richer <AppShell> instead.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const tabs = [
  { href: "/", label: "Home" },
  { href: "/build", label: "Builder" },
  { href: "/studio", label: "Studio" },
  { href: "/kit", label: "Kit" },
  { href: "/planner", label: "Planner" },
];

export function TopNav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-50 border-b border-blaze-line/60 bg-blaze-bg/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-5 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-blaze-accent/15">
            <span className="block h-2 w-2 rounded-sm bg-blaze-accent shadow-[0_0_10px_#ff5a1f]" />
          </span>
          <span className="text-sm font-semibold tracking-tight">Blaze</span>
        </Link>
        <nav className="flex items-center gap-0.5 rounded-lg border border-blaze-line bg-blaze-surface p-0.5 text-xs">
          {tabs.map((t) => {
            const active =
              t.href === "/" ? pathname === "/" : pathname?.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={cn(
                  "rounded-md px-3 py-1 transition-colors",
                  active
                    ? "bg-blaze-line2 text-blaze-text"
                    : "text-blaze-muted hover:text-blaze-text"
                )}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto text-xs text-blaze-mutedDim">
          v0.3 · prompt → cinematic
        </div>
      </div>
    </header>
  );
}
