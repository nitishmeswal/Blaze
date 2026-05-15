import type { SiteSpec } from "./types";
import { SITE_SPEC_VERSION } from "./types";

/**
 * Empty-state seed used by the builder when there is no spec yet.
 *
 * This is intentionally minimal — a single big-text section over a
 * dark background. It exists so the preview iframe always has
 * something to render, even before the user has prompted anything.
 *
 * The LLM is expected to replace this on the first user turn.
 */
export const EMPTY_SITE_SPEC: SiteSpec = {
  version: SITE_SPEC_VERSION,
  meta: {
    title: "Untitled site",
    description: "Built with Blaze.",
    themeColor: "#0a0a0a",
  },
  sections: [
    {
      id: "section-empty-state",
      componentId: "BigTextSection",
      props: {
        lines: ["Start with a", "prompt on the", "left ←"],
        bg: "#0a0a0a",
        color: "#ff5a1f",
      },
    },
  ],
};

/**
 * Demo seed showing how a "real" multi-section site looks. We use this
 * for /build's "Show me an example" affordance and for development.
 *
 * Picks 4 components that exist in the kit registry and a few props
 * each — no LLM call required. Once Phase 2 wires the LLM, the output
 * will look structurally identical to this; only the props change.
 */
export const DEMO_SITE_SPEC: SiteSpec = {
  version: SITE_SPEC_VERSION,
  meta: {
    title: "Blaze — demo site",
    description: "A demo built deterministically to prove the renderer.",
    themeColor: "#0a0a0a",
  },
  sections: [
    {
      id: "section-nav",
      componentId: "InlineLinkNavBar",
      props: {
        brand: "Blaze",
        links: [
          { id: "features", title: "Features" },
          { id: "kit", title: "Kit" },
          { id: "pricing", title: "Pricing" },
          { id: "contact", title: "Contact" },
        ],
      },
    },
    {
      id: "section-hero",
      componentId: "HeroSplitTextGradient",
      props: {
        title: "BLAZE",
        preTitle: "Cinematic. Scroll-driven. AI-built.",
        subtitleHtml: "Award-grade sites <br /> from a prompt.",
        body: "The first site builder that ships Awwwards-level scroll choreography and 3D scenes as easily as it ships shadcn components.",
        ctaLabel: "Get started",
        ctaHref: "#features",
      },
      background: {
        kind: "video",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        overlay: "rgba(10, 10, 10, 0.55)",
        opacity: 1,
        fit: "cover",
        loop: true,
        muted: true,
        autoplay: true,
      },
    },
    {
      id: "section-features",
      componentId: "BigTextSection",
      props: {
        lines: ["Prompt.", "Drag the 3D model.", "Ship the site."],
        bg: "#0a0a0a",
        color: "#ff5a1f",
      },
    },
    {
      id: "section-footer",
      componentId: "CircleBadgeFooter",
      props: {
        brand: "Blaze",
        bg: "#0a0a0a",
        fg: "#fafafa",
        badgeBg: "#ff5a1f",
        badgeFg: "#0a0a0a",
      },
    },
  ],
};
