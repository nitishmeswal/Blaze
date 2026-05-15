"use client";

/**
 * /build/preview — the iframe target.
 *
 * Listens for `postMessage({ kind: "blaze:set-spec", spec })` from the
 * parent /build page and renders the SiteSpec via SiteRenderer.
 *
 * Why an iframe at all?
 *   - Sandboxes the generated site's global styles / GSAP timelines
 *     from the builder chrome.
 *   - Mirrors what users get when they deploy — the preview matches
 *     a fresh page load.
 *   - Lets us swap to a real Vercel preview URL later with zero
 *     change to the parent UI.
 */
import { useEffect, useState } from "react";
import { SiteRenderer } from "@/builder/components/SiteRenderer";
import { EMPTY_SITE_SPEC } from "@/builder/seedSpec";
import type { SiteSpec } from "@/builder/types";

interface SetSpecMessage {
  kind: "blaze:set-spec";
  spec: SiteSpec;
}

function isSetSpecMessage(data: unknown): data is SetSpecMessage {
  return (
    !!data &&
    typeof data === "object" &&
    (data as { kind?: unknown }).kind === "blaze:set-spec"
  );
}

export default function BuildPreviewPage() {
  const [spec, setSpec] = useState<SiteSpec>(EMPTY_SITE_SPEC);

  useEffect(() => {
    function onMessage(ev: MessageEvent) {
      if (!isSetSpecMessage(ev.data)) return;
      setSpec(ev.data.spec);
    }
    window.addEventListener("message", onMessage);
    // Announce readiness so the parent can push the initial spec.
    window.parent?.postMessage({ kind: "blaze:preview-ready" }, "*");
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return <SiteRenderer spec={spec} />;
}
