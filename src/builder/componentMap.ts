/**
 * Builder → Kit component map.
 *
 * The LLM emits component invocations by id (matching `kitRegistry`).
 * To render those at runtime we need a static map from id →
 * React component reference. Dynamic `import()` by string path tree-
 * shakes badly in Next.js's app router, so we use an explicit static
 * map keyed by `componentId`.
 *
 * Phase 1 wires the most common shapes (nav / hero / section / footer
 * + the kitchen-sink BigText) so the seed spec and DEMO_SITE_SPEC
 * render. Subsequent PRs extend this map to cover the full registry
 * — the registry is the source of truth, this is the runtime binding.
 *
 * Adding a new component:
 *   1. Confirm an entry exists in `src/kit/_registry.ts`.
 *   2. Add a row below with the matching `id` and a default-export-style
 *      function component reference.
 *   3. If the component declares optional props with sensible defaults
 *      you don't need to do anything else. If it requires props, make
 *      sure the seed / demo / generator passes them.
 */
import type { ComponentType } from "react";

import { InlineLinkNavBar } from "@/kit/navigation/InlineLinkNavBar";
import { LogoNavBar } from "@/kit/navigation/LogoNavBar";
import { HeroSplitTextGradient } from "@/kit/heroes/HeroSplitTextGradient";
import { BigTextSection } from "@/kit/text/BigTextSection";
import { CircleBadgeFooter } from "@/kit/footers/CircleBadgeFooter";

export type AnyComponent = ComponentType<Record<string, unknown>>;

/**
 * Prop hint shown to the LLM so it picks the right prop names per
 * component. Keep these terse — the goal is "name + 1-word type",
 * not a docstring. Token-cheap and saves a wasted LLM turn fixing
 * mis-named props.
 */
export interface WiredComponent {
  component: AnyComponent;
  /** Comma-separated prop hints, in order of importance. */
  propsHint: string;
}

export const wired: Record<string, WiredComponent> = {
  InlineLinkNavBar: {
    component: InlineLinkNavBar as AnyComponent,
    propsHint: "brand:string, links:[{id,title}], logoSrc?:string",
  },
  LogoNavBar: {
    component: LogoNavBar as AnyComponent,
    propsHint: "brand:string, logoSrc?:string",
  },
  HeroSplitTextGradient: {
    component: HeroSplitTextGradient as AnyComponent,
    propsHint:
      "title:string, preTitle?:string, subtitleHtml?:string, body?:string, ctaLabel?:string, ctaHref?:string",
  },
  BigTextSection: {
    component: BigTextSection as AnyComponent,
    propsHint: "lines:string[], bg?:hex, color?:hex",
  },
  CircleBadgeFooter: {
    component: CircleBadgeFooter as AnyComponent,
    propsHint: "brand:string, bg?:hex, fg?:hex, badgeBg?:hex, badgeFg?:hex",
  },
};

/** Lookup map from componentId → React component. */
export const componentMap: Record<string, AnyComponent> = Object.fromEntries(
  Object.entries(wired).map(([id, w]) => [id, w.component])
);

/** All component ids the runtime currently knows how to mount. */
export const wiredComponentIds = Object.keys(wired);

export function isWired(componentId: string): boolean {
  return componentId in wired;
}
