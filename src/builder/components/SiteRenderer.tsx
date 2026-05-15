"use client";

/**
 * SiteRenderer — walks a SiteSpec and mounts the matching kit
 * components in order. This is what lives inside the preview iframe.
 *
 * Phase 1 rendered DOM-only sections.
 * Phase 3 layers a `<ThreeDLayer>` on top of any section whose spec
 * has `section.threeD` set. The layer is absolutely-positioned over
 * the section and has `pointer-events: none` so it never blocks the
 * studio's overlay click handler.
 */
import { useMemo } from "react";
import { componentMap, isWired } from "@/builder/componentMap";
import { ThreeDLayer } from "@/builder/components/ThreeDLayer";
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
      {section.threeD ? <ThreeDLayer placement={section.threeD} /> : null}
    </section>
  );
}

function UnwiredFallback({ section }: { section: SectionInvocation }) {
  return (
    <section
      data-section-id={section.id}
      className="relative border-y border-dashed border-amber-500/40 bg-amber-500/5 p-8 text-amber-200"
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
      {section.threeD ? <ThreeDLayer placement={section.threeD} /> : null}
    </section>
  );
}
