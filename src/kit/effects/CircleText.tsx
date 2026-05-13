"use client";

/**
 * CircleText
 * Generalised from Fizzi-3D-Website/src/components/CircleText.tsx.
 *
 * SVG badge with text-on-a-circle. The text glyphs themselves are fully
 * embedded as paths in the source SVG; pass a custom `svgPaths` array to
 * supply your own. Default renders an empty circle.
 */
import { cn } from "@/lib/cn";

export type CircleTextProps = {
  textColor?: string;
  backgroundColor?: string;
  spinDuration?: number;
  className?: string;
  /** Optional inner SVG paths/elements (must be valid JSX) */
  inner?: React.ReactNode;
};

export function CircleText({
  textColor = "#1A871D",
  backgroundColor = "#FFFCFA",
  spinDuration = 16,
  className,
  inner,
}: CircleTextProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 123 123"
      className={cn("circle-text", className)}
      aria-label="circle badge"
    >
      <path fill={backgroundColor} d="M122 61.5a61 61 0 11-122 0 61 61 0 01122 0z" />
      <g
        style={{
          transformOrigin: "center",
          animation: `spin-slow ${spinDuration}s linear infinite`,
          fill: textColor,
        }}
      >
        {inner}
      </g>
      <style>{`
        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </svg>
  );
}
