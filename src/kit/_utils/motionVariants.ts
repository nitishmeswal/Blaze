/**
 * Framer-motion variants extracted from SpacePortfolio.
 * Generic helpers for slide-in entrances from any direction.
 */

import type { Variants } from "framer-motion";

export function slideInFromLeft(delay = 0): Variants {
  return {
    hidden: { x: -100, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { delay, duration: 0.5 },
    },
  };
}

export function slideInFromRight(delay = 0): Variants {
  return {
    hidden: { x: 100, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { delay, duration: 0.5 },
    },
  };
}

export const slideInFromTop: Variants = {
  hidden: { y: -100, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { delay: 0.5, duration: 0.5 },
  },
};

export const slideInFromBottom: Variants = {
  hidden: { y: 100, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { delay: 0.5, duration: 0.5 },
  },
};

export function fadeIn(delay = 0, duration = 0.5): Variants {
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { delay, duration },
    },
  };
}

export function scaleIn(delay = 0): Variants {
  return {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { delay, duration: 0.5 },
    },
  };
}
