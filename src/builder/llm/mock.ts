/**
 * Mock provider.
 *
 * Default brain when no real LLM is wired. Returns a deterministic
 * SiteSpec patch shaped like what the real model will emit, so the
 * downstream code path (parser → renderer → preview iframe) can be
 * validated end-to-end without spinning up Ollama.
 *
 * The mock is intentionally dumb: it inspects the last user message
 * for keywords ("hero", "footer", "minimal", "dark", "fizzi", etc.)
 * and picks a section combo from the wired components.
 */
import { DEMO_SITE_SPEC, EMPTY_SITE_SPEC } from "../seedSpec";
import type { SiteSpec } from "../types";
import { SITE_SPEC_VERSION } from "../types";
import type {
  CompletionParams,
  CompletionResult,
  LLMProvider,
} from "./types";

export class MockProvider implements LLMProvider {
  readonly id = "mock" as const;
  readonly model = "mock:deterministic-v1";

  async complete(params: CompletionParams): Promise<CompletionResult> {
    const started = Date.now();
    const lastUser =
      [...params.messages].reverse().find((m) => m.role === "user")?.content ??
      "";
    const action = pickAction(lastUser);
    const payload = {
      explanation: action.explanation,
      spec: action.spec,
    };
    return {
      content: JSON.stringify(payload),
      model: this.model,
      latencyMs: Date.now() - started,
    };
  }
}

function pickAction(prompt: string): { explanation: string; spec: SiteSpec } {
  const p = prompt.toLowerCase();
  if (!p.trim() || p.includes("empty") || p.includes("clear")) {
    return {
      explanation: "Reset to an empty placeholder.",
      spec: EMPTY_SITE_SPEC,
    };
  }
  if (p.includes("demo") || p.includes("example") || p.includes("show me")) {
    return {
      explanation: "Loaded the demo: nav + cinematic hero + big text + footer.",
      spec: DEMO_SITE_SPEC,
    };
  }
  if (p.includes("minimal") || p.includes("logo only") || p.includes("plain")) {
    return {
      explanation: "Built a minimal page — logo nav, big text, footer.",
      spec: buildMinimal(prompt),
    };
  }
  // Fallback: take the prompt as the headline of a big-text section.
  return {
    explanation: `Inserted a big-text section using your prompt as the headline.`,
    spec: buildFromPromptAsHeadline(prompt),
  };
}

function buildMinimal(prompt: string): SiteSpec {
  const title = prompt.trim().slice(0, 32) || "Untitled";
  return {
    version: SITE_SPEC_VERSION,
    meta: { title, description: "Built with Blaze.", themeColor: "#0a0a0a" },
    sections: [
      {
        id: "section-nav",
        componentId: "LogoNavBar",
        props: { brand: title },
      },
      {
        id: "section-big",
        componentId: "BigTextSection",
        props: {
          lines: [title.toUpperCase()],
          bg: "#0a0a0a",
          color: "#ff5a1f",
        },
      },
      {
        id: "section-footer",
        componentId: "CircleBadgeFooter",
        props: {
          brand: title,
          bg: "#0a0a0a",
          fg: "#fafafa",
          badgeBg: "#ff5a1f",
          badgeFg: "#0a0a0a",
        },
      },
    ],
  };
}

function buildFromPromptAsHeadline(prompt: string): SiteSpec {
  const headline = prompt.trim();
  const words = headline.split(/\s+/).slice(0, 6);
  // Group words into 2–3 lines so the BigTextSection looks balanced.
  const lines: string[] = [];
  for (let i = 0; i < words.length; i += 2) {
    lines.push(words.slice(i, i + 2).join(" "));
  }
  return {
    version: SITE_SPEC_VERSION,
    meta: {
      title: headline.slice(0, 60) || "Untitled",
      description: "Built with Blaze.",
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
            { id: "pricing", title: "Pricing" },
            { id: "contact", title: "Contact" },
          ],
        },
      },
      {
        id: "section-headline",
        componentId: "BigTextSection",
        props: {
          lines: lines.length ? lines : ["Hello"],
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
}
