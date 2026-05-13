"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";

/**
 * Initialise a global Lenis smooth-scroll instance.
 * Pattern extracted from Ironhill-section-rebuild.
 *
 * Returns the Lenis instance via ref. Call this once near the top of the page.
 */
export function useLenis(opts?: ConstructorParameters<typeof Lenis>[0]) {
  const ref = useRef<Lenis | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const lenis = new Lenis(opts);
    ref.current = lenis;

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      ref.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ref;
}
