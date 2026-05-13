import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { kitRegistry } from "@/kit/_registry";

export default function HomePage() {
  const count = kitRegistry.length;
  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-7xl px-5 py-16">
        <section className="grid-bg relative overflow-hidden rounded-2xl border border-blaze-line p-10 sm:p-16">
          <div className="absolute inset-0 bg-gradient-to-br from-blaze-accent/10 via-transparent to-blaze-accent2/10" />
          <div className="relative">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-blaze-line bg-blaze-surface px-3 py-1 text-xs text-blaze-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-blaze-accent shadow-[0_0_8px_#ff5a1f]" />
              cinematic, scroll-driven, 3D landing pages
            </p>
            <h1 className="font-display text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl">
              Build award-grade
              <br />
              <span className="bg-gradient-to-r from-blaze-accent via-blaze-accent2 to-blaze-text bg-clip-text text-transparent">
                cinematic sites
              </span>
              ,&nbsp;visually.
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-lg text-blaze-muted">
              A complete kit of {count} battle-tested sections, primitives and 3D scenes
              pulled from award-winning sites — plus a visual coordinate planner that lets
              you draw the motion path your 3D model takes through the page and exports a
              clean JSON map a compiler / LLM can render.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/planner"
                className="rounded-md bg-blaze-accent px-4 py-2 text-sm font-medium text-black hover:bg-blaze-accent2"
              >
                Open Planner →
              </Link>
              <Link
                href="/kit"
                className="rounded-md border border-blaze-line bg-blaze-surface px-4 py-2 text-sm font-medium hover:bg-blaze-line/60"
              >
                Browse Kit ({count})
              </Link>
              <a
                href="https://github.com/nitishmeswal/Blaze"
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-blaze-line bg-blaze-surface px-4 py-2 text-sm font-medium hover:bg-blaze-line/60"
              >
                GitHub
              </a>
            </div>
          </div>
        </section>

        <section className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            title="Cinematic Kit"
            body="Every section, hook and 3D primitive extracted from Spylt, Mojito, Fizzi, Personal-Portfolio, SpacePortfolio and Ironhill — generalized with props and ready to drop in."
            cta={{ href: "/kit", label: "Browse components" }}
          />
          <FeatureCard
            title="Coordinate Planner"
            body="Visual canvas with mobile / tablet / desktop viewports. Drop 3D markers, draw motion paths, set scroll-progress keyframes, export a clean JSON coordinate map."
            cta={{ href: "/planner", label: "Open planner" }}
          />
          <FeatureCard
            title="Compile to GSAP / R3F"
            body="The planner output is a portable spec. Drop it next to your model file and a kit component reads it to play the exact motion you drew — at any breakpoint."
            cta={{ href: "/docs", label: "How it works" }}
          />
        </section>
      </main>
    </>
  );
}

function FeatureCard({
  title,
  body,
  cta,
}: {
  title: string;
  body: string;
  cta: { href: string; label: string };
}) {
  return (
    <div className="rounded-xl border border-blaze-line bg-blaze-surface p-6">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-blaze-muted">{body}</p>
      <Link
        href={cta.href}
        className="mt-4 inline-flex text-sm font-medium text-blaze-accent hover:text-blaze-accent2"
      >
        {cta.label} →
      </Link>
    </div>
  );
}
