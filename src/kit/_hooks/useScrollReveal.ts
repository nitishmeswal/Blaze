"use client";

import { useEffect, useRef } from "react";

/**
 * Lightweight IntersectionObserver-driven reveal hook.
 * Extracted from Personal-Portfolio.
 */
export function useScrollReveal<T extends HTMLElement>(
  options?: IntersectionObserverInit
) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            node.classList.add("revealed");
            obs.unobserve(node);
          }
        });
      },
      { threshold: 0.15, ...options }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [options]);

  return ref;
}
