"use client";

/**
 * SiteRenderer — walks a SiteSpec and mounts the matching kit
 * components in order. This is what lives inside the preview iframe.
 *
 * For Phase 1 we render purely DOM. Phase 3 will layer 3D placements
 * via R3F + CoordinateMapPlayer on top of each section.
 */
import { useMemo } from "react";
import { componentMap, isWired } from "@/builder/componentMap";
import type { SectionInvocation, SiteSpec } from "@/builder/types";

export function SiteRenderer({ spec }: { spec: SiteSpec }) {
  // Memoise so swapping in a structurally-identical spec doesn't
  // remount every section.
  const sections = useMemo(() => spec.sections, [spec.sections]);

  return (
    <main className="min-h-screen w-full bg-[var(--blaze-bg,#0a0a0a)] text-[var(--blaze-fg,#fafafa)]">
      {sections.map((section) => (
        <SectionMount key={section.id} section={section} />
      ))}
    </main>
  );
}

function SectionMount({ section }: { section: SectionInvocation }) {
  if (!isWired(section.componentId)) {
    return <UnwiredFallback section={section} />;
  }
  const Comp = componentMap[section.componentId];
  return (
    <section data-section-id={section.id} className="relative">
      <Comp {...section.props} />
    </section>
  );
}

function UnwiredFallback({ section }: { section: SectionInvocation }) {
  return (
    <section
      data-section-id={section.id}
      className="border-y border-dashed border-amber-500/40 bg-amber-500/5 p-8 text-amber-200"
    >
      <p className="text-xs uppercase tracking-widest text-amber-400">
        Component not yet wired
      </p>
      <p className="mt-2 font-mono text-sm">{section.componentId}</p>
      <p className="mt-1 text-xs opacity-70">
        The LLM picked this from the kit registry but the builder runtime
        hasn&apos;t wired it yet. Add it to{" "}
        <code className="font-mono">src/builder/componentMap.ts</code>.
      </p>
    </section>
  );
}
