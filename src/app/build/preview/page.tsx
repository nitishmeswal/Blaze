"use client";

/**
 * /build/preview — the iframe target.
 *
 * Listens for `postMessage({ kind: "blaze:set-spec", spec })` from the
 * parent /build page and renders the SiteSpec via SiteRenderer.
 *
 * Phase 3 additions:
 *   - When the parent is `/studio`, the preview reports back the
 *     bounding rects of every section so the studio can map an
 *     overlay click into the right `section.id` + section-local
 *     coordinates.
 *   - The preview re-reports rects on scroll / resize / spec change.
 *
 * Why an iframe at all?
 *   - Sandboxes the generated site's global styles / GSAP timelines
 *     from the builder chrome.
 *   - Mirrors what users get when they deploy — the preview matches
 *     a fresh page load.
 *   - Lets us swap to a real Vercel preview URL later with zero
 *     change to the parent UI.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { SiteRenderer } from "@/builder/components/SiteRenderer";
import { EMPTY_SITE_SPEC } from "@/builder/seedSpec";
import type { SiteSpec } from "@/builder/types";

interface SetSpecMessage {
  kind: "blaze:set-spec";
  spec: SiteSpec;
}

/**
 * Studio scrub message: drive the motion of a single placement to a
 * specific scroll progress (0..1) without scrolling the iframe. Lets
 * the studio preview a placement's motion path while authoring it.
 *
 * `progress` of null clears the override for that section so the
 * model resumes following real scroll.
 */
interface SetForcedProgressMessage {
  kind: "blaze:set-forced-progress";
  sectionId: string;
  progress: number | null;
}

/**
 * Scroll the iframe document to a specific y coordinate. Used by the
 * studio when the author wants to inspect a section's full scroll
 * range. We accept `behavior` so smooth-scroll feels intentional.
 */
interface ScrollToMessage {
  kind: "blaze:scroll-to";
  y: number;
  behavior?: "auto" | "smooth";
}

function isSetSpecMessage(data: unknown): data is SetSpecMessage {
  return (
    !!data &&
    typeof data === "object" &&
    (data as { kind?: unknown }).kind === "blaze:set-spec"
  );
}

function isSetForcedProgressMessage(
  data: unknown
): data is SetForcedProgressMessage {
  if (!data || typeof data !== "object") return false;
  const d = data as Partial<SetForcedProgressMessage>;
  return (
    d.kind === "blaze:set-forced-progress" &&
    typeof d.sectionId === "string" &&
    (d.progress === null || typeof d.progress === "number")
  );
}

function isScrollToMessage(data: unknown): data is ScrollToMessage {
  if (!data || typeof data !== "object") return false;
  const d = data as Partial<ScrollToMessage>;
  return d.kind === "blaze:scroll-to" && typeof d.y === "number";
}

interface SectionRect {
  id: string;
  /** Document-space top in iframe coords (incl. scrollY). */
  top: number;
  /** Document-space bottom. */
  bottom: number;
  /** Section width in CSS px. */
  width: number;
  /** Section height in CSS px. */
  height: number;
}

export default function BuildPreviewPage() {
  const [spec, setSpec] = useState<SiteSpec>(EMPTY_SITE_SPEC);
  const [forcedProgressBySectionId, setForcedProgress] = useState<
    Record<string, number>
  >({});
  const rootRef = useRef<HTMLDivElement>(null);

  /**
   * Walk every `[data-section-id]` element in the iframe and report
   * its bounding rect (in document coords) back to the parent. The
   * studio uses these to map overlay clicks into the right section.
   */
  const reportRects = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    const nodes = root.querySelectorAll<HTMLElement>("[data-section-id]");
    const rects: SectionRect[] = [];
    for (const node of Array.from(nodes)) {
      const r = node.getBoundingClientRect();
      const id = node.getAttribute("data-section-id");
      if (!id) continue;
      rects.push({
        id,
        top: r.top + window.scrollY,
        bottom: r.bottom + window.scrollY,
        width: r.width,
        height: r.height,
      });
    }
    window.parent?.postMessage(
      {
        kind: "blaze:section-rects",
        rects,
        scrollY: window.scrollY,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      },
      "*"
    );
  }, []);

  // Spec sync + scrub / scroll-to control channel from the parent.
  useEffect(() => {
    function onMessage(ev: MessageEvent) {
      if (isSetSpecMessage(ev.data)) {
        setSpec(ev.data.spec);
        return;
      }
      if (isSetForcedProgressMessage(ev.data)) {
        const { sectionId, progress } = ev.data;
        setForcedProgress((prev) => {
          if (progress === null) {
            // Clear override.
            if (!(sectionId in prev)) return prev;
            const next = { ...prev };
            delete next[sectionId];
            return next;
          }
          return { ...prev, [sectionId]: progress };
        });
        return;
      }
      if (isScrollToMessage(ev.data)) {
        window.scrollTo({
          top: ev.data.y,
          behavior: ev.data.behavior ?? "auto",
        });
        return;
      }
    }
    window.addEventListener("message", onMessage);
    // Announce readiness so the parent can push the initial spec.
    window.parent?.postMessage({ kind: "blaze:preview-ready" }, "*");
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // Re-report rects after every spec change, scroll, or resize.
  useEffect(() => {
    // Defer one frame so children have laid out.
    const id = requestAnimationFrame(() => reportRects());
    return () => cancelAnimationFrame(id);
  }, [spec, reportRects]);

  useEffect(() => {
    function onScroll() {
      window.parent?.postMessage(
        { kind: "blaze:scroll", scrollY: window.scrollY },
        "*"
      );
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", reportRects);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", reportRects);
    };
  }, [reportRects]);

  // Studio click forwarding. When the studio is active, the parent
  // sets `data-studio-active` on the document body via a setter
  // message; clicks in the iframe then bubble up as placement events.
  useEffect(() => {
    function onClick(ev: MouseEvent) {
      // Only forward clicks while the studio mode is active. The
      // studio sends a "blaze:studio-mode" message to enable.
      if (!document.body.dataset.studio) return;
      const target = ev.target as HTMLElement | null;
      const sec = target?.closest<HTMLElement>("[data-section-id]");
      if (!sec) return;
      const id = sec.getAttribute("data-section-id");
      if (!id) return;
      const rect = sec.getBoundingClientRect();
      const localX = ev.clientX - rect.left;
      const localY = ev.clientY - rect.top;
      window.parent?.postMessage(
        {
          kind: "blaze:section-click",
          sectionId: id,
          localX,
          localY,
          width: rect.width,
          height: rect.height,
        },
        "*"
      );
      ev.preventDefault();
      ev.stopPropagation();
    }
    function onMode(ev: MessageEvent) {
      const data = ev.data as { kind?: string; active?: boolean };
      if (data?.kind !== "blaze:studio-mode") return;
      if (data.active) document.body.dataset.studio = "1";
      else delete document.body.dataset.studio;
    }
    document.addEventListener("click", onClick, true);
    window.addEventListener("message", onMode);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("message", onMode);
    };
  }, []);

  return (
    <div ref={rootRef}>
      <SiteRenderer
        spec={spec}
        forcedProgressBySectionId={forcedProgressBySectionId}
      />
    </div>
  );
}
