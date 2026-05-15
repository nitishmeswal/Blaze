import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,js,jsx,mdx}"],
  theme: {
    extend: {
      colors: {
        blaze: {
          // ── neutral surfaces ──
          // Layered grayscale used across the new shell. Each step is
          // ~5% lighter than the previous so cards/popovers read.
          bg: "#0a0a0c",
          surface: "#101013",
          surface2: "#16161b",
          line: "#1f1f27",
          line2: "#262631",
          text: "#f5f5f7",
          muted: "#a1a1aa",
          mutedDim: "#6b6b75",
          // ── accents ──
          accent: "#ff5a1f",
          accent2: "#ffb547",
          success: "#3ddc97",
          danger: "#ff5666",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Inter", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        // Soft inner-bevel for the shell topbar.
        "blaze-inset": "inset 0 -1px 0 0 rgba(255,255,255,0.05)",
        // Lifted-card shadow used for floating panels.
        "blaze-pop":
          "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 12px 32px -8px rgba(0,0,0,0.5)",
      },
      keyframes: {
        // Subtle pulse used by the "thinking" indicator.
        "blaze-pulse": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        "blaze-pulse": "blaze-pulse 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
