"use client";

/**
 * BackgroundLayer — renders a section's cinematic background behind
 * the section content. Today only the "video" kind is supported.
 *
 * The video sits absolutely-positioned inside the section, fills it,
 * pauses while offscreen (via IntersectionObserver) and resumes when
 * scrolled back in so we don't burn the user's GPU/battery on a dozen
 * simultaneously-playing background videos.
 *
 * A solid color "overlay" sits on top of the video to keep foreground
 * text legible — most cinematic sites do this and the LLM is taught
 * to favour darker overlays for hero content.
 */
import { useEffect, useRef } from "react";
import type { SectionBackground } from "@/builder/types";

export interface BackgroundLayerProps {
  background: SectionBackground;
}

export function BackgroundLayer({ background }: BackgroundLayerProps) {
  if (background.kind === "video") {
    return <BackgroundVideoLayer background={background} />;
  }
  return null;
}

function BackgroundVideoLayer({
  background,
}: {
  background: Extract<SectionBackground, { kind: "video" }>;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const loop = background.loop ?? true;
  const muted = background.muted ?? true;
  const autoplay = background.autoplay ?? true;
  const overlay = background.overlay ?? "rgba(10, 10, 10, 0.45)";
  const opacity = clamp01(background.opacity ?? 1);
  const fit = background.fit ?? "cover";

  // Pause when the section is fully offscreen, resume when it scrolls
  // back in. Saves a lot of GPU on long pages with multiple video
  // backgrounds.
  useEffect(() => {
    const video = videoRef.current;
    const wrap = wrapRef.current;
    if (!video || !wrap) return;
    if (!autoplay) return;

    let cancelled = false;
    const tryPlay = () => {
      const p = video.play();
      if (p && typeof p.catch === "function") {
        // Autoplay can fail (older browsers, user setting). Swallow
        // — the poster + overlay still give a reasonable look.
        p.catch(() => {});
      }
    };

    if (typeof IntersectionObserver === "undefined") {
      tryPlay();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (cancelled) return;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            tryPlay();
          } else {
            video.pause();
          }
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(wrap);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [autoplay, background.url]);

  return (
    <div
      ref={wrapRef}
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      <video
        ref={videoRef}
        src={background.url}
        poster={background.poster}
        loop={loop}
        muted={muted}
        autoPlay={autoplay}
        playsInline
        preload="metadata"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: fit,
          opacity,
          display: "block",
        }}
      />
      {overlay ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: overlay,
            pointerEvents: "none",
          }}
        />
      ) : null}
    </div>
  );
}

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 1;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}
