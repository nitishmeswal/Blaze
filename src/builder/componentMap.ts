/**
 * Builder → Kit component map.
 *
 * The LLM emits component invocations by id (matching `kitRegistry`).
 * To render those at runtime we need a static map from id →
 * React component reference. Dynamic `import()` by string path tree-
 * shakes badly in Next.js's app router, so we use an explicit static
 * map keyed by `componentId`.
 *
 * Phase 1 wired 5 components (nav / hero / section / footer skeleton).
 * Phase 2 expands the map to 15 by adding hero variants, message /
 * benefit / data-row sections, and three additional footer styles
 * so the model can compose multi-section pages with visual variety.
 *
 * Adding a new component:
 *   1. Confirm an entry exists in `src/kit/_registry.ts`.
 *   2. Add a row below with the matching `id` and a default-export-style
 *      function component reference.
 *   3. Write a terse `propsHint` ("name:type, ...") so the model
 *      uses the correct prop names on the first try.
 *   4. If the component requires props with no defaults, make sure
 *      the system prompt's example covers them.
 */
import type { ComponentType } from "react";

import { InlineLinkNavBar } from "@/kit/navigation/InlineLinkNavBar";
import { LogoNavBar } from "@/kit/navigation/LogoNavBar";
import { MobileBackdropNavBar } from "@/kit/navigation/MobileBackdropNavBar";
import { PillSocialNavBar } from "@/kit/navigation/PillSocialNavBar";

import { HeroSplitTextGradient } from "@/kit/heroes/HeroSplitTextGradient";
import { HeroSplitTextChug } from "@/kit/heroes/HeroSplitTextChug";
import { HeroFlipWords } from "@/kit/heroes/HeroFlipWords";

import { BigTextSection } from "@/kit/text/BigTextSection";
import { ClipPathTitle } from "@/kit/text/ClipPathTitle";

import { MessageSectionFuelUp } from "@/kit/sections/MessageSectionFuelUp";
import { BenefitSection } from "@/kit/sections/BenefitSection";
import { NutritionSection } from "@/kit/sections/NutritionSection";

import { CircleBadgeFooter } from "@/kit/footers/CircleBadgeFooter";
import { ChugFooter } from "@/kit/footers/ChugFooter";
import { CommunityColumnsFooter } from "@/kit/footers/CommunityColumnsFooter";

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
  /** One-line description used in the system prompt's <components> block. */
  description: string;
}

export const wired: Record<string, WiredComponent> = {
  // ─── NAVIGATION ───────────────────────────────────────────────
  InlineLinkNavBar: {
    component: InlineLinkNavBar as AnyComponent,
    propsHint: "brand:string, links:[{id,title}], logoSrc?:string",
    description: "Top nav with inline link list; pairs with most heroes.",
  },
  LogoNavBar: {
    component: LogoNavBar as AnyComponent,
    propsHint: "brand:string, logoSrc?:string",
    description: "Minimal nav with just a logo / brand wordmark.",
  },
  MobileBackdropNavBar: {
    component: MobileBackdropNavBar as AnyComponent,
    propsHint: "brand?:string, brandHref?:string, links:[{id,label}]",
    description: "Frosted-backdrop nav that collapses to a hamburger on mobile.",
  },
  PillSocialNavBar: {
    component: PillSocialNavBar as AnyComponent,
    propsHint:
      "logo?:ReactNode, anchors:[{label,href}], socials?:[{label,href,icon?}]",
    description: "Blurred pill nav with center anchor links + right-side socials.",
  },

  // ─── HEROES ──────────────────────────────────────────────────
  HeroSplitTextGradient: {
    component: HeroSplitTextGradient as AnyComponent,
    propsHint:
      "title:string, preTitle?:string, subtitleHtml?:string, body?:string, ctaLabel?:string, ctaHref?:string",
    description: "Gradient char reveal hero with optional scrubbed BG video.",
  },
  HeroSplitTextChug: {
    component: HeroSplitTextChug as AnyComponent,
    propsHint:
      "title:string, subtitle?:string, body?:string, ctaLabel?:string, backgroundVideoSrc?:string",
    description: "Big SplitText hero + scroll-rotated card. Strong product feel.",
  },
  HeroFlipWords: {
    component: HeroFlipWords as AnyComponent,
    propsHint:
      "greeting?:string, topLine?:string, bottomLine?:string, flipWords?:string[]",
    description: "Personal-portfolio hero with a cycling word-flipper in the middle line.",
  },

  // ─── TEXT ────────────────────────────────────────────────────
  BigTextSection: {
    component: BigTextSection as AnyComponent,
    propsHint: "lines:string[], bg?:hex, color?:hex",
    description: "Full-bleed big-type section. Use for slogans / brand moments.",
  },
  ClipPathTitle: {
    component: ClipPathTitle as AnyComponent,
    propsHint: "title:string, color?:hex, bg?:hex, borderColor?:hex",
    description: "Card with a clip-path wipe-in title; great for callouts.",
  },

  // ─── SECTIONS ────────────────────────────────────────────────
  MessageSectionFuelUp: {
    component: MessageSectionFuelUp as AnyComponent,
    propsHint:
      "firstMessage?:string, highlight?:string, secondMessage?:string, paragraph?:string",
    description: "Two-line scroll-driven message with a clip-highlight word.",
  },
  BenefitSection: {
    component: BenefitSection as AnyComponent,
    propsHint: "items:[{title,color?,bg?,borderColor?}], outro?:string",
    description: "Sequentially-revealed stack of benefit cards.",
  },
  NutritionSection: {
    component: NutritionSection as AnyComponent,
    propsHint:
      "title?:string, highlight?:string, paragraph?:string, items:[{label,amount}]",
    description: "Title + paragraph + horizontal data row (specs / nutrition / stats).",
  },

  // ─── FOOTERS ─────────────────────────────────────────────────
  CircleBadgeFooter: {
    component: CircleBadgeFooter as AnyComponent,
    propsHint: "brand:string, bg?:hex, fg?:hex, badgeBg?:hex, badgeFg?:hex",
    description: "Compact footer with a circular brand badge.",
  },
  ChugFooter: {
    component: ChugFooter as AnyComponent,
    propsHint:
      "hashtag?:string, socials?:[{label,href}], columns?:[{heading,links:string[]}], newsletterPrompt?:string, copyright?:string",
    description: "Campaign-style footer with hashtag, socials, columns, newsletter.",
  },
  CommunityColumnsFooter: {
    component: CommunityColumnsFooter as AnyComponent,
    propsHint: "columns:[{title,links:[{label,href?}]}], copyright:string",
    description: "Multi-column community footer with bordered link sections.",
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
