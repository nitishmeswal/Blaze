"use client";

import { create } from "zustand";

/**
 * Tiny ready-flag store extracted from Fizzi-3D-Website.
 * Animations key off `ready` so they only fire after the 3D Canvas mounts.
 */
type ReadyState = {
  ready: boolean;
  isReady: () => void;
  reset: () => void;
};

export const useReadyStore = create<ReadyState>((set) => ({
  ready: false,
  isReady: () => set({ ready: true }),
  reset: () => set({ ready: false }),
}));
