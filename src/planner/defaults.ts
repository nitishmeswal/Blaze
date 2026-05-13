import type {
  CoordinateMap,
  Easing,
  ModelDefaults,
  Viewport,
} from "./types";

export const DEFAULT_VIEWPORTS: Viewport[] = [
  {
    id: "mobile",
    name: "Mobile",
    width: 390,
    height: 3000,
    mediaQuery: "(max-width: 640px)",
  },
  {
    id: "tablet",
    name: "Tablet",
    width: 768,
    height: 3600,
    mediaQuery: "(min-width: 641px) and (max-width: 1023px)",
  },
  {
    id: "desktop",
    name: "Desktop",
    width: 1440,
    height: 4500,
    mediaQuery: "(min-width: 1024px)",
  },
];

export const DEFAULT_MODEL_DEFAULTS: ModelDefaults = {
  scale: 1,
  depth: 0,
  opacity: 1,
  easing: "power2.inOut",
};

export const EASINGS: Easing[] = [
  "linear",
  "power1.in",
  "power1.out",
  "power1.inOut",
  "power2.in",
  "power2.out",
  "power2.inOut",
  "power3.in",
  "power3.out",
  "power3.inOut",
  "power4.in",
  "power4.out",
  "power4.inOut",
  "back.in",
  "back.out",
  "back.inOut",
  "expo.in",
  "expo.out",
  "expo.inOut",
  "sine.in",
  "sine.out",
  "sine.inOut",
];

export const PATH_COLORS = [
  "#ff5a1f",
  "#ffd166",
  "#22d3ee",
  "#a78bfa",
  "#34d399",
  "#f472b6",
];

export const EMPTY_MAP: CoordinateMap = {
  version: 1,
  name: "Untitled Map",
  viewports: DEFAULT_VIEWPORTS,
  sections: [],
  paths: [],
  markers: [],
  modelDefaults: DEFAULT_MODEL_DEFAULTS,
};
