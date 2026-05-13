import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { kitRegistry, type KitCategory, type KitEntry } from "@/kit/_registry";

export const metadata = {
  title: "Blaze — Kit",
  description:
    "Every cinematic component extracted from librarysite, generalized with props and grouped by category.",
};

export default function KitPage() {
  const grouped = kitRegistry.reduce<Record<string, KitEntry[]>>((acc, e) => {
    (acc[e.category] ||= []).push(e);
    return acc;
  }, {});
  const categories = Object.keys(grouped).sort() as KitCategory[];

  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-7xl px-5 py-10">
        <header className="mb-10">
          <h1 className="font-display text-4xl font-bold tracking-tight">Kit</h1>
          <p className="mt-2 max-w-2xl text-blaze-muted">
            {kitRegistry.length} battle-tested components extracted from
            award-winning sites and generalized with props. Browse below or
            jump straight into the{" "}
            <Link
              href="/planner"
              className="text-blaze-accent hover:text-blaze-accent2"
            >
              Coordinate Planner
            </Link>
            .
          </p>
        </header>
        <div className="flex flex-col gap-12">
          {categories.map((cat) => (
            <section key={cat}>
              <h2 className="mb-3 text-xs uppercase tracking-widest text-blaze-muted">
                {cat} ({grouped[cat].length})
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {grouped[cat].map((e) => (
                  <article
                    key={e.id}
                    className="rounded-xl border border-blaze-line bg-blaze-surface p-4"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="font-semibold text-blaze-text">
                        {e.name}
                      </h3>
                      <span className="text-[10px] uppercase tracking-wider text-blaze-muted">
                        {e.source}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-blaze-muted">
                      {e.description}
                    </p>
                    <code className="mt-2 block text-[10px] text-blaze-muted/80">
                      src/{e.path}
                    </code>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </>
  );
}
