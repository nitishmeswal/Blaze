import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,js,jsx,mdx}"],
  theme: {
    extend: {
      colors: {
        blaze: {
          bg: "#0a0a0f",
          surface: "#11111a",
          line: "#1f1f2c",
          text: "#e8e8ef",
          muted: "#9a9aab",
          accent: "#ff5a1f",
          accent2: "#ffb547",
          success: "#3ddc97",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Inter", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
