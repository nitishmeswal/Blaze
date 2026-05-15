"use client";

/**
 * Home — Lovable-style single-prompt landing.
 *
 * One question, one input, three example chips. Submitting routes
 * to `/build?prompt=…` which the builder picks up on first paint
 * and auto-fires the first generation, so the user goes from
 * landing to streaming response in one click.
 */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { kitRegistry } from "@/kit/_registry";

const EXAMPLES = [
  "A dark cinematic landing page for a fragrance brand called LUMIERE with gold accents",
  "A fitness brand landing page with hero, benefits, nutrition stats, and footer",
  "A studio portfolio site with a big 3D sphere in the hero and scroll-driven sections",
  "A SaaS marketing page with pricing, features, testimonials and a clean CTA",
];

export default function HomePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const count = kitRegistry.length;

  function submit(text: string) {
    const v = text.trim();
    if (!v) return;
    router.push(`/build?prompt=${encodeURIComponent(v)}`);
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-blaze-bg text-blaze-text">
      {/* Background washes */}
      <div className="pointer-events-none absolute inset-0 hero-glow" />
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />

      {/* Minimal header — just the wordmark and a couple of nav links. */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center px-6 py-5">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-blaze-accent/15">
            <span className="block h-2.5 w-2.5 rounded-sm bg-blaze-accent shadow-[0_0_12px_#ff5a1f]" />
          </span>
          <span className="text-sm font-semibold tracking-tight">Blaze</span>
        </Link>
        <nav className="ml-auto flex items-center gap-1 text-xs">
          <Link
            href="/kit"
            className="rounded-md px-3 py-1.5 text-blaze-muted hover:bg-blaze-surface hover:text-blaze-text"
          >
            Kit
          </Link>
          <Link
            href="/planner"
            className="rounded-md px-3 py-1.5 text-blaze-muted hover:bg-blaze-surface hover:text-blaze-text"
          >
            Planner
          </Link>
          <a
            href="https://github.com/nitishmeswal/Blaze"
            target="_blank"
            rel="noreferrer"
            className="rounded-md px-3 py-1.5 text-blaze-muted hover:bg-blaze-surface hover:text-blaze-text"
          >
            GitHub
          </a>
          <Link
            href="/build"
            className="ml-2 rounded-md bg-blaze-text px-3 py-1.5 text-xs font-semibold text-blaze-bg hover:bg-white"
          >
            Open builder
          </Link>
        </nav>
      </header>

      <main className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-6 pb-24 pt-20 sm:pt-32">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-blaze-line bg-blaze-surface/80 px-3 py-1 text-[11px] uppercase tracking-widest text-blaze-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-blaze-accent shadow-[0_0_8px_#ff5a1f]" />
          prompt → cinematic sites
        </span>

        <h1 className="text-balance text-center text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
          What do you want to{" "}
          <span className="bg-gradient-to-r from-blaze-accent via-blaze-accent2 to-blaze-text bg-clip-text text-transparent">
            build today?
          </span>
        </h1>
        <p className="mt-5 max-w-xl text-pretty text-center text-base text-blaze-muted">
          Describe a website. Blaze drafts it from a {count}-piece cinematic
          kit, then opens a Figma-style studio where you drag 3D models onto
          the real rendered page.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(prompt);
          }}
          className="mt-10 w-full"
        >
          <div className="group relative rounded-2xl border border-blaze-line bg-blaze-surface/90 shadow-blaze-pop transition-colors focus-within:border-blaze-accent/60">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit(prompt);
                }
              }}
              rows={3}
              placeholder="A dark cinematic portfolio for a 3D artist with…"
              className="block w-full resize-none bg-transparent px-5 py-4 text-base leading-relaxed outline-none placeholder:text-blaze-mutedDim"
            />
            <div className="flex items-center justify-between border-t border-blaze-line/70 px-3 py-2">
              <span className="text-[10px] uppercase tracking-widest text-blaze-mutedDim">
                enter to send · shift+enter for newline
              </span>
              <button
                type="submit"
                disabled={!prompt.trim()}
                className="rounded-md bg-blaze-accent px-3 py-1.5 text-xs font-semibold text-black hover:bg-blaze-accent2 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Build →
              </button>
            </div>
          </div>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => submit(ex)}
              className="rounded-full border border-blaze-line bg-blaze-surface/60 px-3 py-1.5 text-xs text-blaze-muted transition-colors hover:border-blaze-line2 hover:bg-blaze-surface hover:text-blaze-text"
            >
              {ex.length > 56 ? ex.slice(0, 56) + "…" : ex}
            </button>
          ))}
        </div>

        <section className="mt-24 grid w-full gap-3 sm:grid-cols-3">
          <FeatureTile
            title="Cinematic kit"
            body={`${count} battle-tested sections, hooks, and 3D primitives.`}
            href="/kit"
          />
          <FeatureTile
            title="Studio"
            body="Drag 3D models onto the actual rendered page, not a mockup."
            href="/studio"
          />
          <FeatureTile
            title="Planner"
            body="Author scroll-driven motion paths and export portable JSON."
            href="/planner"
          />
        </section>
      </main>
    </div>
  );
}

function FeatureTile({
  title,
  body,
  href,
}: {
  title: string;
  body: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-blaze-line bg-blaze-surface/60 p-4 transition-colors hover:border-blaze-line2 hover:bg-blaze-surface"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="text-blaze-mutedDim transition-colors group-hover:text-blaze-accent">
          →
        </span>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-blaze-muted">{body}</p>
    </Link>
  );
}
