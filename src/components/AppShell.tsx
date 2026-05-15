"use client";

/**
 * AppShell — the consistent topbar used across the editor routes
 * (`/build`, `/studio`, `/preview`, eventually `/code`).
 *
 * Layout:
 *   ┌─────────────────────────────────────────────────────────────┐
 *   │  ◆ Blaze   /  project name      [Chat] [Studio] [Preview]   │
 *   │                                            [Share] [Deploy] │
 *   └─────────────────────────────────────────────────────────────┘
 *
 * The shell is fixed-height (52 px) and the child fills the rest
 * of the viewport via `calc(100vh - 52px)` flex.
 *
 * Why a single shared shell and not per-page chrome?
 *   - The old `/build` had its own header inside its sidebar; the
 *     old `/studio` had a different header. They looked like two
 *     different products. Lovable / v0 / Cursor all use one
 *     persistent topbar with route tabs, so the editor feels like
 *     one app.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { DeployButton } from "@/components/DeployButton";

const TABS: { href: string; label: string; matchPrefix?: boolean }[] = [
  { href: "/build", label: "Chat" },
  { href: "/studio", label: "Studio" },
  { href: "/build/preview", label: "Preview", matchPrefix: true },
];

export type AppShellProps = {
  /** Right-aligned area inside the topbar (e.g. status pill, metrics). */
  right?: React.ReactNode;
  /** Project-name area shown after the logo. */
  projectName?: string;
  /** Body content. Fills the remaining viewport. */
  children: React.ReactNode;
  /**
   * If true, the body uses `h-[calc(100dvh-52px)]` and `overflow-hidden`.
   * Use for editor pages with their own scroll surfaces (chat, preview).
   * For document-style pages (Kit, Docs) leave this false and let the
   * page handle its own height.
   */
  fixedBody?: boolean;
};

export function AppShell({
  right,
  projectName = "Untitled Blaze site",
  children,
  fixedBody,
}: AppShellProps) {
  const pathname = usePathname() ?? "/";
  // When fixedBody is set we lock the outer to the exact viewport
  // height and let `<main>` flex-grow within it. This is more reliable
  // across browsers than `h-[calc(100dvh-52px)]` on main directly,
  // which interacts badly with `flex-1` (flex shorthand resets basis).
  return (
    <div
      className={cn(
        "flex flex-col bg-blaze-bg text-blaze-text",
        fixedBody ? "h-[100dvh] overflow-hidden" : "min-h-screen"
      )}
    >
      <TopBar pathname={pathname} right={right} projectName={projectName} />
      <main
        className={cn(
          "min-h-0 flex-1",
          fixedBody && "overflow-hidden"
        )}
      >
        {children}
      </main>
    </div>
  );
}

function TopBar({
  pathname,
  right,
  projectName,
}: {
  pathname: string;
  right?: React.ReactNode;
  projectName: string;
}) {
  return (
    <header className="sticky top-0 z-50 flex h-[52px] shrink-0 items-center gap-3 border-b border-blaze-line bg-blaze-bg/85 px-4 shadow-blaze-inset backdrop-blur">
      <Link href="/" className="flex items-center gap-2">
        <span className="relative grid h-6 w-6 place-items-center rounded-md bg-blaze-accent/15">
          <span className="block h-2 w-2 rounded-sm bg-blaze-accent shadow-[0_0_10px_#ff5a1f]" />
        </span>
        <span className="text-sm font-semibold tracking-tight">Blaze</span>
      </Link>

      <span className="text-blaze-mutedDim" aria-hidden>
        /
      </span>

      <button
        type="button"
        className="flex max-w-[260px] items-center gap-1.5 truncate rounded-md px-2 py-1 text-sm text-blaze-muted hover:bg-blaze-surface hover:text-blaze-text"
        title={projectName}
      >
        <span className="truncate">{projectName}</span>
        <ChevronDown className="h-3 w-3 shrink-0" />
      </button>

      <nav className="ml-4 hidden items-center gap-0.5 rounded-lg border border-blaze-line bg-blaze-surface p-0.5 sm:flex">
        {TABS.map((t) => {
          const active = t.matchPrefix
            ? pathname.startsWith(t.href)
            : pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-colors",
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

      <div className="ml-auto flex items-center gap-2 text-xs text-blaze-muted">
        {right}
        <button
          type="button"
          disabled
          title="Coming in Phase 4 — Deploy to Vercel"
          className="rounded-md border border-blaze-line bg-blaze-surface px-2.5 py-1 text-xs font-medium text-blaze-muted hover:border-blaze-line2 hover:text-blaze-text disabled:cursor-not-allowed disabled:opacity-50"
        >
          Share
        </button>
        <DeployButton />
      </div>
    </header>
  );
}

function ChevronDown(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 5l3 3 3-3" />
    </svg>
  );
}
